package view

import (
	"encoding/json"
	"net/http"

	"github.com/google/uuid"
)

// ErrorBody follows components.schemas.Error in api/naruto.yaml.
type ErrorBody struct {
	Error ErrorDetail `json:"error"`
}

type ErrorDetail struct {
	Code      string `json:"code"`
	Message   string `json:"message"`
	RequestID string `json:"requestId"`
}

var (
	ResponseEncodingFailed = []byte(`{"error":{"code":"ENCODING_FAILED","message":"response encoding failed","requestId":"00000000-0000-0000-0000-000000000000"}}`)

	ResponseWriteFailed = []byte(`{"error":{"code":"WRITE_FAILED","message":"response write failed","requestId":"00000000-0000-0000-0000-000000000000"}}`)
)

// Json writes the existing OpenAPI response body without adding an envelope.
func Json(writer http.ResponseWriter, status int, body any) {

	encoded, err := json.Marshal(body)

	if err != nil {

		writer.Header().Set("Content-Type", "application/json")

		writer.Header().Set("Cache-Control", "no-store")

		writer.WriteHeader(http.StatusInternalServerError)

		writer.Write(ResponseEncodingFailed)

		return
	}

	writer.Header().Set("Content-Type", "application/json")

	writer.Header().Set("Cache-Control", "no-store")

	writer.WriteHeader(status)

	_, err = writer.Write(encoded)

	if err != nil {

		writer.Write(ResponseWriteFailed)
	}
}

func Error(writer http.ResponseWriter, status int, code string, message string) {

	var body ErrorBody
	body.Error.Code = code
	body.Error.Message = message
	body.Error.RequestID = uuid.NewString()

	Json(writer, status, body)
}
