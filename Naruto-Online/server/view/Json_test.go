package view

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestJsonEncodingFallback(t *testing.T) {

	writer := httptest.NewRecorder()

	Json(writer, http.StatusOK, make(chan int))

	if writer.Code != http.StatusInternalServerError || writer.Body.String() != string(ResponseEncodingFailed) {

		t.Fatalf("encoding fallback: status=%d body=%s", writer.Code, writer.Body.String())
	}
}

type failingWriter struct {
	header http.Header
	status int
	writes int
}

func (writer *failingWriter) Header() http.Header {

	return writer.header
}

func (writer *failingWriter) WriteHeader(status int) {

	writer.status = status
}

func (writer *failingWriter) Write(data []byte) (int, error) {

	writer.writes++
	return 0, errors.New("write failed")
}

func TestJsonWriteFallbackIsBestEffort(t *testing.T) {

	writer := &failingWriter{header: make(http.Header)}
	Json(writer, http.StatusOK, map[string]string{"status": "ok"})

	if writer.status != http.StatusOK || writer.writes != 2 {

		t.Fatalf("write fallback: status=%d writes=%d", writer.status, writer.writes)
	}
}
