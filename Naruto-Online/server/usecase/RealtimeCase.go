package usecase

import (
	"context"
	"github.com/google/uuid"
	"narutoserver/internal"
	"narutoserver/internal/auth"
	"narutoserver/repo"
)
import (
	"database/sql"
	"encoding/json"
	"strings"
)

type RealtimeCase struct{ ctx context.Context }

func (u *RealtimeCase) ExecuteLobby(param internal.ParamLobbyCommand) (*internal.DataLobbyCommand, error) {

	p, err := internal.CurrentPrincipal(u.ctx)

	if err != nil {

		return nil, err

	}

	receipts, err := repo.NewRequestReceiptRepo(u.ctx)

	if err != nil {

		return nil, internal.BusinessError(err)

	}

	fingerprint := param
	fingerprint.ConnectionID = uuid.Nil
	encoded, err := json.Marshal(fingerprint)

	if err != nil {

		return nil, internal.BusinessError(err)

	}

	value, duplicate, err := receipts.Execute(p.UserID, "ws", param.Type, param.RequestID, auth.Hash(encoded), func(tx *sql.Tx) ([]byte, error) {

		users, err := repo.NewUserRepoTx(u.ctx, tx)

		if err != nil {

			return nil, err

		}

		err = users.Lock(p.UserID)

		if err != nil {

			return nil, err

		}

		connections, err := repo.NewRealtimeConnectionRepoTx(u.ctx, tx)

		if err != nil {

			return nil, err

		}

		alive, err := connections.Alive(param.ConnectionID)

		if err != nil {

			return nil, err

		}

		if !alive {

			return nil, internal.Reject("UNAUTHENTICATED", "connection replaced or expired")

		}

		rooms, err := repo.NewRoomRepoTx(u.ctx, tx)

		if err != nil {

			return nil, err

		}

		room, err := rooms.Lock(param.RoomID)

		if err != nil {

			return nil, err

		}

		members, err := repo.NewRoomMemberRepoTx(u.ctx, tx)

		if err != nil {

			return nil, err

		}

		member, err := members.GetByKey(room.ID, p.UserID)

		if err != nil {

			return nil, err

		}

		outcome := "applied"
		var inviteCode *string
		if param.Type == "chat.send" {

			messages, err := repo.NewChatMessageRepoTx(u.ctx, tx)

			if err != nil {

				return nil, err

			}

			_, noop, err := messages.Send(room.ID, p.UserID, param.ClientMessageID, param.Text, auth.Hash([]byte(param.Text)))

			if err != nil {

				return nil, err

			}

			if noop {

				outcome = "noop"

			}

			return json.Marshal(internal.DataLobbyCommand{RequestID: param.RequestID, RoomVersion: room.RoomVersion, Outcome: outcome})

		}

		if room.RoomVersion != param.ExpectedRoomVersion {

			return nil, internal.Reject("VERSION_CONFLICT", "room version changed")

		}

		if room.Status == "playing" && param.Type == "room.leave" {

			err = leavePlayingMatch(u.ctx, tx, *room.ActiveMatchID, p.UserID)

			if err != nil {

				return nil, err
			}

			err = rooms.RemoveMember(room.ID, p.UserID)

			if err != nil {

				return nil, err
			}

			err = rooms.IncrementVersion(room.ID)

			if err != nil {

				return nil, err
			}

			room.RoomVersion++
			err = rooms.EnqueueChanged(room.ID, room.RoomVersion)

			if err != nil {

				return nil, err
			}

			return json.Marshal(internal.DataLobbyCommand{RequestID: param.RequestID, RoomVersion: room.RoomVersion, Outcome: "applied"})

		}

		if room.Status != "waiting" {

			return nil, internal.Reject("ROOM_NOT_WAITING", "room is not waiting")

		}

		host := room.HostUserID != nil && *room.HostUserID == p.UserID
		switch param.Type {

		case "room.start":
			if !host {

				return nil, internal.Reject("HOST_REQUIRED", "host required")

			}

			roster, err := members.List(room.ID)

			if err != nil {

				return nil, err

			}

			if len(roster) < 2 {

				return nil, internal.Reject("NOT_READY", "at least two players required")

			}

			for _, m := range roster {

				if !m.Ready || !m.AssetsReady || m.ConnectionStatus != "connected" {

					return nil, internal.Reject("NOT_READY", "all players must be ready")

				}

			}

			err = startMatch(u.ctx, tx, room, roster)

			if err != nil {

				return nil, err

			}

		case "room.ready":
			arenas, err := repo.NewArenaRepoTx(u.ctx, tx)

			if err != nil {

				return nil, err

			}

			arena, err := arenas.GetByID(room.ArenaID)

			if err != nil {

				return nil, err

			}

			if param.AssetsReady && param.AssetManifestHash != arena.AssetManifestHash {

				return nil, internal.Reject("ASSET_VERSION_MISMATCH", "asset version mismatch")

			}

			if param.Ready && (!param.AssetsReady || member.ConnectionStatus != "connected") {

				return nil, internal.Reject("NOT_READY", "assets and connection must be ready")

			}

			member.Ready = param.Ready
			member.AssetsReady = param.AssetsReady
			member.AssetManifestHash = &param.AssetManifestHash
			member.CharacterID = param.CharacterID
			err = members.Update(member)

			if err != nil {

				return nil, err

			}

		case "room.settings":
			if !host {

				return nil, internal.Reject("HOST_REQUIRED", "host required")

			}

			roster, err := members.List(room.ID)

			if err != nil {

				return nil, err

			}

			if len(roster) > int(*param.Settings.Capacity) {

				return nil, internal.Reject("CONFLICT", "capacity is smaller than the member count")

			}

			for index, m := range roster {

				if m.Seat != int16(index) {

					m.Seat = int16(index)

					err = members.Update(m)

					if err != nil {

						return nil, err

					}

				}

			}

			room.Name = strings.TrimSpace(param.Name)

			room.ArenaID = param.Settings.ArenaID
			room.Capacity = *param.Settings.Capacity
			room.TargetChakra = *param.Settings.TargetChakra
			room.Rule = param.Settings.Rule
			if room.VoiceEnabled && !*param.Settings.VoiceEnabled {

				grants, err := repo.NewVoiceGrantRepoTx(u.ctx, tx)

				if err != nil {

					return nil, err

				}

				err = grants.RevokeRoom(room.ID)

				if err != nil {

					return nil, err

				}

			}

			room.VoiceEnabled = *param.Settings.VoiceEnabled
			err = rooms.Update(room)

			if err != nil {

				return nil, err

			}

			err = members.ResetReady(room.ID)

			if err != nil {

				return nil, err

			}

		case "room.leave", "room.kick":
			target := p.UserID
			if param.Type == "room.kick" {

				if !host {

					return nil, internal.Reject("HOST_REQUIRED", "host required")

				}

				if param.TargetUserID == p.UserID {

					return nil, internal.Reject("INVALID_TARGET", "cannot kick yourself")

				}

				target = param.TargetUserID
				_, err = members.GetByKey(room.ID, target)

				if err != nil {

					return nil, err

				}

			}

			err = rooms.RemoveMember(room.ID, target)

			if err != nil {

				return nil, err

			}

		case "room.invite.rotate":
			if !host {

				return nil, internal.Reject("HOST_REQUIRED", "host required")

			}

			if room.Visibility != "private" {

				return nil, internal.Reject("INVALID_ACTION", "room is public")

			}

			code := strings.ToUpper(strings.ReplaceAll(uuid.NewString(), "-", "")[:16])

			room.InviteCodeHash, err = auth.MAC("invite", code)

			if err != nil {

				return nil, err

			}

			room.InviteCodeCiphertext, err = auth.Seal([]byte(code))

			if err != nil {

				return nil, err

			}

			room.InviteVersion++
			inviteCode = &code
			err = rooms.Update(room)

			if err != nil {

				return nil, err

			}

		default:
			return nil, internal.Reject("INVALID_MESSAGE", "unsupported lobby command")

		}

		err = rooms.IncrementVersion(room.ID)

		if err != nil {

			return nil, err

		}

		room.RoomVersion++
		err = rooms.EnqueueChanged(room.ID, room.RoomVersion)

		if err != nil {

			return nil, err

		}

		return json.Marshal(lobbyReceipt{DataLobbyCommand: internal.DataLobbyCommand{RequestID: param.RequestID, RoomVersion: room.RoomVersion, Outcome: outcome}, PrivateInviteCode: inviteCode})

	})

	if err != nil {

		return nil, internal.BusinessError(err)

	}

	receipt := new(lobbyReceipt)

	err = json.Unmarshal(value, receipt)

	data := &receipt.DataLobbyCommand
	data.InviteCode = receipt.PrivateInviteCode
	if err != nil {

		return nil, internal.BusinessError(err)

	}

	data.Duplicate = duplicate
	return data, nil

}

