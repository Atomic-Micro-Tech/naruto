package controller

import "net/http"

// HandleGetMatch reserves the GET /v1/matches/{matchId} route until its use case is implemented.
func HandleGetMatch(writer http.ResponseWriter, request *http.Request) {

	unavailable(writer, request, "controller/Match.HandleGetMatch")
}
