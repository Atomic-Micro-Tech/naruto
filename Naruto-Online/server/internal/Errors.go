package internal

import "errors"

var (
	ErrConfigNotLoaded = errors.New("configuration not loaded")

	ErrConnectionNotOpen = errors.New("database connection not open")
)

// InputError describes a safe business rejection, without selecting an HTTP status.
type InputError struct {
	Code    string
	Message string
}

func (e *InputError) Error() string {

	return e.Message
}

type InternalError struct{ Cause error }

func (e *InternalError) Error() string {

	return "service unavailable"
}

func (e *InternalError) Unwrap() error {

	return e.Cause
}

func Reject(code, message string) error {

	return &InputError{Code: code, Message: message}
}

func BusinessError(err error) error {

	if err == nil {

		return nil
	}

	var input *InputError
	if errors.As(err, &input) {

		return input
	}

	var failure *InternalError
	if errors.As(err, &failure) {

		return failure
	}

	return &InternalError{Cause: err}
}