func NewRealtimeUseCase(ctx context.Context) (internal.RealtimeUseCase, error) {

	if ctx == nil {

		return nil, internal.Reject("INVALID_INPUT", "invalid context")

	}

	return &RealtimeCase{ctx}, nil

}

func (u *RealtimeCase) CreateWebSocketTicket(param internal.ParamCreateWebSocketTicket) (*internal.DataCreateWebSocketTicket, error) {

	p, err := internal.CurrentPrincipal(u.ctx)

	if err != nil {

		return nil, err

	}

	cfg, err := internal.GetConfig()

	if err != nil {

		return nil, internal.BusinessError(err)

	}

	allowed := false
	for _, origin := range cfg.Auth.AllowedOrigins {

		if origin == param.Origin {

			allowed = true

		}

	}

	if !allowed {

		return nil, internal.Reject("FORBIDDEN", "origin not allowed")

	}

	r, err := repo.NewWSTicketRepo(u.ctx)

	if err != nil {

		return nil, internal.BusinessError(err)

	}

	raw := auth.Token()

	ticket, err := r.Issue(p.SessionID, auth.Digest(raw), param.Origin)

	if err != nil {

		return nil, internal.BusinessError(err)

	}

	return &internal.DataCreateWebSocketTicket{Ticket: raw, ExpiresAt: ticket.ExpiresAt, Path: "/v1/ws", Protocol: internal.WebSocketProtocol}, nil

}

