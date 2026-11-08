package usecase

import (
	"context"
	"github.com/google/uuid"
	"narutoserver/internal"
	"narutoserver/internal/auth"
	"narutoserver/models"
	"narutoserver/repo"
	"narutoserver/worker"
	"strings"
	"time"
)

type AuthCase struct{ ctx context.Context }

func NewAuthUseCase(ctx context.Context) (internal.AuthUseCase, error) {

	if ctx == nil {

		return nil, internal.Reject("INVALID_INPUT", "invalid context")
	}

	return &AuthCase{ctx}, nil
}

func userData(user *models.User) internal.UserData {

	return internal.UserData{ID: user.ID, Email: user.Email, DisplayName: user.DisplayName, EmailVerified: user.EmailVerifiedAt != nil, CreatedAt: user.CreatedAt}
}

func sessionValue(userID uuid.UUID) (*models.Session, string, string, error) {

	cfg, err := internal.GetConfig()

	if err != nil {

		return nil, "", "", err
	}

	token := auth.Token()

	csrf, err := auth.CSRF(token)

	if err != nil {

		return nil, "", "", err
	}

	session := models.NewSession()

	session.ID = uuid.New()

	session.UserID = userID
	session.TokenHash = auth.Digest(token)

	session.CSRFTokenHash = auth.Digest(csrf)

	session.ExpiresAt = time.Now().UTC().Add(time.Duration(cfg.Auth.SessionHours) * time.Hour)

	return session, token, csrf, nil
}

func (u *AuthCase) RegisterEmail(param internal.ParamRegisterEmail) (*internal.DataRegisterEmail, error) {

	users, err := repo.NewUserRepo(u.ctx)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	hash, err := auth.HashPassword(param.Password)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	user := models.NewUser()

	user.ID = uuid.New()

	user.Email = strings.ToLower(strings.TrimSpace(param.Email))

	user.DisplayName = strings.TrimSpace(param.DisplayName)

	token := auth.Token()

	emailToken := models.NewEmailToken()

	emailToken.ID = uuid.New()

	emailToken.UserID = user.ID
	emailToken.Purpose = "verify_email"
	emailToken.TokenHash = auth.Digest(token)

	emailToken.ExpiresAt = time.Now().UTC().Add(24 * time.Hour)

	encrypted, err := worker.EncryptedMail(user.Email, emailToken.Purpose, token)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	job, err := users.Register(user, hash, emailToken, []byte(encrypted))

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	user, err = users.GetByID(user.ID)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	sent, _ := worker.DeliverEmail(u.ctx, job)

	return &internal.DataRegisterEmail{User: userData(user), VerificationEmailSent: sent}, nil
}

func (u *AuthCase) LoginEmail(param internal.ParamLoginEmail) (*internal.DataLoginEmail, error) {

	users, err := repo.NewUserRepo(u.ctx)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	user, credentials, err := users.FindCredentials(strings.ToLower(strings.TrimSpace(param.Email)))

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	if user == nil {

		_, err = auth.HashPassword(param.Password)

		if err != nil {

			return nil, internal.BusinessError(err)
		}

		return nil, internal.Reject("INVALID_CREDENTIALS", "invalid credentials")
	}

	correct := auth.VerifyPassword(credentials.PasswordHash, param.Password)

	if !correct || (credentials.LockedUntil != nil && credentials.LockedUntil.After(time.Now())) {

		err = users.LoginFailure(user.ID)

		if err != nil {

			return nil, internal.BusinessError(err)
		}

		return nil, internal.Reject("INVALID_CREDENTIALS", "invalid credentials")
	}

	sessions, err := repo.NewSessionRepo(u.ctx)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	session, token, csrf, err := sessionValue(user.ID)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	err = sessions.CreateForPassword(user.ID, credentials.PasswordHash, session)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	return &internal.DataLoginEmail{SessionData: internal.SessionData{User: userData(user), ExpiresAt: session.ExpiresAt, CSRFToken: csrf}, CookieToken: token}, nil
}

