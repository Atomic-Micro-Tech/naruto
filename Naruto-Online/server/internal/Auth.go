package internal

type RequestRegisterEmail struct {
	Email       string `json:"email"`
	Password    string `json:"password"`
	DisplayName string `json:"displayName"`
}

type ParamRegisterEmail struct {
	Email       string `json:"email"`
	Password    string `json:"password"`
	DisplayName string `json:"displayName"`
}

type DataRegisterEmail struct {
	User                  UserData `json:"user"`
	VerificationEmailSent bool     `json:"verificationEmailSent"`
}

type RequestLoginEmail struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type ParamLoginEmail struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type DataLoginEmail struct {
	SessionData
	CookieToken string `json:"-"`
}

type RequestGetCurrentSession struct{}
type ParamGetCurrentSession struct{}
type DataGetCurrentSession struct{ SessionData }

type RequestLogout struct{}
type ParamLogout struct{}
type DataLogout struct{}

type RequestVerifyEmail struct {
	Token string `json:"token"`
}

type ParamVerifyEmail struct {
	Token string `json:"token"`
}

type DataVerifyEmail struct {
	Message string `json:"message"`
}

type RequestResendVerification struct{}
type ParamResendVerification struct{}
type DataResendVerification struct {
	Message string `json:"message"`
}

type RequestForgotPassword struct {
	Email string `json:"email"`
}

type ParamForgotPassword struct {
	Email string `json:"email"`
}

type DataForgotPassword struct {
	Message string `json:"message"`
}

type RequestResetPassword struct {
	Token       string `json:"token"`
	NewPassword string `json:"newPassword"`
}

type ParamResetPassword struct {
	Token       string `json:"token"`
	NewPassword string `json:"newPassword"`
}

type DataResetPassword struct {
	Message string `json:"message"`
}

type RequestRefreshSession struct{}
type ParamRefreshSession struct{}
type DataRefreshSession struct {
	SessionData
	CookieToken string `json:"-"`
}

type AuthUseCase interface {
	RegisterEmail(param ParamRegisterEmail) (*DataRegisterEmail, error)
	LoginEmail(param ParamLoginEmail) (*DataLoginEmail, error)
	GetCurrentSession(param ParamGetCurrentSession) (*DataGetCurrentSession, error)
	Logout(param ParamLogout) (*DataLogout, error)
	VerifyEmail(param ParamVerifyEmail) (*DataVerifyEmail, error)
	ResendVerification(param ParamResendVerification) (*DataResendVerification, error)
	ForgotPassword(param ParamForgotPassword) (*DataForgotPassword, error)
	ResetPassword(param ParamResetPassword) (*DataResetPassword, error)
	RefreshSession(param ParamRefreshSession) (*DataRefreshSession, error)
}
