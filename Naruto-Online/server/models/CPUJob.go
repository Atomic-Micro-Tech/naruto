package models

import (
	"encoding/json"
	"github.com/google/uuid"
	"time"
)

// CPUJob maps naruto.cpu_jobs. The database remains the source of constraints and defaults.
type CPUJob struct {
	ID                   uuid.UUID       `db:"id" json:"-"`
	MatchID              uuid.UUID       `db:"match_id" json:"-"`
	Seat                 int16           `db:"seat" json:"-"`
	ControlEpoch         int64           `db:"control_epoch" json:"-"`
	DecisionID           string          `db:"decision_id" json:"-"`
	ExpectedStateVersion int64           `db:"expected_state_version" json:"-"`
	AIPolicyVersion      string          `db:"ai_policy_version" json:"-"`
	CommandID            uuid.UUID       `db:"command_id" json:"-"`
	Status               string          `db:"status" json:"-"`
	DueTick              int64           `db:"due_tick" json:"-"`
	Context              json.RawMessage `db:"context" json:"-"`
	Trace                json.RawMessage `db:"trace" json:"-"`
	CreatedAt            time.Time       `db:"created_at" json:"-"`
	UpdatedAt            time.Time       `db:"updated_at" json:"-"`
}

// CPUJobRepo is the data-access contract for naruto.cpu_jobs.
type CPUJobRepo interface {
	GetByID(id uuid.UUID) (*CPUJob, error)
	Create(value *CPUJob) error
	Update(value *CPUJob) error
}

// NewCPUJob constructs a row value for scanning or persistence.
func NewCPUJob() *CPUJob {

	return &CPUJob{}
}

func (m *CPUJob) GetID() uuid.UUID {

	return m.ID
}

func (m *CPUJob) SetID(value uuid.UUID) {

	m.ID = value
}

func (m *CPUJob) GetMatchID() uuid.UUID {

	return m.MatchID
}

func (m *CPUJob) SetMatchID(value uuid.UUID) {

	m.MatchID = value
}

func (m *CPUJob) GetSeat() int16 {

	return m.Seat
}

func (m *CPUJob) SetSeat(value int16) {

	m.Seat = value
}

func (m *CPUJob) GetControlEpoch() int64 {

	return m.ControlEpoch
}

func (m *CPUJob) SetControlEpoch(value int64) {

	m.ControlEpoch = value
}

func (m *CPUJob) GetDecisionID() string {

	return m.DecisionID
}

func (m *CPUJob) SetDecisionID(value string) {

	m.DecisionID = value
}

func (m *CPUJob) GetExpectedStateVersion() int64 {

	return m.ExpectedStateVersion
}

func (m *CPUJob) SetExpectedStateVersion(value int64) {

	m.ExpectedStateVersion = value
}

func (m *CPUJob) GetAIPolicyVersion() string {

	return m.AIPolicyVersion
}

func (m *CPUJob) SetAIPolicyVersion(value string) {

	m.AIPolicyVersion = value
}

func (m *CPUJob) GetCommandID() uuid.UUID {

	return m.CommandID
}

func (m *CPUJob) SetCommandID(value uuid.UUID) {

	m.CommandID = value
}

func (m *CPUJob) GetStatus() string {

	return m.Status
}

func (m *CPUJob) SetStatus(value string) {

	m.Status = value
}

func (m *CPUJob) GetDueTick() int64 {

	return m.DueTick
}

func (m *CPUJob) SetDueTick(value int64) {

	m.DueTick = value
}

func (m *CPUJob) GetContext() json.RawMessage {

	return append(json.RawMessage(nil), m.Context...)
}

func (m *CPUJob) SetContext(value json.RawMessage) {

	m.Context = append(json.RawMessage(nil), value...)
}

func (m *CPUJob) GetTrace() json.RawMessage {

	return append(json.RawMessage(nil), m.Trace...)
}

func (m *CPUJob) SetTrace(value json.RawMessage) {

	m.Trace = append(json.RawMessage(nil), value...)
}

func (m *CPUJob) GetCreatedAt() time.Time {

	return m.CreatedAt
}

func (m *CPUJob) SetCreatedAt(value time.Time) {

	m.CreatedAt = value
}

func (m *CPUJob) GetUpdatedAt() time.Time {

	return m.UpdatedAt
}

func (m *CPUJob) SetUpdatedAt(value time.Time) {

	m.UpdatedAt = value
}
