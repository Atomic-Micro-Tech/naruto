package models

import (
	"github.com/google/uuid"
	"time"
)

// UserCredential maps naruto.user_credentials. The database remains the source of constraints and defaults.
type UserCredential struct {
	UserID            uuid.UUID  `db:"user_id" json:"-"`
	PasswordHash      string     `db:"password_hash" json:"-"`
	PasswordChangedAt time.Time  `db:"password_changed_at" json:"-"`
	FailedLoginCount  int32      `db:"failed_login_count" json:"-"`
	LockedUntil       *time.Time `db:"locked_until" json:"-"`
	UpdatedAt         time.Time  `db:"updated_at" json:"-"`
}

// UserCredentialRepo is the data-access contract for naruto.user_credentials.
type UserCredentialRepo interface {
	GetByUserID(userID uuid.UUID) (*UserCredential, error)
	Create(value *UserCredential) error
	Update(value *UserCredential) error
}

// NewUserCredential constructs a row value for scanning or persistence.
func NewUserCredential() *UserCredential {

	return &UserCredential{}
}

func (m *UserCredential) GetUserID() uuid.UUID {

	return m.UserID
}

func (m *UserCredential) SetUserID(value uuid.UUID) {

	m.UserID = value
}

func (m *UserCredential) GetPasswordHash() string {

	return m.PasswordHash
}

func (m *UserCredential) SetPasswordHash(value string) {

	m.PasswordHash = value
}

func (m *UserCredential) GetPasswordChangedAt() time.Time {

	return m.PasswordChangedAt
}

func (m *UserCredential) SetPasswordChangedAt(value time.Time) {

	m.PasswordChangedAt = value
}

func (m *UserCredential) GetFailedLoginCount() int32 {

	return m.FailedLoginCount
}

func (m *UserCredential) SetFailedLoginCount(value int32) {

	m.FailedLoginCount = value
}

func (m *UserCredential) GetLockedUntil() *time.Time {

	return m.LockedUntil
}

func (m *UserCredential) SetLockedUntil(value *time.Time) {

	m.LockedUntil = value
}

func (m *UserCredential) GetUpdatedAt() time.Time {

	return m.UpdatedAt
}

func (m *UserCredential) SetUpdatedAt(value time.Time) {

	m.UpdatedAt = value
}
