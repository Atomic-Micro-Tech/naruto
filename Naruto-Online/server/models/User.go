package models

import (
	"github.com/google/uuid"
	"time"
)

// User maps naruto.users. The database remains the source of constraints and defaults.
type User struct {
	ID              uuid.UUID  `db:"id" json:"-"`
	Email           string     `db:"email" json:"-"`
	DisplayName     string     `db:"display_name" json:"-"`
	EmailVerifiedAt *time.Time `db:"email_verified_at" json:"-"`
	Status          string     `db:"status" json:"-"`
	SessionEpoch    int64      `db:"session_epoch" json:"-"`
	CreatedAt       time.Time  `db:"created_at" json:"-"`
	UpdatedAt       time.Time  `db:"updated_at" json:"-"`
}

// UserRepo is the data-access contract for naruto.users.
type UserRepo interface {
	GetByID(id uuid.UUID) (*User, error)
	Create(value *User) error
	Update(value *User) error
}

// NewUser constructs a row value for scanning or persistence.
func NewUser() *User {

	return &User{}
}

func (m *User) GetID() uuid.UUID {

	return m.ID
}

func (m *User) SetID(value uuid.UUID) {

	m.ID = value
}

func (m *User) GetEmail() string {

	return m.Email
}

func (m *User) SetEmail(value string) {

	m.Email = value
}

func (m *User) GetDisplayName() string {

	return m.DisplayName
}

func (m *User) SetDisplayName(value string) {

	m.DisplayName = value
}

func (m *User) GetEmailVerifiedAt() *time.Time {

	return m.EmailVerifiedAt
}

func (m *User) SetEmailVerifiedAt(value *time.Time) {

	m.EmailVerifiedAt = value
}

func (m *User) GetStatus() string {

	return m.Status
}

func (m *User) SetStatus(value string) {

	m.Status = value
}

func (m *User) GetSessionEpoch() int64 {

	return m.SessionEpoch
}

func (m *User) SetSessionEpoch(value int64) {

	m.SessionEpoch = value
}

func (m *User) GetCreatedAt() time.Time {

	return m.CreatedAt
}

func (m *User) SetCreatedAt(value time.Time) {

	m.CreatedAt = value
}

func (m *User) GetUpdatedAt() time.Time {

	return m.UpdatedAt
}

func (m *User) SetUpdatedAt(value time.Time) {

	m.UpdatedAt = value
}
