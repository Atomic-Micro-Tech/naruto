package models

import (
	"github.com/google/uuid"
	"time"
)

// EmailToken maps naruto.email_tokens. The database remains the source of constraints and defaults.
type EmailToken struct {
	ID        uuid.UUID  `db:"id" json:"-"`
	UserID    uuid.UUID  `db:"user_id" json:"-"`
	Purpose   string     `db:"purpose" json:"-"`
	Email     string     `db:"email" json:"-"`
	TokenHash []byte     `db:"token_hash" json:"-"`
	CreatedAt time.Time  `db:"created_at" json:"-"`
	ExpiresAt time.Time  `db:"expires_at" json:"-"`
	UsedAt    *time.Time `db:"used_at" json:"-"`
	RevokedAt *time.Time `db:"revoked_at" json:"-"`
}

// EmailTokenRepo is the data-access contract for naruto.email_tokens.
type EmailTokenRepo interface {
	GetByID(id uuid.UUID) (*EmailToken, error)
	Create(value *EmailToken) error
	Update(value *EmailToken) error
}

// NewEmailToken constructs a row value for scanning or persistence.
func NewEmailToken() *EmailToken {

	return &EmailToken{}
}

func (m *EmailToken) GetID() uuid.UUID {

	return m.ID
}

func (m *EmailToken) SetID(value uuid.UUID) {

	m.ID = value
}

func (m *EmailToken) GetUserID() uuid.UUID {

	return m.UserID
}

func (m *EmailToken) SetUserID(value uuid.UUID) {

	m.UserID = value
}

func (m *EmailToken) GetPurpose() string {

	return m.Purpose
}

func (m *EmailToken) SetPurpose(value string) {

	m.Purpose = value
}

func (m *EmailToken) GetEmail() string {

	return m.Email
}

func (m *EmailToken) SetEmail(value string) {

	m.Email = value
}

func (m *EmailToken) GetTokenHash() []byte {

	return append([]byte(nil), m.TokenHash...)
}

func (m *EmailToken) SetTokenHash(value []byte) {

	m.TokenHash = append([]byte(nil), value...)
}

func (m *EmailToken) GetCreatedAt() time.Time {

	return m.CreatedAt
}

func (m *EmailToken) SetCreatedAt(value time.Time) {

	m.CreatedAt = value
}

func (m *EmailToken) GetExpiresAt() time.Time {

	return m.ExpiresAt
}

func (m *EmailToken) SetExpiresAt(value time.Time) {

	m.ExpiresAt = value
}

func (m *EmailToken) GetUsedAt() *time.Time {

	return m.UsedAt
}

func (m *EmailToken) SetUsedAt(value *time.Time) {

	m.UsedAt = value
}

func (m *EmailToken) GetRevokedAt() *time.Time {

	return m.RevokedAt
}

func (m *EmailToken) SetRevokedAt(value *time.Time) {

	m.RevokedAt = value
}
