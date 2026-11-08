package models

import (
	"encoding/json"
	"github.com/google/uuid"
	"time"
)

// MatchEvent maps naruto.match_events. The database remains the source of constraints and defaults.
type MatchEvent struct {
	MatchID      uuid.UUID       `db:"match_id" json:"-"`
	Sequence     int64           `db:"sequence" json:"-"`
	StateVersion int64           `db:"state_version" json:"-"`
	ServerTick   int64           `db:"server_tick" json:"-"`
	EventType    string          `db:"event_type" json:"-"`
	CommandID    *uuid.UUID      `db:"command_id" json:"-"`
	ActorSeat    *int16          `db:"actor_seat" json:"-"`
	Payload      json.RawMessage `db:"payload" json:"-"`
	CreatedAt    time.Time       `db:"created_at" json:"-"`
}

// MatchEventRepo is the data-access contract for naruto.match_events.
type MatchEventRepo interface {
	GetByKey(matchID uuid.UUID, sequence int64) (*MatchEvent, error)
	Create(value *MatchEvent) error
}

// NewMatchEvent constructs a row value for scanning or persistence.
func NewMatchEvent() *MatchEvent {

	return &MatchEvent{}
}

func (m *MatchEvent) GetMatchID() uuid.UUID {

	return m.MatchID
}

func (m *MatchEvent) SetMatchID(value uuid.UUID) {

	m.MatchID = value
}

func (m *MatchEvent) GetSequence() int64 {

	return m.Sequence
}

func (m *MatchEvent) SetSequence(value int64) {

	m.Sequence = value
}

func (m *MatchEvent) GetStateVersion() int64 {

	return m.StateVersion
}

func (m *MatchEvent) SetStateVersion(value int64) {

	m.StateVersion = value
}

func (m *MatchEvent) GetServerTick() int64 {

	return m.ServerTick
}

func (m *MatchEvent) SetServerTick(value int64) {

	m.ServerTick = value
}

func (m *MatchEvent) GetEventType() string {

	return m.EventType
}

func (m *MatchEvent) SetEventType(value string) {

	m.EventType = value
}

func (m *MatchEvent) GetCommandID() *uuid.UUID {

	return m.CommandID
}

func (m *MatchEvent) SetCommandID(value *uuid.UUID) {

	m.CommandID = value
}

func (m *MatchEvent) GetActorSeat() *int16 {

	return m.ActorSeat
}

func (m *MatchEvent) SetActorSeat(value *int16) {

	m.ActorSeat = value
}

func (m *MatchEvent) GetPayload() json.RawMessage {

	return append(json.RawMessage(nil), m.Payload...)
}

func (m *MatchEvent) SetPayload(value json.RawMessage) {

	m.Payload = append(json.RawMessage(nil), value...)
}

func (m *MatchEvent) GetCreatedAt() time.Time {

	return m.CreatedAt
}

func (m *MatchEvent) SetCreatedAt(value time.Time) {

	m.CreatedAt = value
}
