package controller

import "net/http"

// HandleRegisterEmail reserves the POST /v1/auth/register route until its use case is implemented.
func HandleRegisterEmail(writer http.ResponseWriter, request *http.Request) {

	unavailable(writer, request, "controller/Auth.HandleRegisterEmail")
}

// HandleLoginEmail reserves the POST /v1/auth/login route until its use case is implemented.
func HandleLoginEmail(writer http.ResponseWriter, request *http.Request) {

	unavailable(writer, request, "controller/Auth.HandleLoginEmail")
}

// HandleGetCurrentSession reserves the GET /v1/auth/me route until its use case is implemented.
func HandleGetCurrentSession(writer http.ResponseWriter, request *http.Request) {

	unavailable(writer, request, "controller/Auth.HandleGetCurrentSession")
}

// HandleLogout reserves the POST /v1/auth/logout route until its use case is implemented.
func HandleLogout(writer http.ResponseWriter, request *http.Request) {

	unavailable(writer, request, "controller/Auth.HandleLogout")
}

// HandleVerifyEmail reserves the POST /v1/auth/verify-email route until its use case is implemented.
func HandleVerifyEmail(writer http.ResponseWriter, request *http.Request) {

	unavailable(writer, request, "controller/Auth.HandleVerifyEmail")
}

// HandleResendVerification reserves the POST /v1/auth/resend-verification route until its use case is implemented.
func HandleResendVerification(writer http.ResponseWriter, request *http.Request) {

	unavailable(writer, request, "controller/Auth.HandleResendVerification")
}

// HandleForgotPassword reserves the POST /v1/auth/forgot-password route until its use case is implemented.
func HandleForgotPassword(writer http.ResponseWriter, request *http.Request) {

	unavailable(writer, request, "controller/Auth.HandleForgotPassword")
}

// HandleResetPassword reserves the POST /v1/auth/reset-password route until its use case is implemented.
func HandleResetPassword(writer http.ResponseWriter, request *http.Request) {

	unavailable(writer, request, "controller/Auth.HandleResetPassword")
}

// HandleRefreshSession reserves the POST /v1/session/refresh route until its use case is implemented.
func HandleRefreshSession(writer http.ResponseWriter, request *http.Request) {

	unavailable(writer, request, "controller/Auth.HandleRefreshSession")
}
