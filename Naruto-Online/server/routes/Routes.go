package routes

import (
	"net/http"

	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"

	"narutoserver/controller"
	"narutoserver/middleware"
)

// NewRoutes registers every HTTP operation in api/naruto.yaml.
func NewRoutes() http.Handler {

	mux := http.NewServeMux()

	// System
	mux.HandleFunc("GET /healthz", controller.HandleGetHealth)

	mux.HandleFunc("GET /readyz", controller.HandleGetReadiness)

	// Auth
	mux.HandleFunc("POST /v1/auth/register", middleware.PublicMutation(controller.HandleRegisterEmail))

	mux.HandleFunc("POST /v1/auth/login", middleware.PublicMutation(controller.HandleLoginEmail))

	mux.HandleFunc("GET /v1/auth/me", middleware.RequireSession(controller.HandleGetCurrentSession))

	mux.HandleFunc("POST /v1/auth/logout", middleware.RequireSession(controller.HandleLogout))

	mux.HandleFunc("POST /v1/auth/verify-email", middleware.PublicMutation(controller.HandleVerifyEmail))

	mux.HandleFunc("POST /v1/auth/resend-verification", middleware.RequireSession(controller.HandleResendVerification))

	mux.HandleFunc("POST /v1/auth/forgot-password", middleware.PublicMutation(controller.HandleForgotPassword))

	mux.HandleFunc("POST /v1/auth/reset-password", middleware.PublicMutation(controller.HandleResetPassword))

	mux.HandleFunc("POST /v1/session/refresh", middleware.RequireSession(controller.HandleRefreshSession))

	// Arenas
	mux.HandleFunc("GET /v1/arenas", middleware.RequireSession(controller.HandleListArenas))

	// Rooms
	mux.HandleFunc("GET /v1/rooms", middleware.RequireSession(controller.HandleListRooms))

	mux.HandleFunc("POST /v1/rooms", middleware.RequireSession(controller.HandleCreateRoom))

	mux.HandleFunc("POST /v1/rooms/join-by-code", middleware.RequireSession(controller.HandleJoinRoomByCode))

	mux.HandleFunc("GET /v1/rooms/{roomId}", middleware.RequireSession(controller.HandleGetRoom))

	mux.HandleFunc("POST /v1/rooms/{roomId}/join", middleware.RequireSession(controller.HandleJoinRoom))

	// Matches
	mux.HandleFunc("GET /v1/matches/{matchId}", middleware.RequireSession(controller.HandleGetMatch))

	// Chat
	mux.HandleFunc("GET /v1/rooms/{roomId}/messages", middleware.RequireSession(controller.HandleListRoomMessages))

	// Voice
	mux.HandleFunc("POST /v1/rooms/{roomId}/voice-token", middleware.RequireSession(controller.HandleCreateVoiceToken))

	// Moderation
	mux.HandleFunc("POST /v1/reports", middleware.RequireSession(controller.HandleCreateReport))

	mux.HandleFunc("PUT /v1/blocks/{userId}", middleware.RequireSession(controller.HandleBlockUser))

	mux.HandleFunc("DELETE /v1/blocks/{userId}", middleware.RequireSession(controller.HandleUnblockUser))

	mux.HandleFunc("GET /v1/blocks", middleware.RequireSession(controller.HandleListBlocks))

	// Realtime
	mux.HandleFunc("POST /v1/ws-ticket", middleware.RequireSession(controller.HandleCreateWebSocketTicket))

	mux.HandleFunc("GET /v1/ws", middleware.RequireWSTicket(controller.HandleUpgradeWebSocket))

	return otelhttp.NewHandler(middleware.CORS(mux), "/", otelhttp.WithFilter(middleware.TraceHTTP))
}
