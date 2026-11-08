package controller

import "net/http"

// HandleCreateReport reserves the POST /v1/reports route until its use case is implemented.
func HandleCreateReport(writer http.ResponseWriter, request *http.Request) {

	unavailable(writer, request, "controller/Moderation.HandleCreateReport")
}

// HandleBlockUser reserves the PUT /v1/blocks/{userId} route until its use case is implemented.
func HandleBlockUser(writer http.ResponseWriter, request *http.Request) {

	unavailable(writer, request, "controller/Moderation.HandleBlockUser")
}

// HandleUnblockUser reserves the DELETE /v1/blocks/{userId} route until its use case is implemented.
func HandleUnblockUser(writer http.ResponseWriter, request *http.Request) {

	unavailable(writer, request, "controller/Moderation.HandleUnblockUser")
}

// HandleListBlocks reserves the GET /v1/blocks route until its use case is implemented.
func HandleListBlocks(writer http.ResponseWriter, request *http.Request) {

	unavailable(writer, request, "controller/Moderation.HandleListBlocks")
}
