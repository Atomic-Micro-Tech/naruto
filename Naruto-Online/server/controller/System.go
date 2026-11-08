package controller

import (
	"net/http"

	"narutoserver/internal"
	"narutoserver/telemetry"
	"narutoserver/view"
)

func HandleGetHealth(writer http.ResponseWriter, request *http.Request) {

	_, span := telemetry.Tracer.Start(request.Context(), "controller/System.HandleGetHealth")

	defer span.End()

	view.Json(writer, http.StatusOK, struct {
		Status string `json:"status"`
	}{Status: "ok"})
}

func HandleGetReadiness(writer http.ResponseWriter, request *http.Request) {

	ctx, span := telemetry.Tracer.Start(request.Context(), "controller/System.HandleGetReadiness")

	defer span.End()

	err := internal.PingPostgreSQL(ctx)

	if err != nil {

		view.Error(writer, http.StatusServiceUnavailable, "UNAVAILABLE", "PostgreSQL is unavailable")

		return
	}

	view.Error(writer, http.StatusServiceUnavailable, "UNAVAILABLE", "business API is not implemented")
}
