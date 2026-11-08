package controller

import "net/http"

// HandleListArenas reserves the GET /v1/arenas route until its use case is implemented.
func HandleListArenas(writer http.ResponseWriter, request *http.Request) {

	unavailable(writer, request, "controller/Arena.HandleListArenas")
}
