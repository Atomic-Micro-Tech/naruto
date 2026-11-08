package controller

import "net/http"

// HandleListRoomMessages reserves the GET /v1/rooms/{roomId}/messages route until its use case is implemented.
func HandleListRoomMessages(writer http.ResponseWriter, request *http.Request) {

	unavailable(writer, request, "controller/Chat.HandleListRoomMessages")
}
