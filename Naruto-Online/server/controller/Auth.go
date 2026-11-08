package controller

import (
	"narutoserver/internal"
	"narutoserver/telemetry"
	"narutoserver/usecase"
	"narutoserver/view"
	"net/http"
	"strings"
	"time"
)

func HandleRegisterEmail(writer http.ResponseWriter, request *http.Request) {

	ctx, span := telemetry.Tracer.Start(request.Context(), "controller/Auth.RegisterEmail")

	defer span.End()

	request = request.WithContext(ctx)

	var req internal.RequestRegisterEmail
	var param internal.ParamRegisterEmail
	var err error
	valid := false
	err = decode(writer, request, &req, "email", "password", "displayName")

	valid = err == nil && email(req.Email) && length(req.Password, 12, 128) && length(strings.TrimSpace(req.DisplayName), 1, 32)

	if !valid {

		view.Error(writer, 400, "INVALID_INPUT", "invalid input")

		return
	}

	param.Email = req.Email
	param.Password = req.Password
	param.DisplayName = req.DisplayName

	service, err := usecase.NewAuthUseCase(request.Context())

	if err != nil {

		view.Error(writer, 400, "INVALID_INPUT", "invalid context")

		return
	}

	data, err := service.RegisterEmail(param)

	if err != nil {

		view.BusinessError(writer, err)

		return
	}

	view.Json(writer, 201, data)
}

func HandleLoginEmail(writer http.ResponseWriter, request *http.Request) {

	ctx, span := telemetry.Tracer.Start(request.Context(), "controller/Auth.LoginEmail")

	defer span.End()

	request = request.WithContext(ctx)

	var req internal.RequestLoginEmail
	var param internal.ParamLoginEmail
	var err error
	valid := false
	err = decode(writer, request, &req, "email", "password")

	valid = err == nil && email(req.Email) && length(req.Password, 1, 128)

	if !valid {

		view.Error(writer, 400, "INVALID_INPUT", "invalid input")

		return
	}

	param.Email = req.Email
	param.Password = req.Password

	service, err := usecase.NewAuthUseCase(request.Context())

	if err != nil {

		view.Error(writer, 400, "INVALID_INPUT", "invalid context")

		return
	}

	data, err := service.LoginEmail(param)

	if err != nil {

		view.BusinessError(writer, err)

		return
	}

	sessionCookie(writer, data.CookieToken, data.ExpiresAt)

	view.Json(writer, 200, data)
}

func HandleGetCurrentSession(writer http.ResponseWriter, request *http.Request) {

	ctx, span := telemetry.Tracer.Start(request.Context(), "controller/Auth.GetCurrentSession")

	defer span.End()

	request = request.WithContext(ctx)

	var req internal.RequestGetCurrentSession
	var param internal.ParamGetCurrentSession
	var err error
	valid := false
	valid = noBody(request)

	if !valid {

		view.Error(writer, 400, "INVALID_INPUT", "invalid input")

		return
	}

	_ = req
	service, err := usecase.NewAuthUseCase(request.Context())

	if err != nil {

		view.Error(writer, 400, "INVALID_INPUT", "invalid context")

		return
	}

	data, err := service.GetCurrentSession(param)

	if err != nil {

		view.BusinessError(writer, err)

		return
	}

	view.Json(writer, 200, data)
}

func HandleLogout(writer http.ResponseWriter, request *http.Request) {

	ctx, span := telemetry.Tracer.Start(request.Context(), "controller/Auth.Logout")

	defer span.End()

	request = request.WithContext(ctx)

	var req internal.RequestLogout
	var param internal.ParamLogout
	var err error
	valid := false
	valid = noBody(request)

	if !valid {

		view.Error(writer, 400, "INVALID_INPUT", "invalid input")

		return
	}

	_ = req
	service, err := usecase.NewAuthUseCase(request.Context())

	if err != nil {

		view.Error(writer, 400, "INVALID_INPUT", "invalid context")

		return
	}

	data, err := service.Logout(param)

	if err != nil {

		view.BusinessError(writer, err)

		return
	}

	sessionCookie(writer, "", time.Unix(1, 0))

	_ = data
	view.NoContent(writer)
}

