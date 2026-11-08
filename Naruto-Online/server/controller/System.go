package controller

import (
	"narutoserver/internal"
	"narutoserver/telemetry"
	"narutoserver/usecase"
	"narutoserver/view"
	"net/http"
)

func HandleGetHealth(writer http.ResponseWriter, request *http.Request) {

	ctx, span := telemetry.Tracer.Start(request.Context(), "controller/System.GetHealth")

	defer span.End()

	request = request.WithContext(ctx)

	var req internal.RequestGetHealth
	var param internal.ParamGetHealth
	var err error
	valid := false
	valid = true
	if !valid {

		view.Error(writer, 400, "INVALID_INPUT", "invalid input")

		return
	}

	_ = req
	service, err := usecase.NewSystemUseCase(request.Context())

	if err != nil {

		view.Error(writer, 400, "INVALID_INPUT", "invalid context")

		return
	}

	data, err := service.GetHealth(param)

	if err != nil {

		view.BusinessError(writer, err)

		return
	}

	view.Json(writer, 200, data)
}

func HandleGetReadiness(writer http.ResponseWriter, request *http.Request) {

	ctx, span := telemetry.Tracer.Start(request.Context(), "controller/System.GetReadiness")

	defer span.End()

	request = request.WithContext(ctx)

	var req internal.RequestGetReadiness
	var param internal.ParamGetReadiness
	var err error
	valid := false
	valid = true
	if !valid {

		view.Error(writer, 400, "INVALID_INPUT", "invalid input")

		return
	}

	_ = req
	service, err := usecase.NewSystemUseCase(request.Context())

	if err != nil {

		view.Error(writer, 400, "INVALID_INPUT", "invalid context")

		return
	}

	data, err := service.GetReadiness(param)

	if err != nil {

		view.BusinessError(writer, err)

		return
	}

	view.Json(writer, 200, data)
}
