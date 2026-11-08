package controller

import (
	"narutoserver/internal"
	"narutoserver/telemetry"
	"narutoserver/usecase"
	"narutoserver/view"
	"net/http"
)

func HandleCreateVoiceToken(writer http.ResponseWriter, request *http.Request) {

	ctx, span := telemetry.Tracer.Start(request.Context(), "controller/Voice.CreateVoiceToken")

	defer span.End()

	request = request.WithContext(ctx)

	var req internal.RequestCreateVoiceToken
	var param internal.ParamCreateVoiceToken
	var err error
	valid := false
	req.RoomID, valid = identifier(request.PathValue("roomId"))

	valid = valid && noBody(request)

	if !valid {

		view.Error(writer, 400, "INVALID_INPUT", "invalid input")

		return
	}

	param.RoomID = req.RoomID

	service, err := usecase.NewVoiceUseCase(request.Context())

	if err != nil {

		view.Error(writer, 400, "INVALID_INPUT", "invalid context")

		return
	}

	data, err := service.CreateVoiceToken(param)

	if err != nil {

		view.BusinessError(writer, err)

		return
	}

	view.Json(writer, 201, data)
}
