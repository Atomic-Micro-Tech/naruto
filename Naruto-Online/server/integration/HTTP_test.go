package integration

import (
	"bytes"
	"context"
	"encoding/json"
	"github.com/coder/websocket"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"io"
	"narutoserver/routes"
	"narutoserver/testsupport"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

type browser struct {
	cookie *http.Cookie
	csrf   string
	userID string
}

func request(t *testing.T, server *httptest.Server, b *browser, method, path string, body any, key string, status int) map[string]any {

	t.Helper()

	var reader io.Reader
	if body != nil {

		raw, err := json.Marshal(body)

		if err != nil {

			t.Fatal(err)
		}

		reader = bytes.NewReader(raw)
	}

	req, err := http.NewRequest(method, server.URL+path, reader)

	if err != nil {

		t.Fatal(err)
	}

	req.Header.Set("Origin", "http://localhost:5173")

	if body != nil {

		req.Header.Set("Content-Type", "application/json")
	}

	if key != "" {

		req.Header.Set("Idempotency-Key", key)
	}

	if b != nil && b.cookie != nil {

		req.AddCookie(b.cookie)

		req.Header.Set("X-CSRF-Token", b.csrf)
	}

	resp, err := server.Client().Do(req)

	if err != nil {

		t.Fatal(err)
	}

	defer resp.Body.Close()

	raw, err := io.ReadAll(resp.Body)

	if err != nil {

		t.Fatal(err)
	}

	if resp.StatusCode != status {

		t.Fatalf("%s %s: got %d want %d: %s", method, path, resp.StatusCode, status, raw)
	}

	if status == 204 {

		capture(t, map[string]any{"kind": "http", "method": method, "path": path, "status": status, "body": nil})

		if len(raw) != 0 {

			t.Fatal("204 has body")
		}

		return nil
	}

	var data map[string]any
	err = json.Unmarshal(raw, &data)

	if err != nil {

		t.Fatalf("invalid JSON: %s", raw)
	}

	capture(t, map[string]any{"kind": "http", "method": method, "path": path, "status": status, "body": data})

	if b != nil {

		for _, cookie := range resp.Cookies() {

			if cookie.Name == "naruto_session" {

				if !cookie.HttpOnly || cookie.SameSite != http.SameSiteLaxMode {

					t.Fatal("unsafe session cookie")
				}

				b.cookie = cookie
			}
		}

		csrf, ok := data["csrfToken"].(string)

		if ok {

			b.csrf = csrf
		}
	}

	return data
}

func user(t *testing.T, server *httptest.Server) *browser {

	email := uuid.NewString() + "@example.test"
	request(t, server, nil, "POST", "/v1/auth/register", map[string]any{"email": email, "password": "SyntheticPassword!123", "displayName": "HTTP tester"}, "", 201)

	b := &browser{}
	data := request(t, server, b, "POST", "/v1/auth/login", map[string]any{"email": email, "password": "SyntheticPassword!123"}, "", 200)

	b.userID = data["user"].(map[string]any)["id"].(string)

	return b
}

func socket(t *testing.T, server *httptest.Server, b *browser) (*websocket.Conn, string) {

	ticket := request(t, server, b, "POST", "/v1/ws-ticket", nil, "", 201)["ticket"].(string)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)

	defer cancel()

	header := http.Header{"Origin": []string{"http://localhost:5173"}}
	conn, resp, err := websocket.Dial(ctx, strings.Replace(server.URL, "http", "ws", 1)+"/v1/ws?ticket="+ticket, &websocket.DialOptions{HTTPHeader: header, Subprotocols: []string{"naruto.v1"}})

	if err != nil {

		t.Fatalf("upgrade: %v response=%v", err, resp)
	}

	t.Cleanup(func() {

		conn.CloseNow()
	})

	readType(t, conn, "connection.ready")

	return conn, ticket
}

func readType(t *testing.T, conn *websocket.Conn, kind string) map[string]any {

	t.Helper()

	ctx, cancel := context.WithTimeout(context.Background(), 8*time.Second)

	defer cancel()

	for {

		_, raw, err := conn.Read(ctx)

		if err != nil {

			t.Fatal(err)
		}

		if len(raw) > 16384 {

			t.Fatal("oversize frame")
		}

		var value map[string]any
		err = json.Unmarshal(raw, &value)

		if err != nil {

			t.Fatal(err)
		}

		capture(t, map[string]any{"kind": "ws", "body": value})

		if value["type"] == kind {

			return value["payload"].(map[string]any)
		}
	}
}

