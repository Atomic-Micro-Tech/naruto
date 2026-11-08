package controller

import (
	"github.com/google/uuid"
	"narutoserver/internal"
	"narutoserver/telemetry"
	"narutoserver/usecase"
	"narutoserver/view"
	"net/http"
	"strings"
)

func HandleCreateReport(writer http.ResponseWriter, request *http.Request) {

	ctx, span := telemetry.Tracer.Start(request.Context(), "controller/Moderation.CreateReport")

	defer span.End()

	request = request.WithContext(ctx)

	var req internal.RequestCreateReport
	var param internal.ParamCreateReport
	var err error
	valid := false
	err = decode(writer, request, &req, "roomId", "targetUserId", "category", "description")

	req.IdempotencyKey, valid = identifier(request.Header.Get("Idempotency-Key"))

	valid = valid && err == nil && req.RoomID != uuid.Nil && req.TargetUserID != uuid.Nil && (req.MatchID == nil || *req.MatchID != uuid.Nil) && (req.MessageID == nil || *req.MessageID != uuid.Nil) && length(strings.TrimSpace(req.Description), 1, 1000) && (req.Category == "chat_abuse" || req.Category == "voice_abuse" || req.Category == "cheating" || req.Category == "other")

	if !valid {

		view.Error(writer, 400, "INVALID_INPUT", "invalid input")

		return
	}

	param.RoomID = req.RoomID
	param.MatchID = req.MatchID
	param.TargetUserID = req.TargetUserID
	param.MessageID = req.MessageID
	param.Category = req.Category
	param.Description = req.Description
	param.IdempotencyKey = req.IdempotencyKey

	service, err := usecase.NewModerationUseCase(request.Context())

	if err != nil {

		view.Error(writer, 400, "INVALID_INPUT", "invalid context")

		return
	}

	data, err := service.CreateReport(param)

	if err != nil {

		view.BusinessError(writer, err)

		return
	}

	view.Json(writer, 201, data)
}

func HandleBlockUser(writer http.ResponseWriter, request *http.Request) {

	ctx, span := telemetry.Tracer.Start(request.Context(), "controller/Moderation.BlockUser")

	defer span.End()

	request = request.WithContext(ctx)

	var req internal.RequestBlockUser
	var param internal.ParamBlockUser
	var err error
	valid := false
	req.UserID, valid = identifier(request.PathValue("userId"))

	valid = valid && noBody(request)

	if !valid {

		view.Error(writer, 400, "INVALID_INPUT", "invalid input")

		return
	}

	param.UserID = req.UserID

	service, err := usecase.NewModerationUseCase(request.Context())

	if err != nil {

		view.Error(writer, 400, "INVALID_INPUT", "invalid context")

		return
	}

	data, err := service.BlockUser(param)

	if err != nil {

		view.BusinessError(writer, err)

		return
	}

	view.Json(writer, 200, data)
}

func HandleUnblockUser(writer http.ResponseWriter, request *http.Request) {

	ctx, span := telemetry.Tracer.Start(request.Context(), "controller/Moderation.UnblockUser")

	defer span.End()

	request = request.WithContext(ctx)

	var req internal.RequestUnblockUser
	var param internal.ParamUnblockUser
	var err error
	valid := false
	req.UserID, valid = identifier(request.PathValue("userId"))

	valid = valid && noBody(request)

	if !valid {

		view.Error(writer, 400, "INVALID_INPUT", "invalid input")

		return
	}

	param.UserID = req.UserID

	service, err := usecase.NewModerationUseCase(request.Context())

	if err != nil {

		view.Error(writer, 400, "INVALID_INPUT", "invalid context")

		return
	}

	data, err := service.UnblockUser(param)

	if err != nil {

		view.BusinessError(writer, err)

		return
	}

	_ = data
	view.NoContent(writer)
}

func HandleListBlocks(writer http.ResponseWriter, request *http.Request) {

	ctx, span := telemetry.Tracer.Start(request.Context(), "controller/Moderation.ListBlocks")

	defer span.End()

	request = request.WithContext(ctx)

	var req internal.RequestListBlocks
	var param internal.ParamListBlocks
	var err error
	valid := false
	req.PageParam, err = page(request)

	valid = err == nil
	if !valid {

		view.Error(writer, 400, "INVALID_INPUT", "invalid input")

		return
	}

	param.PageParam = req.PageParam

	service, err := usecase.NewModerationUseCase(request.Context())

	if err != nil {

		view.Error(writer, 400, "INVALID_INPUT", "invalid context")

		return
	}

	data, err := service.ListBlocks(param)

	if err != nil {

		view.BusinessError(writer, err)

		return
	}

	view.Json(writer, 200, data)
}
