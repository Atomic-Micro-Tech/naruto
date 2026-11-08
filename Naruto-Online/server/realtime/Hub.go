package realtime

import (
	"context"
	"encoding/json"
	"errors"
	"github.com/coder/websocket"
	"github.com/google/uuid"
	"narutoserver/internal"
	"narutoserver/internal/auth"
	"narutoserver/internal/voice"
	"narutoserver/models"
	"narutoserver/repo"
	"narutoserver/usecase"
	"sync"
	"time"
)

type Client struct {
	ID        uuid.UUID
	Principal internal.Principal
	Socket    *websocket.Conn
	Context   context.Context
}

var mu sync.Mutex
var clients = map[uuid.UUID]*Client{}
var active sync.WaitGroup
var closing bool

func Track() (func(), bool) {

	mu.Lock()

	defer mu.Unlock()

	if closing {

		return nil, false
	}

	active.Add(1)

	return active.Done, true
}

func Wait(ctx context.Context) error {

	done := make(chan struct{})

	go func() {

		active.Wait()

		close(done)
	}()

	select {

	case <-done:
		return nil
	case <-ctx.Done():
		return ctx.Err()
	}
}

func Register(c *Client) {

	mu.Lock()

	old := clients[c.Principal.UserID]
	clients[c.Principal.UserID] = c
	mu.Unlock()

	if old != nil {

		go old.Socket.Close(websocket.StatusPolicyViolation, "connection replaced")
	}
}

func Remove(c *Client) {

	mu.Lock()

	if clients[c.Principal.UserID] == c {

		delete(clients, c.Principal.UserID)
	}

	mu.Unlock()
}

func Close() {

	mu.Lock()

	closing = true
	all := make([]*Client, 0, len(clients))

	for _, c := range clients {

		all = append(all, c)
	}

	mu.Unlock()

	for _, c := range all {

		c.Socket.CloseNow()
	}
}

func (c *Client) Send(kind string, payload any) error {

	encoded, err := json.Marshal(struct {
		ProtocolVersion int       `json:"protocolVersion"`
		Type            string    `json:"type"`
		ServerTime      time.Time `json:"serverTime"`
		Payload         any       `json:"payload"`
	}{1, kind, time.Now().UTC(), payload})

	if err != nil {

		return err
	}

	if len(encoded) > internal.MaxMessageBytes {

		c.Socket.CloseNow()

		return errors.New("outgoing frame exceeds protocol limit")
	}

	ctx, cancel := context.WithTimeout(c.Context, 3*time.Second)

	defer cancel()

	err = c.Socket.Write(ctx, websocket.MessageText, encoded)

	if err != nil {

		c.Socket.CloseNow()
	}

	return err
}

func (c *Client) Snapshot(ctx context.Context) error {

	members, err := repo.NewRoomMemberRepo(ctx)

	if err != nil {

		return err
	}

	member, err := members.Current(c.Principal.UserID)

	if err != nil || member == nil {

		return err
	}

	service, err := usecase.NewRoomUseCase(internal.WithPrincipal(ctx, c.Principal))

	if err != nil {

		return err
	}

	data, err := service.GetRoom(internal.ParamGetRoom{RoomID: member.RoomID})

	if err != nil {

		return err
	}

	var code *string
	if data.Visibility == "private" && data.HostUserID == c.Principal.UserID {

		rooms, err := repo.NewRoomRepo(ctx)

		if err != nil {

			return err
		}

		room, err := rooms.GetByID(member.RoomID)

		if err != nil {

			return err
		}

		clear, err := auth.Open(room.InviteCodeCiphertext)

		if err != nil {

			return err
		}

		s := string(clear)

		code = &s
	}

	return c.Send("room.snapshot", struct {
		Room       internal.RoomData `json:"room"`
		InviteCode *string           `json:"inviteCode"`
	}{data.RoomData, code})
}

