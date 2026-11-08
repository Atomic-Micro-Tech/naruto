package routes

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/google/uuid"
)

func TestAllOpenAPIRoutesAreRegisteredAndFailClosed(t *testing.T) {

	handler := NewRoutes()

	roomID := "00000000-0000-0000-0000-000000000001"
	matchID := "00000000-0000-0000-0000-000000000002"
	userID := "00000000-0000-0000-0000-000000000003"
	cases := []struct {
		method string
		path   string
		status int
	}{
		{http.MethodGet, "/healthz", http.StatusOK},
		{http.MethodGet, "/readyz", http.StatusServiceUnavailable},
		{http.MethodPost, "/v1/auth/register", http.StatusServiceUnavailable},
		{http.MethodPost, "/v1/auth/login", http.StatusServiceUnavailable},
		{http.MethodGet, "/v1/auth/me", http.StatusUnauthorized},
		{http.MethodPost, "/v1/auth/logout", http.StatusUnauthorized},
		{http.MethodPost, "/v1/auth/verify-email", http.StatusServiceUnavailable},
		{http.MethodPost, "/v1/auth/resend-verification", http.StatusUnauthorized},
		{http.MethodPost, "/v1/auth/forgot-password", http.StatusServiceUnavailable},
		{http.MethodPost, "/v1/auth/reset-password", http.StatusServiceUnavailable},
		{http.MethodPost, "/v1/session/refresh", http.StatusUnauthorized},
		{http.MethodPost, "/v1/ws-ticket", http.StatusUnauthorized},
		{http.MethodGet, "/v1/arenas", http.StatusUnauthorized},
		{http.MethodGet, "/v1/rooms", http.StatusUnauthorized},
		{http.MethodPost, "/v1/rooms", http.StatusUnauthorized},
		{http.MethodPost, "/v1/rooms/join-by-code", http.StatusUnauthorized},
		{http.MethodGet, "/v1/rooms/" + roomID, http.StatusUnauthorized},
		{http.MethodPost, "/v1/rooms/" + roomID + "/join", http.StatusUnauthorized},
		{http.MethodGet, "/v1/rooms/" + roomID + "/messages", http.StatusUnauthorized},
		{http.MethodPost, "/v1/rooms/" + roomID + "/voice-token", http.StatusUnauthorized},
		{http.MethodGet, "/v1/matches/" + matchID, http.StatusUnauthorized},
		{http.MethodPost, "/v1/reports", http.StatusUnauthorized},
		{http.MethodPut, "/v1/blocks/" + userID, http.StatusUnauthorized},
		{http.MethodDelete, "/v1/blocks/" + userID, http.StatusUnauthorized},
		{http.MethodGet, "/v1/blocks", http.StatusUnauthorized},
		{http.MethodGet, "/v1/ws", http.StatusUnauthorized},
	}

	if len(cases) != 26 {

		t.Fatalf("expected 26 operations, got %d", len(cases))
	}

	for _, tc := range cases {

		t.Run(tc.method+" "+tc.path, func(t *testing.T) {

			request := httptest.NewRequest(tc.method, tc.path, nil)

			if tc.path == "/v1/ws" {

				request.Header.Set("Sec-WebSocket-Protocol", "naruto.v1")
			}

			response := httptest.NewRecorder()

			handler.ServeHTTP(response, request)

			if response.Code != tc.status {

				t.Fatalf("status = %d, want %d; body=%s", response.Code, tc.status, response.Body.String())
			}

			if response.Header().Get("Content-Type") != "application/json" {

				t.Fatalf("wrong content type: %s", response.Header().Get("Content-Type"))
			}

			if tc.status == http.StatusOK {

				if strings.TrimSpace(response.Body.String()) != `{"status":"ok"}` {

					t.Fatalf("unexpected health body: %s", response.Body.String())
				}

				return
			}

			var body struct {
				Error struct {
					Code      string `json:"code"`
					Message   string `json:"message"`
					RequestID string `json:"requestId"`
				} `json:"error"`
			}

			err := json.Unmarshal(response.Body.Bytes(), &body)

			if err != nil || body.Error.Code == "" || body.Error.Message == "" {

				t.Fatalf("invalid OpenAPI error response: %s", response.Body.String())
			}

			_, err = uuid.Parse(body.Error.RequestID)

			if err != nil {

				t.Fatalf("invalid requestId: %s", body.Error.RequestID)
			}
		})
	}
}

func TestUnknownAndWrongMethod(t *testing.T) {

	handler := NewRoutes()

	cases := []struct {
		method string
		path   string
		status int
	}{
		{http.MethodGet, "/missing", http.StatusNotFound},
		{http.MethodDelete, "/healthz", http.StatusMethodNotAllowed},
	}

	for _, tc := range cases {

		request := httptest.NewRequest(tc.method, tc.path, nil)

		response := httptest.NewRecorder()

		handler.ServeHTTP(response, request)

		if response.Code != tc.status {

			t.Fatalf("%s %s: status %d, want %d", tc.method, tc.path, response.Code, tc.status)
		}
	}
}
