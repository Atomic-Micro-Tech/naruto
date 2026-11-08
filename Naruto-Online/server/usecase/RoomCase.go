package usecase

import (
	"context"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"github.com/google/uuid"
	"narutoserver/internal"
	"narutoserver/internal/auth"
	"narutoserver/models"
	"narutoserver/repo"
	"strings"
	"time"
)

type RoomCase struct{ ctx context.Context }

func NewRoomUseCase(ctx context.Context) (internal.RoomUseCase, error) {

	if ctx == nil {

		return nil, internal.Reject("INVALID_INPUT", "invalid context")
	}

	return &RoomCase{ctx}, nil
}

func cursorParts(cursor *internal.Cursor) (*time.Time, *uuid.UUID) {

	if cursor == nil {

		return nil, nil
	}

	return &cursor.CreatedAt, &cursor.ID
}

func encodeCursor(at time.Time, id uuid.UUID, scope string) *string {

	data, _ := json.Marshal(internal.Cursor{CreatedAt: at, ID: id, Scope: scope})

	cipher, err := auth.Seal(data)

	if err != nil {

		return nil
	}

	value := base64.RawURLEncoding.EncodeToString(cipher)

	return &value
}

func settings(room *models.Room) internal.RoomSettings {

	return internal.RoomSettings{ArenaID: room.ArenaID, Capacity: room.Capacity, TargetChakra: room.TargetChakra, Rule: room.Rule, VoiceEnabled: room.VoiceEnabled}
}

func roomData(ctx context.Context, room *models.Room, tx *sql.Tx) (internal.RoomData, error) {

	var members models.RoomMemberRepo
	var users models.UserRepo
	var err error
	if tx != nil {

		members, err = repo.NewRoomMemberRepoTx(ctx, tx)
	} else {

		members, err = repo.NewRoomMemberRepo(ctx)
	}

	if err != nil {

		return internal.RoomData{}, err
	}

	if tx != nil {

		users, err = repo.NewUserRepoTx(ctx, tx)
	} else {

		users, err = repo.NewUserRepo(ctx)
	}

	if err != nil {

		return internal.RoomData{}, err
	}

	rows, err := members.List(room.ID)

	if err != nil {

		return internal.RoomData{}, err
	}

	value := internal.RoomData{ID: room.ID, Name: room.Name, Visibility: room.Visibility, Status: room.Status, Settings: settings(room), RoomVersion: room.RoomVersion, ActiveMatchID: room.ActiveMatchID, CreatedAt: room.CreatedAt, Members: []internal.RoomMemberData{}}
	if room.HostUserID != nil {

		value.HostUserID = *room.HostUserID
	}

	for _, member := range rows {

		user, err := users.GetByID(member.UserID)

		if err != nil {

			return value, err
		}

		value.Members = append(value.Members, internal.RoomMemberData{UserID: member.UserID, DisplayName: user.DisplayName, Seat: member.Seat, CharacterID: member.CharacterID, Ready: member.Ready, AssetsReady: member.AssetsReady, ConnectionStatus: member.ConnectionStatus, JoinedAt: member.JoinedAt})
	}

	return value, nil
}

func membership(ctx context.Context, room *models.Room, userID uuid.UUID, tx *sql.Tx) (internal.MembershipData, error) {

	value, err := roomData(ctx, room, tx)

	if err != nil {

		return internal.MembershipData{}, err
	}

	result := internal.MembershipData{Room: value}
	found := false
	for _, member := range value.Members {

		if member.UserID == userID {

			result.SelfSeat = member.Seat
			found = true
		}
	}

	if !found {

		return result, internal.Reject("NOT_FOUND", "room not found")
	}

	if room.Visibility == "private" && value.HostUserID == userID {

		clear, err := auth.Open(room.InviteCodeCiphertext)

		if err != nil {

			return result, err
		}

		code := string(clear)

		result.InviteCode = &code
	}

	return result, nil
}

