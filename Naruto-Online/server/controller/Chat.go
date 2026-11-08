package controller

import (
	"narutoserver/internal"
	"narutoserver/telemetry"
	"narutoserver/usecase"
	"narutoserver/view"
	"net/http"
)

func HandleListRoomMessages(writer http.ResponseWriter, request *http.Request) {

	ctx, span := telemetry.Tracer.Start(request.Context(), "controller/Chat.ListRoomMessages")

	defer span.End()

	request = request.WithContext(ctx)

	var req internal.RequestListRoomMessages
	var param internal.ParamListRoomMessages
	var err error
	valid := false
	req.RoomID, valid = identifier(request.PathValue("roomId"))

	req.PageParam, err = page(request)

	valid = valid && err == nil
	if !valid {

		view.Error(writer, 400, "INVALID_INPUT", "invalid input")

		return
	}

	param.RoomID = req.RoomID
	param.PageParam = req.PageParam

	service, err := usecase.NewChatUseCase(request.Context())

	if err != nil {

		view.Error(writer, 400, "INVALID_INPUT", "invalid context")

		return
	}

	data, err := service.ListRoomMessages(param)

	if err != nil {

		view.BusinessError(writer, err)

		return
	}

	view.Json(writer, 200, data)
}
