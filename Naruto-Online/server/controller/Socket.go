package controller

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"github.com/coder/websocket"
	"github.com/google/uuid"
	"narutoserver/internal"
	"narutoserver/middleware"
	"narutoserver/realtime"
	"narutoserver/repo"
	"narutoserver/telemetry"
	"narutoserver/usecase"
	"narutoserver/view"
	"net/http"
	"strings"
	"time"
)

func HandleUpgradeWebSocket(writer http.ResponseWriter, request *http.Request) {

	traceCtx, span := telemetry.Tracer.Start(request.Context(), "controller/Realtime.UpgradeWebSocket")

	defer span.End()

	request = request.WithContext(traceCtx)

	done, ok := realtime.Track()

	if !ok {

		view.Error(writer, 503, "UNAVAILABLE", "server shutting down")

		return
	}

	defer done()

	var req internal.RequestUpgradeWebSocket
	req.Ticket = request.URL.Query().Get("ticket")

	req.Origin = request.Header.Get("Origin")

	var param internal.ParamUpgradeWebSocket
	param.Ticket = req.Ticket
	param.Origin = req.Origin
	if len(req.Ticket) != 43 || !middleware.AllowedOrigin(req.Origin) || !strings.EqualFold(request.Header.Get("Upgrade"), "websocket") || request.Header.Get("Sec-WebSocket-Version") != "13" {

		view.Error(writer, 400, "INVALID_INPUT", "invalid WebSocket upgrade")

		return
	}

	service, err := usecase.NewRealtimeUseCase(request.Context())

	if err != nil {

		view.Error(writer, 400, "INVALID_INPUT", "invalid context")

		return
	}

	data, err := service.UpgradeWebSocket(param)

	if err != nil {

		view.BusinessError(writer, err)

		return
	}

	defer func() {

		ctx, cancel := context.WithTimeout(context.WithoutCancel(request.Context()), 5*time.Second)

		defer cancel()

		r, err := repo.NewRealtimeConnectionRepo(ctx)

		if err == nil {

			r.Disconnect(data.ConnectionID)
		}
	}()

	// Exact Origin allowlist was checked above; coder/websocket's host-only matcher is bypassed.
	conn, err := websocket.Accept(writer, request, &websocket.AcceptOptions{Subprotocols: []string{internal.WebSocketProtocol}, InsecureSkipVerify: true})

	if err != nil {

		return
	}

	defer conn.CloseNow()

	conn.SetReadLimit(internal.MaxMessageBytes)

	ctx, cancel := context.WithCancel(internal.WithPrincipal(request.Context(), data.Principal))

	defer cancel()

	client := &realtime.Client{ID: data.ConnectionID, Principal: data.Principal, Socket: conn, Context: ctx}
	realtime.Register(client)

	defer realtime.Remove(client)

	err = client.Send("connection.ready", map[string]any{"connectionId": client.ID, "sessionEpoch": data.Principal.SessionEpoch, "heartbeatIntervalSeconds": 5, "heartbeatTimeoutSeconds": 15, "maxMessageBytes": internal.MaxMessageBytes, "protocolVersion": 1})

	if err != nil {

		return
	}

	client.Snapshot(ctx)

	go monitorSocket(ctx, client)

	for {

		kind, body, err := conn.Read(ctx)

		if err != nil {

			return
		}

		if kind != websocket.MessageText {

			conn.Close(websocket.StatusUnsupportedData, "JSON text required")

			return
		}

		var msg internal.WSMessage
		err = strictMessage(body, &msg, []string{"protocolVersion", "requestId", "type", "payload"})

		if err != nil || msg.RequestID == uuid.Nil {

			conn.Close(websocket.StatusPolicyViolation, "invalid message envelope")

			return
		}

		if !middleware.Allow("ws:"+data.Principal.UserID.String(), 120, time.Minute) {

			rejectSocket(client, msg.RequestID, internal.Reject("RATE_LIMITED", "too many messages"))

			continue
		}

		if msg.ProtocolVersion != 1 {

			rejectSocket(client, msg.RequestID, internal.Reject("UNSUPPORTED_PROTOCOL", "protocol 1 required"))

			continue
		}

		err = dispatchSocket(ctx, client, msg)

		if err != nil {

			rejectSocket(client, msg.RequestID, err)
		}
	}
}

func monitorSocket(ctx context.Context, c *realtime.Client) {

	ticker := time.NewTicker(time.Second)

	defer ticker.Stop()

	ticks := 0
	for {

		select {

		case <-ctx.Done():
			return
		case <-ticker.C:
			r, err := repo.NewRealtimeConnectionRepo(ctx)

			if err != nil {

				c.Socket.CloseNow()

				return
			}

			alive, err := r.Alive(c.ID)

			if err != nil || !alive {

				c.Socket.Close(websocket.StatusPolicyViolation, "session expired or connection replaced")

				return
			}

			ticks++
			if ticks%5 == 0 {

				pingCtx, cancel := context.WithTimeout(ctx, 10*time.Second)

				err = c.Socket.Ping(pingCtx)

				cancel()

				if err != nil {

					c.Socket.CloseNow()

					return
				}

				err = r.Heartbeat(c.ID)

				if err != nil {

					c.Socket.CloseNow()

					return
				}
			}
		}
	}
}

func strictMessage(raw []byte, dst any, keys []string) error {

	err := exactFields(raw, dst)

	if err != nil {

		return err
	}

	var fields map[string]json.RawMessage
	err = json.Unmarshal(raw, &fields)

	if err != nil || fields == nil {

		return errors.New("JSON object required")
	}

	if len(fields) != len(keys) {

		return errors.New("invalid fields")
	}

	for _, key := range keys {

		value, ok := fields[key]
		if !ok || bytes.Equal(bytes.TrimSpace(value), []byte("null")) {

			return errors.New("required field missing")
		}
	}

	d := json.NewDecoder(bytes.NewReader(raw))

	d.DisallowUnknownFields()

	return d.Decode(dst)
}

