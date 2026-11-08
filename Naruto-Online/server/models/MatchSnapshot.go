package models

import (
	"encoding/json"
	"github.com/google/uuid"
	"time"
)

// MatchSnapshot maps naruto.match_snapshots. The database remains the source of constraints and defaults.
type MatchSnapshot struct {
	MatchID            uuid.UUID       `db:"match_id" json:"-"`
	StateVersion       int64           `db:"state_version" json:"-"`
	LastEventSequence  int64           `db:"last_event_sequence" json:"-"`
	ServerTick         int64           `db:"server_tick" json:"-"`
	StateSchemaVersion int32           `db:"state_schema_version" json:"-"`
	RNGState           int64           `db:"rng_state" json:"-"`
	RNGDrawCount       int64           `db:"rng_draw_count" json:"-"`
	Snapshot           json.RawMessage `db:"snapshot" json:"-"`
	StateHash          string          `db:"state_hash" json:"-"`
	CreatedAt          time.Time       `db:"created_at" json:"-"`
}

// MatchSnapshotRepo is the data-access contract for naruto.match_snapshots.
type MatchSnapshotRepo interface {
	GetByKey(matchID uuid.UUID, stateVersion int64) (*MatchSnapshot, error)
	Create(value *MatchSnapshot) error
}

// NewMatchSnapshot constructs a row value for scanning or persistence.
func NewMatchSnapshot() *MatchSnapshot {

	return &MatchSnapshot{}
}

func (m *MatchSnapshot) GetMatchID() uuid.UUID {

	return m.MatchID
}

func (m *MatchSnapshot) SetMatchID(value uuid.UUID) {

	m.MatchID = value
}

func (m *MatchSnapshot) GetStateVersion() int64 {

	return m.StateVersion
}

func (m *MatchSnapshot) SetStateVersion(value int64) {

	m.StateVersion = value
}

func (m *MatchSnapshot) GetLastEventSequence() int64 {

	return m.LastEventSequence
}

func (m *MatchSnapshot) SetLastEventSequence(value int64) {

	m.LastEventSequence = value
}

func (m *MatchSnapshot) GetServerTick() int64 {

	return m.ServerTick
}

func (m *MatchSnapshot) SetServerTick(value int64) {

	m.ServerTick = value
}

func (m *MatchSnapshot) GetStateSchemaVersion() int32 {

	return m.StateSchemaVersion
}

func (m *MatchSnapshot) SetStateSchemaVersion(value int32) {

	m.StateSchemaVersion = value
}

func (m *MatchSnapshot) GetRNGState() int64 {

	return m.RNGState
}

func (m *MatchSnapshot) SetRNGState(value int64) {

	m.RNGState = value
}

func (m *MatchSnapshot) GetRNGDrawCount() int64 {

	return m.RNGDrawCount
}

func (m *MatchSnapshot) SetRNGDrawCount(value int64) {

	m.RNGDrawCount = value
}

func (m *MatchSnapshot) GetSnapshot() json.RawMessage {

	return append(json.RawMessage(nil), m.Snapshot...)
}

func (m *MatchSnapshot) SetSnapshot(value json.RawMessage) {

	m.Snapshot = append(json.RawMessage(nil), value...)
}

func (m *MatchSnapshot) GetStateHash() string {

	return m.StateHash
}

func (m *MatchSnapshot) SetStateHash(value string) {

	m.StateHash = value
}

func (m *MatchSnapshot) GetCreatedAt() time.Time {

	return m.CreatedAt
}

func (m *MatchSnapshot) SetCreatedAt(value time.Time) {

	m.CreatedAt = value
}
