package controller

import (
	"narutoserver/internal"
	"narutoserver/telemetry"
	"narutoserver/usecase"
	"narutoserver/view"
	"net/http"
)

func HandleListArenas(writer http.ResponseWriter, request *http.Request) {

	ctx, span := telemetry.Tracer.Start(request.Context(), "controller/Arena.ListArenas")

	defer span.End()

	request = request.WithContext(ctx)

	var req internal.RequestListArenas
	var param internal.ParamListArenas
	var err error
	valid := false
	valid = noBody(request)

	if !valid {

		view.Error(writer, 400, "INVALID_INPUT", "invalid input")

		return
	}

	_ = req
	service, err := usecase.NewArenaUseCase(request.Context())

	if err != nil {

		view.Error(writer, 400, "INVALID_INPUT", "invalid context")

		return
	}

	data, err := service.ListArenas(param)

	if err != nil {

		view.BusinessError(writer, err)

		return
	}

	view.Json(writer, 200, data)
}
