package controller

import "net/http"

// HandleCreateWebSocketTicket reserves the POST /v1/ws-ticket route until its use case is implemented.
func HandleCreateWebSocketTicket(writer http.ResponseWriter, request *http.Request) {

	unavailable(writer, request, "controller/Realtime.HandleCreateWebSocketTicket")
}

// HandleUpgradeWebSocket reserves the GET /v1/ws route until its use case is implemented.
func HandleUpgradeWebSocket(writer http.ResponseWriter, request *http.Request) {

	unavailable(writer, request, "controller/Realtime.HandleUpgradeWebSocket")
}
