package models

import (
	"github.com/google/uuid"
	"time"
)

// WSTicket maps naruto.ws_tickets. The database remains the source of constraints and defaults.
type WSTicket struct {
	ID         uuid.UUID  `db:"id" json:"-"`
	SessionID  uuid.UUID  `db:"session_id" json:"-"`
	TokenHash  []byte     `db:"token_hash" json:"-"`
	Origin     string     `db:"origin" json:"-"`
	CreatedAt  time.Time  `db:"created_at" json:"-"`
	ExpiresAt  time.Time  `db:"expires_at" json:"-"`
	ConsumedAt *time.Time `db:"consumed_at" json:"-"`
}

// WSTicketRepo is the data-access contract for naruto.ws_tickets.
type WSTicketRepo interface {
	Issue(sessionID uuid.UUID, hash []byte, origin string) (*WSTicket, error)
	GetByID(id uuid.UUID) (*WSTicket, error)
	Create(value *WSTicket) error
	Update(value *WSTicket) error
	Consume(hash []byte, origin string) (*WSTicket, error)
}

// NewWSTicket constructs a row value for scanning or persistence.
func NewWSTicket() *WSTicket {

	return &WSTicket{}
}

func (m *WSTicket) GetID() uuid.UUID {

	return m.ID
}

func (m *WSTicket) SetID(value uuid.UUID) {

	m.ID = value
}

func (m *WSTicket) GetSessionID() uuid.UUID {

	return m.SessionID
}

func (m *WSTicket) SetSessionID(value uuid.UUID) {

	m.SessionID = value
}

func (m *WSTicket) GetTokenHash() []byte {

	return append([]byte(nil), m.TokenHash...)
}

func (m *WSTicket) SetTokenHash(value []byte) {

	m.TokenHash = append([]byte(nil), value...)
}

func (m *WSTicket) GetOrigin() string {

	return m.Origin
}

func (m *WSTicket) SetOrigin(value string) {

	m.Origin = value
}

func (m *WSTicket) GetCreatedAt() time.Time {

	return m.CreatedAt
}

func (m *WSTicket) SetCreatedAt(value time.Time) {

	m.CreatedAt = value
}

func (m *WSTicket) GetExpiresAt() time.Time {

	return m.ExpiresAt
}

func (m *WSTicket) SetExpiresAt(value time.Time) {

	m.ExpiresAt = value
}

func (m *WSTicket) GetConsumedAt() *time.Time {

	return m.ConsumedAt
}

func (m *WSTicket) SetConsumedAt(value *time.Time) {

	m.ConsumedAt = value
}