func (u *RoomCase) ListRooms(param internal.ParamListRooms) (*internal.DataListRooms, error) {

	rooms, err := repo.NewRoomRepo(u.ctx)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	at, id := cursorParts(param.Cursor)

	rows, err := rooms.Search(param.Q, param.Status, param.HasOpenSeat, param.Limit+1, at, id)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	data := &internal.DataListRooms{Items: []internal.RoomSummaryData{}}
	if len(rows) > param.Limit {

		rows = rows[:param.Limit]
		last := rows[len(rows)-1]
		data.NextCursor = encodeCursor(last.CreatedAt, last.ID, param.Scope)
	}

	for _, row := range rows {

		room, err := roomData(u.ctx, row, nil)

		if err != nil {

			return nil, internal.BusinessError(err)
		}

		host := internal.PlayerIdentity{UserID: room.HostUserID}
		for _, m := range room.Members {

			if m.UserID == host.UserID {

				host.DisplayName = m.DisplayName
			}
		}

		data.Items = append(data.Items, internal.RoomSummaryData{ID: room.ID, Name: room.Name, Host: host, Visibility: room.Visibility, Status: room.Status, Settings: room.Settings, MemberCount: len(room.Members), RoomVersion: room.RoomVersion, CanJoin: room.Status == "waiting" && len(room.Members) < int(room.Settings.Capacity), CreatedAt: room.CreatedAt})
	}

	return data, nil
}

func (u *RoomCase) GetRoom(param internal.ParamGetRoom) (*internal.DataGetRoom, error) {

	principal, err := internal.CurrentPrincipal(u.ctx)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	rooms, err := repo.NewRoomRepo(u.ctx)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	found, err := rooms.MemberExists(param.RoomID, principal.UserID)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	if !found {

		return nil, internal.Reject("NOT_FOUND", "room not found")
	}

	room, err := rooms.GetByID(param.RoomID)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	data, err := roomData(u.ctx, room, nil)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	return &internal.DataGetRoom{RoomData: data}, nil
}

func (u *RoomCase) CreateRoom(param internal.ParamCreateRoom) (*internal.DataCreateRoom, error) {

	principal, err := internal.CurrentPrincipal(u.ctx)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	receipts, err := repo.NewRequestReceiptRepo(u.ctx)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	body, err := json.Marshal(param)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	result, _, err := receipts.Execute(principal.UserID, "http", "createRoom", param.IdempotencyKey, auth.Hash(body), func(tx *sql.Tx) ([]byte, error) {

		users, err := repo.NewUserRepoTx(u.ctx, tx)

		if err != nil {

			return nil, err
		}

		err = users.Lock(principal.UserID)

		if err != nil {

			return nil, err
		}

		members, err := repo.NewRoomMemberRepoTx(u.ctx, tx)

		if err != nil {

			return nil, err
		}

		current, err := members.Current(principal.UserID)

		if err != nil {

			return nil, err
		}

		if current != nil {

			return nil, internal.Reject("ALREADY_IN_ROOM", "already in a room")
		}

		arenas, err := repo.NewArenaRepoTx(u.ctx, tx)

		if err != nil {

			return nil, err
		}

		arena, err := arenas.GetByID(param.Settings.ArenaID)

		if err != nil {

			return nil, err
		}

		if !arena.Enabled {

			return nil, internal.Reject("ARENA_UNAVAILABLE", "arena unavailable")
		}

		rooms, err := repo.NewRoomRepoTx(u.ctx, tx)

		if err != nil {

			return nil, err
		}

		now := time.Now().UTC()

		room := models.NewRoom()

		room.ID = uuid.New()

		room.Name = strings.TrimSpace(param.Name)

		room.HostUserID = &principal.UserID
		room.Visibility = param.Visibility
		room.Status = "waiting"
		room.ArenaID = param.Settings.ArenaID
		room.Capacity = *param.Settings.Capacity
		room.TargetChakra = *param.Settings.TargetChakra
		room.Rule = param.Settings.Rule
		room.VoiceEnabled = *param.Settings.VoiceEnabled
		room.RoomVersion = 1
		room.CreatedAt = now
		room.UpdatedAt = now
		if room.Visibility == "private" {

			code := strings.ToUpper(strings.ReplaceAll(uuid.NewString(), "-", "")[:16])

			room.InviteCodeHash, err = auth.MAC("invite", code)

			if err != nil {

				return nil, err
			}

			room.InviteCodeCiphertext, err = auth.Seal([]byte(code))

			if err != nil {

				return nil, err
			}

			keyID := "app-v1"
			room.InviteKeyID = &keyID
			room.InviteVersion = 1
		}

		err = rooms.Create(room)

		if err != nil {

			return nil, err
		}

		err = members.Add(room.ID, principal.UserID, room.Capacity, 0)

		if err != nil {

			return nil, err
		}

		err = rooms.EnqueueChanged(room.ID, room.RoomVersion)

		if err != nil {

			return nil, err
		}

		data, err := membership(u.ctx, room, principal.UserID, tx)

		if err != nil {

			return nil, err
		}

		return json.Marshal(data)
	})

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	data := new(internal.DataCreateRoom)

	err = json.Unmarshal(result, &data.MembershipData)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	return data, nil
}

