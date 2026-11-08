package controller

import (
	"narutoserver/internal"
	"narutoserver/telemetry"
	"narutoserver/usecase"
	"narutoserver/view"
	"net/http"
)

func HandleCreateWebSocketTicket(writer http.ResponseWriter, request *http.Request) {

	ctx, span := telemetry.Tracer.Start(request.Context(), "controller/Realtime.CreateWebSocketTicket")

	defer span.End()

	request = request.WithContext(ctx)

	var req internal.RequestCreateWebSocketTicket
	var param internal.ParamCreateWebSocketTicket
	var err error
	valid := false
	req.Origin = request.Header.Get("Origin")

	valid = req.Origin != "" && noBody(request)

	if !valid {

		view.Error(writer, 400, "INVALID_INPUT", "invalid input")

		return
	}

	param.Origin = req.Origin

	service, err := usecase.NewRealtimeUseCase(request.Context())

	if err != nil {

		view.Error(writer, 400, "INVALID_INPUT", "invalid context")

		return
	}

	data, err := service.CreateWebSocketTicket(param)

	if err != nil {

		view.BusinessError(writer, err)

		return
	}

	view.Json(writer, 201, data)
}
