package view

import (
	"errors"
	"narutoserver/internal"
	"net/http"
)

func BusinessError(w http.ResponseWriter, err error) {

	var failure *internal.InternalError
	if errors.As(err, &failure) {

		Error(w, 503, "UNAVAILABLE", "service temporarily unavailable")

		return
	}

	var input *internal.InputError
	if errors.As(err, &input) {

		status := http.StatusBadRequest
		switch input.Code {

		case "UNAVAILABLE":
			status = 503
		case "UNAUTHENTICATED", "INVALID_CREDENTIALS":
			status = 401
		case "FORBIDDEN", "CSRF_INVALID", "HOST_REQUIRED", "VOICE_DISABLED":
			status = 403
		case "NOT_FOUND":
			status = 404
		case "IDEMPOTENCY_CONFLICT", "EMAIL_IN_USE", "ALREADY_IN_ROOM", "ROOM_FULL", "ROOM_NOT_WAITING", "CONFLICT", "VERSION_CONFLICT":
			status = 409
		case "RATE_LIMITED":
			status = 429
		}

		Error(w, status, input.Code, input.Message)

		return
	}

	Error(w, 503, "UNAVAILABLE", "service temporarily unavailable")
}

func NoContent(w http.ResponseWriter) {

	w.Header().Set("Cache-Control", "no-store")

	w.WriteHeader(http.StatusNoContent)
}
