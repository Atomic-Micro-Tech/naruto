package controller

import "net/http"

// HandleCreateVoiceToken reserves the POST /v1/rooms/{roomId}/voice-token route until its use case is implemented.
func HandleCreateVoiceToken(writer http.ResponseWriter, request *http.Request) {

	unavailable(writer, request, "controller/Voice.HandleCreateVoiceToken")
}