func rejectSocket(c *realtime.Client, id uuid.UUID, err error) {

	code := "UNAVAILABLE"
	message := "service temporarily unavailable"
	var input *internal.InputError
	if errors.As(err, &input) {

		code = input.Code
		message = input.Message
	}

	c.Send("command.rejected", map[string]any{"requestId": id, "code": code, "message": message})
}

func dispatchSocket(ctx context.Context, c *realtime.Client, msg internal.WSMessage) error {

	if msg.Type == "ping" {

		var p struct {
			ClientTime time.Time `json:"clientTime"`
		}

		err := strictMessage(msg.Payload, &p, []string{"clientTime"})

		if err != nil {

			return internal.Reject("INVALID_MESSAGE", "invalid ping")
		}

		return c.Send("pong", map[string]any{"clientTime": p.ClientTime, "serverTick": 0})
	}

	if msg.Type == "match.resume" {

		var p struct {
			MatchID           uuid.UUID `json:"matchId"`
			LastEventSequence *int64    `json:"lastEventSequence"`
		}

		err := strictMessage(msg.Payload, &p, []string{"matchId", "lastEventSequence"})

		if err != nil || p.MatchID == uuid.Nil || p.LastEventSequence == nil || *p.LastEventSequence < 0 {

			return internal.Reject("INVALID_MESSAGE", "invalid resume")
		}

		service, err := usecase.NewMatchUseCase(ctx)

		if err != nil {

			return err
		}

		data, err := service.GetMatch(internal.ParamGetMatch{MatchID: p.MatchID})

		if err != nil {

			return err
		}

		return c.Send("match.snapshot", data)
	}

	if msg.Type == "match.command" || msg.Type == "match.reclaim" {

		return internal.Reject("CPU_CONTEXT_UNRESOLVED", "authoritative match engine is not available")
	}

	var p struct {
		RoomID              uuid.UUID                   `json:"roomId"`
		ExpectedRoomVersion int64                       `json:"expectedRoomVersion"`
		Name                string                      `json:"name"`
		Settings            *internal.RoomSettingsInput `json:"settings"`
		Ready               bool                        `json:"ready"`
		CharacterID         int16                       `json:"characterId"`
		AssetsReady         bool                        `json:"assetsReady"`
		AssetManifestHash   string                      `json:"assetManifestHash"`
		TargetUserID        uuid.UUID                   `json:"targetUserId"`
		ClientMessageID     uuid.UUID                   `json:"clientMessageId"`
		Text                string                      `json:"text"`
	}

	keys := []string{"roomId", "expectedRoomVersion"}
	switch msg.Type {

	case "room.settings":
		keys = append(keys, "name", "settings")

	case "room.ready":
		keys = append(keys, "ready", "characterId", "assetsReady", "assetManifestHash")

	case "room.kick":
		keys = append(keys, "targetUserId")

	case "chat.send":
		keys = []string{"roomId", "clientMessageId", "text"}
	case "room.leave", "room.invite.rotate", "room.start":
	default:
		return internal.Reject("INVALID_MESSAGE", "unknown message type")
	}

	err := strictMessage(msg.Payload, &p, keys)

	if err != nil || p.RoomID == uuid.Nil || p.ExpectedRoomVersion < 0 {

		return internal.Reject("INVALID_MESSAGE", "invalid command payload")
	}

	if msg.Type == "room.settings" && (!length(strings.TrimSpace(p.Name), 1, 60) || !validSettings(p.Settings)) {

		return internal.Reject("INVALID_MESSAGE", "invalid room settings")
	}

	if msg.Type == "room.ready" {

		if p.CharacterID < 0 || p.CharacterID > 3 || len(p.AssetManifestHash) != 64 {

			return internal.Reject("INVALID_MESSAGE", "invalid ready state")
		}

		for _, ch := range p.AssetManifestHash {

			if !(ch >= '0' && ch <= '9' || ch >= 'a' && ch <= 'f') {

				return internal.Reject("INVALID_MESSAGE", "invalid asset hash")
			}
		}
	}

	if msg.Type == "room.kick" && p.TargetUserID == uuid.Nil {

		return internal.Reject("INVALID_MESSAGE", "invalid target")
	}

	if msg.Type == "chat.send" && (p.ClientMessageID == uuid.Nil || !length(strings.TrimSpace(p.Text), 1, 300)) {

		return internal.Reject("INVALID_MESSAGE", "invalid chat message")
	}

	service, err := usecase.NewRealtimeUseCase(ctx)

	if err != nil {

		return err
	}

	data, err := service.ExecuteLobby(internal.ParamLobbyCommand{ConnectionID: c.ID, RequestID: msg.RequestID, Type: msg.Type, RoomID: p.RoomID, ExpectedRoomVersion: p.ExpectedRoomVersion, Name: p.Name, Settings: p.Settings, Ready: p.Ready, CharacterID: p.CharacterID, AssetsReady: p.AssetsReady, AssetManifestHash: p.AssetManifestHash, TargetUserID: p.TargetUserID, ClientMessageID: p.ClientMessageID, Text: p.Text})

	if err != nil {

		return err
	}

	err = c.Send("command.ack", data)

	if err != nil {

		return err
	}

	if msg.Type == "room.invite.rotate" {

		return c.Send("room.invite.rotated", map[string]any{"roomId": p.RoomID, "roomVersion": data.RoomVersion, "inviteCode": data.InviteCode})
	}

	return nil
}
