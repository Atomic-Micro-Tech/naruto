package middleware

import (
	"net/http"

	"narutoserver/view"
)

// RequireSession fails closed until credential/session use cases and repositories
// have been implemented. Cookie presence is never treated as authentication.
func RequireSession(next http.HandlerFunc) http.HandlerFunc {

	return func(writer http.ResponseWriter, request *http.Request) {

		_, err := request.Cookie("naruto_session")

		if err != nil {

			view.Error(writer, http.StatusUnauthorized, "UNAUTHENTICATED", "login required")

			return
		}

		view.Error(writer, http.StatusServiceUnavailable, "UNAVAILABLE", "session validation is not available")
	}
}

// RequireWSTicket never upgrades a socket before single-use ticket validation exists.
func RequireWSTicket(next http.HandlerFunc) http.HandlerFunc {

	return func(writer http.ResponseWriter, request *http.Request) {

		if request.Header.Get("Sec-WebSocket-Protocol") != "naruto.v1" {

			view.Error(writer, http.StatusBadRequest, "INVALID_MESSAGE", "naruto.v1 subprotocol required")

			return
		}

		if request.URL.Query().Get("ticket") == "" {

			view.Error(writer, http.StatusUnauthorized, "UNAUTHENTICATED", "WebSocket ticket required")

			return
		}

		view.Error(writer, http.StatusServiceUnavailable, "UNAVAILABLE", "WebSocket ticket validation is not available")
	}
}
