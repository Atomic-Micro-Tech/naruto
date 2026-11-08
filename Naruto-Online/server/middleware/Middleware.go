package middleware

import (
	"crypto/subtle"
	"narutoserver/internal"
	"narutoserver/internal/auth"
	"narutoserver/repo"
	"narutoserver/view"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"
)

type bucket struct {
	count int
	until time.Time
}

var rateMu sync.Mutex
var rates = map[string]bucket{}
var expensive = make(chan struct{}, 4)

func AllowedOrigin(origin string) bool {

	cfg, err := internal.GetConfig()

	if err != nil || origin == "" {

		return false
	}

	for _, allowed := range cfg.Auth.AllowedOrigins {

		if origin == allowed {

			return true
		}
	}

	return false
}

func Allow(key string, limit int, window time.Duration) bool {

	rateMu.Lock()

	defer rateMu.Unlock()

	now := time.Now()

	if len(rates) > 10000 {

		for k, v := range rates {

			if !v.until.After(now) {

				delete(rates, k)
			}
		}
	}

	b := rates[key]
	if !b.until.After(now) {

		b = bucket{until: now.Add(window)}
	}

	if b.count >= limit || len(rates) > 20000 {

		return false
	}

	b.count++
	rates[key] = b
	return true
}

func PublicMutation(next http.HandlerFunc) http.HandlerFunc {

	return func(w http.ResponseWriter, r *http.Request) {

		if !AllowedOrigin(r.Header.Get("Origin")) {

			view.Error(w, 403, "FORBIDDEN", "origin not allowed")

			return
		}

		host, _, _ := net.SplitHostPort(r.RemoteAddr)

		if !Allow("auth:"+host, 20, time.Minute) {

			view.Error(w, 429, "RATE_LIMITED", "try again later")

			return
		}

		select {

		case expensive <- struct{}{}:
			defer func() {

				<-expensive
			}()

		default:
			view.Error(w, 429, "RATE_LIMITED", "try again later")

			return
		}

		next(w, r)
	}
}

func RequireSession(next http.HandlerFunc) http.HandlerFunc {

	return func(w http.ResponseWriter, r *http.Request) {

		cookie, err := r.Cookie(internal.SessionCookieName)

		if err != nil || len(cookie.Value) != 43 {

			view.Error(w, 401, "UNAUTHENTICATED", "login required")

			return
		}

		sessions, err := repo.NewSessionRepo(r.Context())

		if err != nil {

			view.BusinessError(w, err)

			return
		}

		session, err := sessions.Authenticate(auth.Digest(cookie.Value))

		if err != nil {

			view.BusinessError(w, err)

			return
		}

		csrf, err := auth.CSRF(cookie.Value)

		if err != nil {

			view.BusinessError(w, err)

			return
		}

		if subtle.ConstantTimeCompare(auth.Digest(csrf), session.CSRFTokenHash) != 1 {

			view.Error(w, 401, "UNAUTHENTICATED", "session invalid")

			return
		}

		if r.Method != "GET" && r.Method != "HEAD" {

			if !AllowedOrigin(r.Header.Get("Origin")) {

				view.Error(w, 403, "FORBIDDEN", "origin not allowed")

				return
			}

			if subtle.ConstantTimeCompare([]byte(r.Header.Get("X-CSRF-Token")), []byte(csrf)) != 1 {

				view.Error(w, 403, "CSRF_INVALID", "invalid CSRF token")

				return
			}
		}

		if !Allow("user:"+session.UserID.String(), 300, time.Minute) {

			view.Error(w, 429, "RATE_LIMITED", "try again later")

			return
		}

		principal := internal.Principal{UserID: session.UserID, SessionID: session.ID, ExpiresAt: session.ExpiresAt, CSRFToken: csrf, TokenHash: session.TokenHash}
		next(w, r.WithContext(internal.WithPrincipal(r.Context(), principal)))
	}
}

func RequireWSTicket(next http.HandlerFunc) http.HandlerFunc {

	return func(w http.ResponseWriter, r *http.Request) {

		if !AllowedOrigin(r.Header.Get("Origin")) {

			view.Error(w, 403, "FORBIDDEN", "origin not allowed")

			return
		}

		offered := false
		for _, protocol := range strings.Split(r.Header.Get("Sec-WebSocket-Protocol"), ",") {

			if strings.TrimSpace(protocol) == internal.WebSocketProtocol {

				offered = true
			}
		}

		if !offered {

			view.Error(w, 400, "INVALID_MESSAGE", "naruto.v1 subprotocol required")

			return
		}

		if len(r.URL.Query()["ticket"]) != 1 || len(r.URL.Query().Get("ticket")) != 43 {

			view.Error(w, 401, "UNAUTHENTICATED", "WebSocket ticket required")

			return
		}

		next(w, r)
	}
}

func CORS(next http.Handler) http.Handler {

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		origin := r.Header.Get("Origin")

		if origin != "" {

			w.Header().Add("Vary", "Origin")

			if !AllowedOrigin(origin) {

				view.Error(w, 403, "FORBIDDEN", "origin not allowed")

				return
			}

			w.Header().Set("Access-Control-Allow-Origin", origin)

			w.Header().Set("Access-Control-Allow-Credentials", "true")
		}

		if r.Method == "OPTIONS" {

			if !AllowedOrigin(origin) {

				view.Error(w, 403, "FORBIDDEN", "origin not allowed")

				return
			}

			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")

			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-CSRF-Token, Idempotency-Key")

			w.Header().Set("Access-Control-Max-Age", "600")

			view.NoContent(w)

			return
		}

		w.Header().Set("X-Content-Type-Options", "nosniff")

		next.ServeHTTP(w, r)
	})
}

// TraceHTTP omits ticket-bearing upgrade URLs from HTTP tracing.
func TraceHTTP(r *http.Request) bool {

	return r.URL.Path != "/v1/ws"
}