func Dispatch(ctx context.Context, event *models.OutboxEvent) error {

	if event.Topic == "voice.remove" {

		var p struct {
			RoomID   string `json:"roomId"`
			Identity string `json:"identity"`
		}

		err := json.Unmarshal(event.Payload, &p)

		if err != nil {

			return err
		}

		return voice.Remove(ctx, p.RoomID, p.Identity)
	}

	if event.Topic != "room.changed" && event.Topic != "chat.message" && event.Topic != "room.member_removed" {

		return errors.New("unsupported outbox topic")
	}

	mu.Lock()

	all := make([]*Client, 0, len(clients))

	for _, c := range clients {

		all = append(all, c)
	}

	mu.Unlock()

	rooms, err := repo.NewRoomRepo(ctx)

	if err != nil {

		return err
	}

	room, err := rooms.GetByID(event.AggregateID)

	if err != nil {

		return err
	}

	if event.Topic == "room.member_removed" {

		var payload struct {
			UserID uuid.UUID `json:"userId"`
		}

		err = json.Unmarshal(event.Payload, &payload)

		if err != nil {

			return err
		}

		for _, c := range all {

			found, err := rooms.MemberExists(room.ID, c.Principal.UserID)

			if err != nil {

				return err
			}

			if found || c.Principal.UserID == payload.UserID {

				c.Send("member.updated", map[string]any{"roomId": room.ID, "roomVersion": room.RoomVersion, "userId": payload.UserID, "member": nil})
			}
		}

		return nil
	}

	var message *models.ChatMessage
	if event.Topic == "chat.message" {

		var payload struct {
			MessageID uuid.UUID `json:"messageId"`
		}

		err = json.Unmarshal(event.Payload, &payload)

		if err != nil {

			return err
		}

		messages, err := repo.NewChatMessageRepo(ctx)

		if err != nil {

			return err
		}

		message, err = messages.GetByID(payload.MessageID)

		if err != nil {

			return err
		}
	}

	for _, c := range all {

		found, err := rooms.MemberExists(room.ID, c.Principal.UserID)

		if err != nil {

			return err
		}

		if message != nil {

			if !found || message.HiddenAt != nil {

				continue
			}

			blocks, err := repo.NewUserBlockRepo(ctx)

			if err != nil {

				return err
			}

			blocked, err := blocks.Exists(c.Principal.UserID, *message.SenderUserID)

			if err != nil {

				return err
			}

			if blocked {

				continue
			}

			data := internal.ChatMessageData{ID: message.ID, RoomID: message.RoomID, Sender: &internal.PlayerIdentity{UserID: *message.SenderUserID, DisplayName: *message.SenderDisplayName}, Kind: message.Kind, Text: message.Body, CreatedAt: message.CreatedAt, ClientMessageID: message.ClientMessageID}
			c.Send("chat.message", data)

			continue
		}

		if found {

			c.Snapshot(ctx)
		}

		if room.Visibility == "public" {

			var summary *internal.RoomSummaryData
			reason := "removed"
			if room.Status != "closed" {

				users, err := repo.NewUserRepo(ctx)

				if err != nil {

					return err
				}

				host, err := users.GetByID(*room.HostUserID)

				if err != nil {

					return err
				}

				members, err := repo.NewRoomMemberRepo(ctx)

				if err != nil {

					return err
				}

				roster, err := members.List(room.ID)

				if err != nil {

					return err
				}

				summary = &internal.RoomSummaryData{ID: room.ID, Name: room.Name, Host: internal.PlayerIdentity{UserID: host.ID, DisplayName: host.DisplayName}, Visibility: room.Visibility, Status: room.Status, Settings: internal.RoomSettings{ArenaID: room.ArenaID, Capacity: room.Capacity, TargetChakra: room.TargetChakra, Rule: room.Rule, VoiceEnabled: room.VoiceEnabled}, MemberCount: len(roster), RoomVersion: room.RoomVersion, CanJoin: room.Status == "waiting" && len(roster) < int(room.Capacity), CreatedAt: room.CreatedAt}
				reason = "updated"
			}

			c.Send("rooms.updated", map[string]any{"reason": reason, "roomId": room.ID, "summary": summary})
		}
	}

	return nil
}

func Maintain(ctx context.Context) {

	timer := time.NewTicker(5 * time.Second)

	defer timer.Stop()

	for {

		select {

		case <-ctx.Done():
			return
		case <-timer.C:
			connections, err := repo.NewRealtimeConnectionRepo(ctx)

			if err == nil {

				connections.RecoverStale()
			}

			rooms, err := repo.NewRoomRepo(ctx)

			if err == nil {

				rooms.ExpireWaiting()
			}
		}
	}
}
