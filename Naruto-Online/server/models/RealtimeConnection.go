package models

import (
	"github.com/google/uuid"
	"time"
)

// RealtimeConnection maps naruto.realtime_connections. The database remains the source of constraints and defaults.
type RealtimeConnection struct {
	ID               uuid.UUID  `db:"id" json:"-"`
	UserID           uuid.UUID  `db:"user_id" json:"-"`
	SessionID        uuid.UUID  `db:"session_id" json:"-"`
	SessionEpoch     int64      `db:"session_epoch" json:"-"`
	ConnectedAt      time.Time  `db:"connected_at" json:"-"`
	LastHeartbeatAt  time.Time  `db:"last_heartbeat_at" json:"-"`
	DisconnectedAt   *time.Time `db:"disconnected_at" json:"-"`
	DisconnectReason *string    `db:"disconnect_reason" json:"-"`
}

// RealtimeConnectionRepo is the data-access contract for naruto.realtime_connections.
type RealtimeConnectionRepo interface {
	GetByID(id uuid.UUID) (*RealtimeConnection, error)
	Create(value *RealtimeConnection) error
	Update(value *RealtimeConnection) error
}

// NewRealtimeConnection constructs a row value for scanning or persistence.
func NewRealtimeConnection() *RealtimeConnection {

	return &RealtimeConnection{}
}

func (m *RealtimeConnection) GetID() uuid.UUID {

	return m.ID
}

func (m *RealtimeConnection) SetID(value uuid.UUID) {

	m.ID = value
}

func (m *RealtimeConnection) GetUserID() uuid.UUID {

	return m.UserID
}

func (m *RealtimeConnection) SetUserID(value uuid.UUID) {

	m.UserID = value
}

func (m *RealtimeConnection) GetSessionID() uuid.UUID {

	return m.SessionID
}

func (m *RealtimeConnection) SetSessionID(value uuid.UUID) {

	m.SessionID = value
}

func (m *RealtimeConnection) GetSessionEpoch() int64 {

	return m.SessionEpoch
}

func (m *RealtimeConnection) SetSessionEpoch(value int64) {

	m.SessionEpoch = value
}

func (m *RealtimeConnection) GetConnectedAt() time.Time {

	return m.ConnectedAt
}

func (m *RealtimeConnection) SetConnectedAt(value time.Time) {

	m.ConnectedAt = value
}

func (m *RealtimeConnection) GetLastHeartbeatAt() time.Time {

	return m.LastHeartbeatAt
}

func (m *RealtimeConnection) SetLastHeartbeatAt(value time.Time) {

	m.LastHeartbeatAt = value
}

func (m *RealtimeConnection) GetDisconnectedAt() *time.Time {

	return m.DisconnectedAt
}

func (m *RealtimeConnection) SetDisconnectedAt(value *time.Time) {

	m.DisconnectedAt = value
}

func (m *RealtimeConnection) GetDisconnectReason() *string {

	return m.DisconnectReason
}

func (m *RealtimeConnection) SetDisconnectReason(value *string) {

	m.DisconnectReason = value
}
