package models

import (
	"encoding/json"
	"github.com/google/uuid"
	"time"
)

// MatchPlayer maps naruto.match_players. The database remains the source of constraints and defaults.
type MatchPlayer struct {
	MatchID             uuid.UUID       `db:"match_id" json:"-"`
	Seat                int16           `db:"seat" json:"-"`
	ParticipantCount    int16           `db:"participant_count" json:"-"`
	UserID              uuid.UUID       `db:"user_id" json:"-"`
	DisplayNameSnapshot string          `db:"display_name_snapshot" json:"-"`
	CharacterID         int16           `db:"character_id" json:"-"`
	ParticipantKind     string          `db:"participant_kind" json:"-"`
	ControllerKind      string          `db:"controller_kind" json:"-"`
	ControlEpoch        int64           `db:"control_epoch" json:"-"`
	ConnectionStatus    string          `db:"connection_status" json:"-"`
	TakeoverReason      *string         `db:"takeover_reason" json:"-"`
	ControllerChangedAt time.Time       `db:"controller_changed_at" json:"-"`
	LastInputAt         *time.Time      `db:"last_input_at" json:"-"`
	ReclaimRequestedAt  *time.Time      `db:"reclaim_requested_at" json:"-"`
	PolicyState         json.RawMessage `db:"policy_state" json:"-"`
	DecisionSequence    int64           `db:"decision_sequence" json:"-"`
}

// MatchPlayerRepo is the data-access contract for naruto.match_players.
type MatchPlayerRepo interface {
	GetByKey(matchID uuid.UUID, seat int16) (*MatchPlayer, error)
	Create(value *MatchPlayer) error
	Update(value *MatchPlayer) error
	ByUser(matchID, userID uuid.UUID) (*MatchPlayer, error)
	List(matchID uuid.UUID) ([]*MatchPlayer, error)
}

// NewMatchPlayer constructs a row value for scanning or persistence.
func NewMatchPlayer() *MatchPlayer {

	return &MatchPlayer{}
}

func (m *MatchPlayer) GetMatchID() uuid.UUID {

	return m.MatchID
}

func (m *MatchPlayer) SetMatchID(value uuid.UUID) {

	m.MatchID = value
}

func (m *MatchPlayer) GetSeat() int16 {

	return m.Seat
}

func (m *MatchPlayer) SetSeat(value int16) {

	m.Seat = value
}

func (m *MatchPlayer) GetParticipantCount() int16 {

	return m.ParticipantCount
}

func (m *MatchPlayer) SetParticipantCount(value int16) {

	m.ParticipantCount = value
}

func (m *MatchPlayer) GetUserID() uuid.UUID {

	return m.UserID
}

func (m *MatchPlayer) SetUserID(value uuid.UUID) {

	m.UserID = value
}

func (m *MatchPlayer) GetDisplayNameSnapshot() string {

	return m.DisplayNameSnapshot
}

func (m *MatchPlayer) SetDisplayNameSnapshot(value string) {

	m.DisplayNameSnapshot = value
}

func (m *MatchPlayer) GetCharacterID() int16 {

	return m.CharacterID
}

func (m *MatchPlayer) SetCharacterID(value int16) {

	m.CharacterID = value
}

func (m *MatchPlayer) GetParticipantKind() string {

	return m.ParticipantKind
}

func (m *MatchPlayer) SetParticipantKind(value string) {

	m.ParticipantKind = value
}

func (m *MatchPlayer) GetControllerKind() string {

	return m.ControllerKind
}

func (m *MatchPlayer) SetControllerKind(value string) {

	m.ControllerKind = value
}

func (m *MatchPlayer) GetControlEpoch() int64 {

	return m.ControlEpoch
}

func (m *MatchPlayer) SetControlEpoch(value int64) {

	m.ControlEpoch = value
}

func (m *MatchPlayer) GetConnectionStatus() string {

	return m.ConnectionStatus
}

func (m *MatchPlayer) SetConnectionStatus(value string) {

	m.ConnectionStatus = value
}

func (m *MatchPlayer) GetTakeoverReason() *string {

	return m.TakeoverReason
}

func (m *MatchPlayer) SetTakeoverReason(value *string) {

	m.TakeoverReason = value
}

func (m *MatchPlayer) GetControllerChangedAt() time.Time {

	return m.ControllerChangedAt
}

func (m *MatchPlayer) SetControllerChangedAt(value time.Time) {

	m.ControllerChangedAt = value
}

func (m *MatchPlayer) GetLastInputAt() *time.Time {

	return m.LastInputAt
}

func (m *MatchPlayer) SetLastInputAt(value *time.Time) {

	m.LastInputAt = value
}

func (m *MatchPlayer) GetReclaimRequestedAt() *time.Time {

	return m.ReclaimRequestedAt
}

func (m *MatchPlayer) SetReclaimRequestedAt(value *time.Time) {

	m.ReclaimRequestedAt = value
}

func (m *MatchPlayer) GetPolicyState() json.RawMessage {

	return append(json.RawMessage(nil), m.PolicyState...)
}

func (m *MatchPlayer) SetPolicyState(value json.RawMessage) {

	m.PolicyState = append(json.RawMessage(nil), value...)
}

func (m *MatchPlayer) GetDecisionSequence() int64 {

	return m.DecisionSequence
}

func (m *MatchPlayer) SetDecisionSequence(value int64) {

	m.DecisionSequence = value
}