func send(t *testing.T, c *websocket.Conn, kind string, payload any) string {

	t.Helper()

	id := uuid.NewString()

	raw, err := json.Marshal(map[string]any{"protocolVersion": 1, "requestId": id, "type": kind, "payload": payload})

	if err != nil {

		t.Fatal(err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)

	defer cancel()

	err = c.Write(ctx, websocket.MessageText, raw)

	if err != nil {

		t.Fatal(err)
	}

	return id
}

func TestHTTPAndWebSocketBusinessFlow(t *testing.T) {

	testsupport.Start(t)

	server := httptest.NewServer(routes.NewRoutes())

	defer server.Close()

	request(t, server, nil, "GET", "/readyz", nil, "", 200)

	host := user(t, server)

	request(t, server, host, "GET", "/v1/arenas", nil, "", 200)

	guest := user(t, server)

	outsider := user(t, server)

	request(t, server, host, "GET", "/v1/auth/me", nil, "", 200)

	request(t, server, nil, "POST", "/v1/auth/login", map[string]any{"email": "invalid", "password": "x", "admin": true}, "", 400)

	oldCSRF := host.csrf
	host.csrf = "wrong"
	request(t, server, host, "POST", "/v1/ws-ticket", nil, "", 403)

	host.csrf = oldCSRF
	settings := map[string]any{"arenaId": "arena-1", "capacity": 2, "targetChakra": 3000, "rule": "normal", "voiceEnabled": true}
	key := uuid.NewString()

	body := map[string]any{"name": "HTTP private room", "visibility": "private", "settings": settings}
	created := request(t, server, host, "POST", "/v1/rooms", body, key, 201)

	roomID := created["room"].(map[string]any)["id"].(string)

	code := created["inviteCode"].(string)

	retry := request(t, server, host, "POST", "/v1/rooms", body, key, 201)

	if retry["room"].(map[string]any)["id"] != roomID {

		t.Fatal("HTTP retry created another room")
	}

	body["name"] = "conflicting"
	request(t, server, host, "POST", "/v1/rooms", body, key, 409)

	request(t, server, outsider, "GET", "/v1/rooms/"+roomID, nil, "", 404)

	joined := request(t, server, guest, "POST", "/v1/rooms/join-by-code", map[string]any{"inviteCode": code}, uuid.NewString(), 200)

	if joined["inviteCode"] != nil {

		t.Fatal("guest received host invite")
	}

	request(t, server, outsider, "POST", "/v1/rooms/join-by-code", map[string]any{"inviteCode": code}, uuid.NewString(), 409)

	list := request(t, server, outsider, "GET", "/v1/rooms", nil, "", 200)

	for _, item := range list["items"].([]any) {

		if item.(map[string]any)["id"] == roomID {

			t.Fatal("private room leaked")
		}
	}

	hc, ticket := socket(t, server, host)

	gc, _ := socket(t, server, guest)

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)

	_, resp, err := websocket.Dial(ctx, strings.Replace(server.URL, "http", "ws", 1)+"/v1/ws?ticket="+ticket, &websocket.DialOptions{HTTPHeader: http.Header{"Origin": []string{"http://localhost:5173"}}, Subprotocols: []string{"naruto.v1"}})

	cancel()

	if err == nil || resp == nil || resp.StatusCode != 401 {

		t.Fatalf("ticket reused: %v %#v", err, resp)
	}

	send(t, gc, "chat.send", map[string]any{"roomId": roomID, "clientMessageId": uuid.NewString(), "text": "hello websocket"})

	readType(t, gc, "command.ack")

	message := readType(t, hc, "chat.message")

	if message["text"] != "hello websocket" {

		t.Fatal("chat payload mismatch")
	}

	request(t, server, host, "PUT", "/v1/blocks/"+guest.userID, nil, "", 200)

	history := request(t, server, host, "GET", "/v1/rooms/"+roomID+"/messages", nil, "", 200)

	if len(history["items"].([]any)) != 0 {

		t.Fatal("blocked message visible")
	}

	request(t, server, host, "DELETE", "/v1/blocks/"+guest.userID, nil, "", 204)

	request(t, server, host, "POST", "/v1/reports", map[string]any{"roomId": roomID, "targetUserId": guest.userID, "messageId": message["id"], "category": "chat_abuse", "description": "Integration test"}, uuid.NewString(), 201)

	grant := request(t, server, host, "POST", "/v1/rooms/"+roomID+"/voice-token", nil, "", 201)

	token, err := jwt.Parse(grant["token"].(string), func(token *jwt.Token) (any, error) {

		return []byte("test-secret-for-local-signature-only"), nil
	}, jwt.WithValidMethods([]string{"HS256"}))

	if err != nil || !token.Valid {

		t.Fatalf("invalid voice JWT: %v", err)
	}

	video := token.Claims.(jwt.MapClaims)["video"].(map[string]any)

	sources := video["canPublishSources"].([]any)

	if len(sources) != 1 || sources[0] != "microphone" || video["canPublishData"] != false || video["room"] != roomID {

		t.Fatal("voice capabilities exceed room audio")
	}

	room := request(t, server, host, "GET", "/v1/rooms/"+roomID, nil, "", 200)

	settings["voiceEnabled"] = false
	send(t, hc, "room.settings", map[string]any{"roomId": roomID, "expectedRoomVersion": room["roomVersion"], "name": "Updated room", "settings": settings})

	readType(t, hc, "command.ack")

	request(t, server, host, "POST", "/v1/rooms/"+roomID+"/voice-token", nil, "", 403)

	old := *host.cookie
	request(t, server, host, "POST", "/v1/session/refresh", nil, "", 200)

	request(t, server, &browser{cookie: &old}, "GET", "/v1/auth/me", nil, "", 401)

	request(t, server, host, "POST", "/v1/auth/logout", nil, "", 204)

	request(t, server, host, "GET", "/v1/auth/me", nil, "", 401)
}