func (u *AuthCase) GetCurrentSession(param internal.ParamGetCurrentSession) (*internal.DataGetCurrentSession, error) {

	principal, err := internal.CurrentPrincipal(u.ctx)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	users, err := repo.NewUserRepo(u.ctx)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	user, err := users.GetByID(principal.UserID)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	return &internal.DataGetCurrentSession{SessionData: internal.SessionData{User: userData(user), ExpiresAt: principal.ExpiresAt, CSRFToken: principal.CSRFToken}}, nil
}

func (u *AuthCase) Logout(param internal.ParamLogout) (*internal.DataLogout, error) {

	principal, err := internal.CurrentPrincipal(u.ctx)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	sessions, err := repo.NewSessionRepo(u.ctx)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	err = sessions.Revoke(principal.SessionID, principal.UserID)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	return &internal.DataLogout{}, nil
}

func (u *AuthCase) VerifyEmail(param internal.ParamVerifyEmail) (*internal.DataVerifyEmail, error) {

	users, err := repo.NewUserRepo(u.ctx)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	err = users.ConsumeEmailToken(auth.Digest(param.Token), "verify_email", "")

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	return &internal.DataVerifyEmail{Message: "email verified"}, nil
}

func (u *AuthCase) ResendVerification(param internal.ParamResendVerification) (*internal.DataResendVerification, error) {

	principal, err := internal.CurrentPrincipal(u.ctx)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	users, err := repo.NewUserRepo(u.ctx)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	user, err := users.GetByID(principal.UserID)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	if user.EmailVerifiedAt == nil {

		err = u.queueEmail(user, "verify_email", 24*time.Hour)

		if err != nil {

			return nil, internal.BusinessError(err)
		}
	}

	return &internal.DataResendVerification{Message: "verification email requested"}, nil
}

func (u *AuthCase) ForgotPassword(param internal.ParamForgotPassword) (*internal.DataForgotPassword, error) {

	users, err := repo.NewUserRepo(u.ctx)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	user, _, err := users.FindCredentials(strings.ToLower(strings.TrimSpace(param.Email)))

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	if user != nil {

		err = u.queueEmail(user, "reset_password", 30*time.Minute)

		if err != nil {

			return nil, internal.BusinessError(err)
		}
	}

	return &internal.DataForgotPassword{Message: "if the account exists, a reset email has been requested"}, nil
}

func (u *AuthCase) ResetPassword(param internal.ParamResetPassword) (*internal.DataResetPassword, error) {

	hash, err := auth.HashPassword(param.NewPassword)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	users, err := repo.NewUserRepo(u.ctx)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	err = users.ConsumeEmailToken(auth.Digest(param.Token), "reset_password", hash)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	return &internal.DataResetPassword{Message: "password reset; log in again"}, nil
}

func (u *AuthCase) RefreshSession(param internal.ParamRefreshSession) (*internal.DataRefreshSession, error) {

	principal, err := internal.CurrentPrincipal(u.ctx)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	sessions, err := repo.NewSessionRepo(u.ctx)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	session, token, csrf, err := sessionValue(principal.UserID)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	err = sessions.Rotate(principal.SessionID, principal.UserID, session)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	users, err := repo.NewUserRepo(u.ctx)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	user, err := users.GetByID(principal.UserID)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	return &internal.DataRefreshSession{SessionData: internal.SessionData{User: userData(user), ExpiresAt: session.ExpiresAt, CSRFToken: csrf}, CookieToken: token}, nil
}

func (u *AuthCase) queueEmail(user *models.User, purpose string, lifetime time.Duration) error {

	users, err := repo.NewUserRepo(u.ctx)

	if err != nil {

		return err
	}

	token := auth.Token()

	mail, err := worker.EncryptedMail(user.Email, purpose, token)

	if err != nil {

		return err
	}

	_, err = users.QueueEmail(user.ID, purpose, uuid.New(), auth.Digest(token), time.Now().UTC().Add(lifetime), mail)

	return err
}
