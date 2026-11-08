package models

import (
	"encoding/json"
	"github.com/google/uuid"
	"time"
)

// MatchCommand maps naruto.match_commands. The database remains the source of constraints and defaults.
type MatchCommand struct {
	MatchID              uuid.UUID       `db:"match_id" json:"-"`
	CommandID            uuid.UUID       `db:"command_id" json:"-"`
	ActorSeat            int16           `db:"actor_seat" json:"-"`
	ActorUserID          uuid.UUID       `db:"actor_user_id" json:"-"`
	ControllerKind       string          `db:"controller_kind" json:"-"`
	ControlEpoch         int64           `db:"control_epoch" json:"-"`
	RequestHash          string          `db:"request_hash" json:"-"`
	ActionType           string          `db:"action_type" json:"-"`
	Payload              json.RawMessage `db:"payload" json:"-"`
	ExpectedStateVersion int64           `db:"expected_state_version" json:"-"`
	ReceivedAt           time.Time       `db:"received_at" json:"-"`
	AppliedTick          int64           `db:"applied_tick" json:"-"`
	Outcome              string          `db:"outcome" json:"-"`
	ResultStateVersion   int64           `db:"result_state_version" json:"-"`
	LastEventSequence    int64           `db:"last_event_sequence" json:"-"`
	ErrorCode            *string         `db:"error_code" json:"-"`
	Response             json.RawMessage `db:"response" json:"-"`
}

// MatchCommandRepo is the data-access contract for naruto.match_commands.
type MatchCommandRepo interface {
	GetByKey(matchID uuid.UUID, commandID uuid.UUID) (*MatchCommand, error)
	Create(value *MatchCommand) error
}

// NewMatchCommand constructs a row value for scanning or persistence.
func NewMatchCommand() *MatchCommand {

	return &MatchCommand{}
}

func (m *MatchCommand) GetMatchID() uuid.UUID {

	return m.MatchID
}

func (m *MatchCommand) SetMatchID(value uuid.UUID) {

	m.MatchID = value
}

func (m *MatchCommand) GetCommandID() uuid.UUID {

	return m.CommandID
}

func (m *MatchCommand) SetCommandID(value uuid.UUID) {

	m.CommandID = value
}

func (m *MatchCommand) GetActorSeat() int16 {

	return m.ActorSeat
}

func (m *MatchCommand) SetActorSeat(value int16) {

	m.ActorSeat = value
}

func (m *MatchCommand) GetActorUserID() uuid.UUID {

	return m.ActorUserID
}

func (m *MatchCommand) SetActorUserID(value uuid.UUID) {

	m.ActorUserID = value
}

func (m *MatchCommand) GetControllerKind() string {

	return m.ControllerKind
}

func (m *MatchCommand) SetControllerKind(value string) {

	m.ControllerKind = value
}

func (m *MatchCommand) GetControlEpoch() int64 {

	return m.ControlEpoch
}

func (m *MatchCommand) SetControlEpoch(value int64) {

	m.ControlEpoch = value
}

func (m *MatchCommand) GetRequestHash() string {

	return m.RequestHash
}

func (m *MatchCommand) SetRequestHash(value string) {

	m.RequestHash = value
}

func (m *MatchCommand) GetActionType() string {

	return m.ActionType
}

func (m *MatchCommand) SetActionType(value string) {

	m.ActionType = value
}

func (m *MatchCommand) GetPayload() json.RawMessage {

	return append(json.RawMessage(nil), m.Payload...)
}

func (m *MatchCommand) SetPayload(value json.RawMessage) {

	m.Payload = append(json.RawMessage(nil), value...)
}

func (m *MatchCommand) GetExpectedStateVersion() int64 {

	return m.ExpectedStateVersion
}

func (m *MatchCommand) SetExpectedStateVersion(value int64) {

	m.ExpectedStateVersion = value
}

func (m *MatchCommand) GetReceivedAt() time.Time {

	return m.ReceivedAt
}

func (m *MatchCommand) SetReceivedAt(value time.Time) {

	m.ReceivedAt = value
}

func (m *MatchCommand) GetAppliedTick() int64 {

	return m.AppliedTick
}

func (m *MatchCommand) SetAppliedTick(value int64) {

	m.AppliedTick = value
}

func (m *MatchCommand) GetOutcome() string {

	return m.Outcome
}

func (m *MatchCommand) SetOutcome(value string) {

	m.Outcome = value
}

func (m *MatchCommand) GetResultStateVersion() int64 {

	return m.ResultStateVersion
}

func (m *MatchCommand) SetResultStateVersion(value int64) {

	m.ResultStateVersion = value
}

func (m *MatchCommand) GetLastEventSequence() int64 {

	return m.LastEventSequence
}

func (m *MatchCommand) SetLastEventSequence(value int64) {

	m.LastEventSequence = value
}

func (m *MatchCommand) GetErrorCode() *string {

	return m.ErrorCode
}

func (m *MatchCommand) SetErrorCode(value *string) {

	m.ErrorCode = value
}

func (m *MatchCommand) GetResponse() json.RawMessage {

	return append(json.RawMessage(nil), m.Response...)
}

func (m *MatchCommand) SetResponse(value json.RawMessage) {

	m.Response = append(json.RawMessage(nil), value...)
}
