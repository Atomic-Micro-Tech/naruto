package controller

import "net/http"

// HandleListRooms reserves the GET /v1/rooms route until its use case is implemented.
func HandleListRooms(writer http.ResponseWriter, request *http.Request) {

	unavailable(writer, request, "controller/Room.HandleListRooms")
}

// HandleCreateRoom reserves the POST /v1/rooms route until its use case is implemented.
func HandleCreateRoom(writer http.ResponseWriter, request *http.Request) {

	unavailable(writer, request, "controller/Room.HandleCreateRoom")
}

// HandleJoinRoomByCode reserves the POST /v1/rooms/join-by-code route until its use case is implemented.
func HandleJoinRoomByCode(writer http.ResponseWriter, request *http.Request) {

	unavailable(writer, request, "controller/Room.HandleJoinRoomByCode")
}

// HandleGetRoom reserves the GET /v1/rooms/{roomId} route until its use case is implemented.
func HandleGetRoom(writer http.ResponseWriter, request *http.Request) {

	unavailable(writer, request, "controller/Room.HandleGetRoom")
}

// HandleJoinRoom reserves the POST /v1/rooms/{roomId}/join route until its use case is implemented.
func HandleJoinRoom(writer http.ResponseWriter, request *http.Request) {

	unavailable(writer, request, "controller/Room.HandleJoinRoom")
}
