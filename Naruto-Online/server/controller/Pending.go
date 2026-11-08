package controller

import (
	"net/http"

	"narutoserver/telemetry"
	"narutoserver/view"
)

// unavailable is used only by routes whose business operation is still absent.
func unavailable(writer http.ResponseWriter, request *http.Request, spanName string) {

	_, span := telemetry.Tracer.Start(request.Context(), spanName)

	defer span.End()

	view.Error(writer, http.StatusServiceUnavailable, "UNAVAILABLE", "operation is not implemented")
}