func (u *RoomCase) JoinRoomByCode(param internal.ParamJoinRoomByCode) (*internal.DataJoinRoomByCode, error) {

	data, err := u.join("joinRoomByCode", uuid.Nil, param.InviteCode, param.IdempotencyKey)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	return &internal.DataJoinRoomByCode{MembershipData: *data}, nil
}

func (u *RoomCase) JoinRoom(param internal.ParamJoinRoom) (*internal.DataJoinRoom, error) {

	data, err := u.join("joinRoom", param.RoomID, param.InviteCode, param.IdempotencyKey)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	return &internal.DataJoinRoom{MembershipData: *data}, nil
}

func (u *RoomCase) join(operation string, roomID uuid.UUID, code string, key uuid.UUID) (*internal.MembershipData, error) {

	principal, err := internal.CurrentPrincipal(u.ctx)

	if err != nil {

		return nil, err
	}

	receipts, err := repo.NewRequestReceiptRepo(u.ctx)

	if err != nil {

		return nil, err
	}

	body, _ := json.Marshal([]string{roomID.String(), code})

	result, _, err := receipts.Execute(principal.UserID, "http", operation, key, auth.Hash(body), func(tx *sql.Tx) ([]byte, error) {

		users, err := repo.NewUserRepoTx(u.ctx, tx)

		if err != nil {

			return nil, err
		}

		err = users.Lock(principal.UserID)

		if err != nil {

			return nil, err
		}

		rooms, err := repo.NewRoomRepoTx(u.ctx, tx)

		if err != nil {

			return nil, err
		}

		var digest []byte
		if code != "" {

			digest, err = auth.MAC("invite", code)

			if err != nil {

				return nil, err
			}
		}

		target := roomID
		if target == uuid.Nil {

			row, err := rooms.FindByInvite(digest)

			if err != nil {

				return nil, err
			}

			target = row.ID
		}

		room, err := rooms.Lock(target)

		if err != nil {

			return nil, err
		}

		if room.Visibility == "private" {

			matched, err := rooms.FindByInvite(digest)

			if err != nil || matched.ID != room.ID {

				return nil, internal.Reject("NOT_FOUND", "room not found")
			}
		}

		members, err := repo.NewRoomMemberRepoTx(u.ctx, tx)

		if err != nil {

			return nil, err
		}

		current, err := members.Current(principal.UserID)

		if err != nil {

			return nil, err
		}

		if current != nil {

			if current.RoomID != room.ID {

				return nil, internal.Reject("ALREADY_IN_ROOM", "already in a room")
			}

			data, err := membership(u.ctx, room, principal.UserID, tx)

			if err != nil {

				return nil, err
			}

			return json.Marshal(data)
		}

		if room.Status != "waiting" {

			return nil, internal.Reject("ROOM_NOT_WAITING", "room has already started")
		}

		occupied, err := members.List(room.ID)

		if err != nil {

			return nil, err
		}

		seat := int16(-1)

		for candidate := int16(0); candidate < room.Capacity; candidate++ {

			free := true
			for _, m := range occupied {

				if m.Seat == candidate {

					free = false
				}
			}

			if free {

				seat = candidate
				break
			}
		}

		if seat < 0 {

			return nil, internal.Reject("ROOM_FULL", "room is full")
		}

		err = members.Add(room.ID, principal.UserID, room.Capacity, seat)

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

		data, err := membership(u.ctx, room, principal.UserID, tx)

		if err != nil {

			return nil, err
		}

		return json.Marshal(data)
	})

	if err != nil {

		return nil, err
	}

	data := new(internal.MembershipData)

	err = json.Unmarshal(result, data)

	return data, err
}
