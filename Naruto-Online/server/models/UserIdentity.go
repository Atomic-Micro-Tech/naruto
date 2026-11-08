package models

import (
	"github.com/google/uuid"
	"time"
)

// UserIdentity maps naruto.user_identities. The database remains the source of constraints and defaults.
type UserIdentity struct {
	ID              uuid.UUID `db:"id" json:"-"`
	UserID          uuid.UUID `db:"user_id" json:"-"`
	Provider        string    `db:"provider" json:"-"`
	ProviderAppID   string    `db:"provider_app_id" json:"-"`
	ProviderSubject string    `db:"provider_subject" json:"-"`
	LinkedAt        time.Time `db:"linked_at" json:"-"`
}

// UserIdentityRepo is the data-access contract for naruto.user_identities.
type UserIdentityRepo interface {
	GetByID(id uuid.UUID) (*UserIdentity, error)
	Create(value *UserIdentity) error
}

// NewUserIdentity constructs a row value for scanning or persistence.
func NewUserIdentity() *UserIdentity {

	return &UserIdentity{}
}

func (m *UserIdentity) GetID() uuid.UUID {

	return m.ID
}

func (m *UserIdentity) SetID(value uuid.UUID) {

	m.ID = value
}

func (m *UserIdentity) GetUserID() uuid.UUID {

	return m.UserID
}

func (m *UserIdentity) SetUserID(value uuid.UUID) {

	m.UserID = value
}

func (m *UserIdentity) GetProvider() string {

	return m.Provider
}

func (m *UserIdentity) SetProvider(value string) {

	m.Provider = value
}

func (m *UserIdentity) GetProviderAppID() string {

	return m.ProviderAppID
}

func (m *UserIdentity) SetProviderAppID(value string) {

	m.ProviderAppID = value
}

func (m *UserIdentity) GetProviderSubject() string {

	return m.ProviderSubject
}

func (m *UserIdentity) SetProviderSubject(value string) {

	m.ProviderSubject = value
}

func (m *UserIdentity) GetLinkedAt() time.Time {

	return m.LinkedAt
}

func (m *UserIdentity) SetLinkedAt(value time.Time) {

	m.LinkedAt = value
}
