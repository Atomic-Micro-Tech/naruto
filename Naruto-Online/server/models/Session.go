package models

import (
	"github.com/google/uuid"
	"time"
)

// Session maps naruto.sessions. The database remains the source of constraints and defaults.
type Session struct {
	ID            uuid.UUID  `db:"id" json:"-"`
	UserID        uuid.UUID  `db:"user_id" json:"-"`
	TokenHash     []byte     `db:"token_hash" json:"-"`
	CSRFTokenHash []byte     `db:"csrf_token_hash" json:"-"`
	CreatedAt     time.Time  `db:"created_at" json:"-"`
	LastSeenAt    time.Time  `db:"last_seen_at" json:"-"`
	ExpiresAt     time.Time  `db:"expires_at" json:"-"`
	RevokedAt     *time.Time `db:"revoked_at" json:"-"`
	RevokeReason  *string    `db:"revoke_reason" json:"-"`
}

// SessionRepo is the data-access contract for naruto.sessions.
type SessionRepo interface {
	GetByID(id uuid.UUID) (*Session, error)
	Create(value *Session) error
	Update(value *Session) error
	Authenticate(hash []byte) (*Session, error)
	CreateForPassword(userID uuid.UUID, passwordHash string, s *Session) error
	Revoke(id, userID uuid.UUID) error
	Rotate(oldID, userID uuid.UUID, s *Session) error
}

// NewSession constructs a row value for scanning or persistence.
func NewSession() *Session {

	return &Session{}
}

func (m *Session) GetID() uuid.UUID {

	return m.ID
}

func (m *Session) SetID(value uuid.UUID) {

	m.ID = value
}

func (m *Session) GetUserID() uuid.UUID {

	return m.UserID
}

func (m *Session) SetUserID(value uuid.UUID) {

	m.UserID = value
}

func (m *Session) GetTokenHash() []byte {

	return append([]byte(nil), m.TokenHash...)
}

func (m *Session) SetTokenHash(value []byte) {

	m.TokenHash = append([]byte(nil), value...)
}

func (m *Session) GetCSRFTokenHash() []byte {

	return append([]byte(nil), m.CSRFTokenHash...)
}

func (m *Session) SetCSRFTokenHash(value []byte) {

	m.CSRFTokenHash = append([]byte(nil), value...)
}

func (m *Session) GetCreatedAt() time.Time {

	return m.CreatedAt
}

func (m *Session) SetCreatedAt(value time.Time) {

	m.CreatedAt = value
}

func (m *Session) GetLastSeenAt() time.Time {

	return m.LastSeenAt
}

func (m *Session) SetLastSeenAt(value time.Time) {

	m.LastSeenAt = value
}

func (m *Session) GetExpiresAt() time.Time {

	return m.ExpiresAt
}

func (m *Session) SetExpiresAt(value time.Time) {

	m.ExpiresAt = value
}

func (m *Session) GetRevokedAt() *time.Time {

	return m.RevokedAt
}

func (m *Session) SetRevokedAt(value *time.Time) {

	m.RevokedAt = value
}

func (m *Session) GetRevokeReason() *string {

	return m.RevokeReason
}

func (m *Session) SetRevokeReason(value *string) {

	m.RevokeReason = value
}
