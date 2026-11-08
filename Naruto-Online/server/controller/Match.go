package controller

import (
	"narutoserver/internal"
	"narutoserver/telemetry"
	"narutoserver/usecase"
	"narutoserver/view"
	"net/http"
)

func HandleGetMatch(writer http.ResponseWriter, request *http.Request) {

	ctx, span := telemetry.Tracer.Start(request.Context(), "controller/Match.GetMatch")

	defer span.End()

	request = request.WithContext(ctx)

	var req internal.RequestGetMatch
	var param internal.ParamGetMatch
	var err error
	valid := false
	req.MatchID, valid = identifier(request.PathValue("matchId"))

	if !valid {

		view.Error(writer, 400, "INVALID_INPUT", "invalid input")

		return
	}

	param.MatchID = req.MatchID

	service, err := usecase.NewMatchUseCase(request.Context())

	if err != nil {

		view.Error(writer, 400, "INVALID_INPUT", "invalid context")

		return
	}

	data, err := service.GetMatch(param)

	if err != nil {

		view.BusinessError(writer, err)

		return
	}

	view.Json(writer, 200, data)
}