func (u *RealtimeCase) UpgradeWebSocket(param internal.ParamUpgradeWebSocket) (*internal.DataUpgradeWebSocket, error) {

	tickets, err := repo.NewWSTicketRepo(u.ctx)

	if err != nil {

		return nil, internal.BusinessError(err)

	}

	ticket, err := tickets.Consume(auth.Digest(param.Ticket), param.Origin)

	if err != nil {

		return nil, internal.BusinessError(err)

	}

	connections, err := repo.NewRealtimeConnectionRepo(u.ctx)

	if err != nil {

		return nil, internal.BusinessError(err)

	}

	connection, err := connections.Connect(ticket.SessionID)

	if err != nil {

		return nil, internal.BusinessError(err)

	}

	sessions, err := repo.NewSessionRepo(u.ctx)

	if err != nil {

		return nil, internal.BusinessError(err)

	}

	session, err := sessions.GetByID(ticket.SessionID)

	if err != nil {

		return nil, internal.BusinessError(err)

	}

	p := internal.Principal{UserID: connection.UserID, SessionID: session.ID, SessionEpoch: connection.SessionEpoch, ExpiresAt: session.ExpiresAt, TokenHash: session.TokenHash}
	return &internal.DataUpgradeWebSocket{Principal: p, ConnectionID: connection.ID}, nil

}

type lobbyReceipt struct {
	internal.DataLobbyCommand
	PrivateInviteCode *string `json:"privateInviteCode,omitempty"`
}
