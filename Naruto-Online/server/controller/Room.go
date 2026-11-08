package controller

import (
	"narutoserver/internal"
	"narutoserver/telemetry"
	"narutoserver/usecase"
	"narutoserver/view"
	"net/http"
	"strings"
)

func HandleListRooms(writer http.ResponseWriter, request *http.Request) {

	ctx, span := telemetry.Tracer.Start(request.Context(), "controller/Room.ListRooms")

	defer span.End()

	request = request.WithContext(ctx)

	var req internal.RequestListRooms
	var param internal.ParamListRooms
	var err error
	valid := false
	req.PageParam, err = page(request)

	req.Q = request.URL.Query().Get("q")

	req.Status = request.URL.Query().Get("status")

	if req.Status == "" {

		req.Status = "waiting"
	}

	seat := request.URL.Query().Get("hasOpenSeat")

	req.HasOpenSeat = seat == "true"
	valid = err == nil && length(req.Q, 0, 60) && (req.Status == "" || req.Status == "waiting" || req.Status == "playing" || req.Status == "results") && (seat == "" || seat == "true" || seat == "false")

	if !valid {

		view.Error(writer, 400, "INVALID_INPUT", "invalid input")

		return
	}

	param.PageParam = req.PageParam
	param.Q = req.Q
	param.HasOpenSeat = req.HasOpenSeat
	param.Status = req.Status

	service, err := usecase.NewRoomUseCase(request.Context())

	if err != nil {

		view.Error(writer, 400, "INVALID_INPUT", "invalid context")

		return
	}

	data, err := service.ListRooms(param)

	if err != nil {

		view.BusinessError(writer, err)

		return
	}

	view.Json(writer, 200, data)
}

func HandleCreateRoom(writer http.ResponseWriter, request *http.Request) {

	ctx, span := telemetry.Tracer.Start(request.Context(), "controller/Room.CreateRoom")

	defer span.End()

	request = request.WithContext(ctx)

	var req internal.RequestCreateRoom
	var param internal.ParamCreateRoom
	var err error
	valid := false
	err = decode(writer, request, &req, "name", "visibility", "settings")

	req.IdempotencyKey, valid = identifier(request.Header.Get("Idempotency-Key"))

	valid = valid && err == nil && length(strings.TrimSpace(req.Name), 1, 60) && (req.Visibility == "public" || req.Visibility == "private") && validSettings(req.Settings)

	if !valid {

		view.Error(writer, 400, "INVALID_INPUT", "invalid input")

		return
	}

	param.Name = req.Name
	param.Visibility = req.Visibility
	param.Settings = req.Settings
	param.IdempotencyKey = req.IdempotencyKey

	service, err := usecase.NewRoomUseCase(request.Context())

	if err != nil {

		view.Error(writer, 400, "INVALID_INPUT", "invalid context")

		return
	}

	data, err := service.CreateRoom(param)

	if err != nil {

		view.BusinessError(writer, err)

		return
	}

	view.Json(writer, 201, data)
}

func HandleJoinRoomByCode(writer http.ResponseWriter, request *http.Request) {

	ctx, span := telemetry.Tracer.Start(request.Context(), "controller/Room.JoinRoomByCode")

	defer span.End()

	request = request.WithContext(ctx)

	var req internal.RequestJoinRoomByCode
	var param internal.ParamJoinRoomByCode
	var err error
	valid := false
	err = decode(writer, request, &req, "inviteCode")

	req.IdempotencyKey, valid = identifier(request.Header.Get("Idempotency-Key"))

	valid = valid && err == nil && invite(req.InviteCode)

	if !valid {

		view.Error(writer, 400, "INVALID_INPUT", "invalid input")

		return
	}

	param.InviteCode = req.InviteCode
	param.IdempotencyKey = req.IdempotencyKey

	service, err := usecase.NewRoomUseCase(request.Context())

	if err != nil {

		view.Error(writer, 400, "INVALID_INPUT", "invalid context")

		return
	}

	data, err := service.JoinRoomByCode(param)

	if err != nil {

		view.BusinessError(writer, err)

		return
	}

	view.Json(writer, 200, data)
}

func HandleGetRoom(writer http.ResponseWriter, request *http.Request) {

	ctx, span := telemetry.Tracer.Start(request.Context(), "controller/Room.GetRoom")

	defer span.End()

	request = request.WithContext(ctx)

	var req internal.RequestGetRoom
	var param internal.ParamGetRoom
	var err error
	valid := false
	req.RoomID, valid = identifier(request.PathValue("roomId"))

	if !valid {

		view.Error(writer, 400, "INVALID_INPUT", "invalid input")

		return
	}

	param.RoomID = req.RoomID

	service, err := usecase.NewRoomUseCase(request.Context())

	if err != nil {

		view.Error(writer, 400, "INVALID_INPUT", "invalid context")

		return
	}

	data, err := service.GetRoom(param)

	if err != nil {

		view.BusinessError(writer, err)

		return
	}

	view.Json(writer, 200, data)
}

func HandleJoinRoom(writer http.ResponseWriter, request *http.Request) {

	ctx, span := telemetry.Tracer.Start(request.Context(), "controller/Room.JoinRoom")

	defer span.End()

	request = request.WithContext(ctx)

	var req internal.RequestJoinRoom
	var param internal.ParamJoinRoom
	var err error
	valid := false
	err = decode(writer, request, &req)

	req.RoomID, valid = identifier(request.PathValue("roomId"))

	var keyOK bool
	req.IdempotencyKey, keyOK = identifier(request.Header.Get("Idempotency-Key"))

	valid = valid && keyOK && err == nil && (req.InviteCode == "" || invite(req.InviteCode))

	if !valid {

		view.Error(writer, 400, "INVALID_INPUT", "invalid input")

		return
	}

	param.RoomID = req.RoomID
	param.InviteCode = req.InviteCode
	param.IdempotencyKey = req.IdempotencyKey

	service, err := usecase.NewRoomUseCase(request.Context())

	if err != nil {

		view.Error(writer, 400, "INVALID_INPUT", "invalid context")

		return
	}

	data, err := service.JoinRoom(param)

	if err != nil {

		view.BusinessError(writer, err)

		return
	}

	view.Json(writer, 200, data)
}