func HandleVerifyEmail(writer http.ResponseWriter, request *http.Request) {

	ctx, span := telemetry.Tracer.Start(request.Context(), "controller/Auth.VerifyEmail")

	defer span.End()

	request = request.WithContext(ctx)

	var req internal.RequestVerifyEmail
	var param internal.ParamVerifyEmail
	var err error
	valid := false
	err = decode(writer, request, &req, "token")

	valid = err == nil && length(req.Token, 20, 1024)

	if !valid {

		view.Error(writer, 400, "INVALID_INPUT", "invalid input")

		return
	}

	param.Token = req.Token

	service, err := usecase.NewAuthUseCase(request.Context())

	if err != nil {

		view.Error(writer, 400, "INVALID_INPUT", "invalid context")

		return
	}

	data, err := service.VerifyEmail(param)

	if err != nil {

		view.BusinessError(writer, err)

		return
	}

	view.Json(writer, 200, data)
}

func HandleResendVerification(writer http.ResponseWriter, request *http.Request) {

	ctx, span := telemetry.Tracer.Start(request.Context(), "controller/Auth.ResendVerification")

	defer span.End()

	request = request.WithContext(ctx)

	var req internal.RequestResendVerification
	var param internal.ParamResendVerification
	var err error
	valid := false
	valid = noBody(request)

	if !valid {

		view.Error(writer, 400, "INVALID_INPUT", "invalid input")

		return
	}

	_ = req
	service, err := usecase.NewAuthUseCase(request.Context())

	if err != nil {

		view.Error(writer, 400, "INVALID_INPUT", "invalid context")

		return
	}

	data, err := service.ResendVerification(param)

	if err != nil {

		view.BusinessError(writer, err)

		return
	}

	view.Json(writer, 202, data)
}

func HandleForgotPassword(writer http.ResponseWriter, request *http.Request) {

	ctx, span := telemetry.Tracer.Start(request.Context(), "controller/Auth.ForgotPassword")

	defer span.End()

	request = request.WithContext(ctx)

	var req internal.RequestForgotPassword
	var param internal.ParamForgotPassword
	var err error
	valid := false
	err = decode(writer, request, &req, "email")

	valid = err == nil && email(req.Email)

	if !valid {

		view.Error(writer, 400, "INVALID_INPUT", "invalid input")

		return
	}

	param.Email = req.Email

	service, err := usecase.NewAuthUseCase(request.Context())

	if err != nil {

		view.Error(writer, 400, "INVALID_INPUT", "invalid context")

		return
	}

	data, err := service.ForgotPassword(param)

	if err != nil {

		view.BusinessError(writer, err)

		return
	}

	view.Json(writer, 202, data)
}

func HandleResetPassword(writer http.ResponseWriter, request *http.Request) {

	ctx, span := telemetry.Tracer.Start(request.Context(), "controller/Auth.ResetPassword")

	defer span.End()

	request = request.WithContext(ctx)

	var req internal.RequestResetPassword
	var param internal.ParamResetPassword
	var err error
	valid := false
	err = decode(writer, request, &req, "token", "newPassword")

	valid = err == nil && length(req.Token, 20, 1024) && length(req.NewPassword, 12, 128)

	if !valid {

		view.Error(writer, 400, "INVALID_INPUT", "invalid input")

		return
	}

	param.Token = req.Token
	param.NewPassword = req.NewPassword

	service, err := usecase.NewAuthUseCase(request.Context())

	if err != nil {

		view.Error(writer, 400, "INVALID_INPUT", "invalid context")

		return
	}

	data, err := service.ResetPassword(param)

	if err != nil {

		view.BusinessError(writer, err)

		return
	}

	view.Json(writer, 200, data)
}

func HandleRefreshSession(writer http.ResponseWriter, request *http.Request) {

	ctx, span := telemetry.Tracer.Start(request.Context(), "controller/Auth.RefreshSession")

	defer span.End()

	request = request.WithContext(ctx)

	var req internal.RequestRefreshSession
	var param internal.ParamRefreshSession
	var err error
	valid := false
	valid = noBody(request)

	if !valid {

		view.Error(writer, 400, "INVALID_INPUT", "invalid input")

		return
	}

	_ = req
	service, err := usecase.NewAuthUseCase(request.Context())

	if err != nil {

		view.Error(writer, 400, "INVALID_INPUT", "invalid context")

		return
	}

	data, err := service.RefreshSession(param)

	if err != nil {

		view.BusinessError(writer, err)

		return
	}

	sessionCookie(writer, data.CookieToken, data.ExpiresAt)

	view.Json(writer, 200, data)
}
