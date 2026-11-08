package models

import (
	"encoding/json"
	"github.com/google/uuid"
	"time"
)

// Match maps naruto.matches. The database remains the source of constraints and defaults.
type Match struct {
	ID                   uuid.UUID       `db:"id" json:"-"`
	RoomID               uuid.UUID       `db:"room_id" json:"-"`
	ArenaID              string          `db:"arena_id" json:"-"`
	Status               string          `db:"status" json:"-"`
	ParticipantCount     int16           `db:"participant_count" json:"-"`
	TargetChakra         int32           `db:"target_chakra" json:"-"`
	Rule                 string          `db:"rule" json:"-"`
	SettingsSnapshot     json.RawMessage `db:"settings_snapshot" json:"-"`
	RulesHash            string          `db:"rules_hash" json:"-"`
	AIRulesHash          string          `db:"ai_rules_hash" json:"-"`
	BoardDataHash        string          `db:"board_data_hash" json:"-"`
	AssetsHash           string          `db:"assets_hash" json:"-"`
	EngineVersion        string          `db:"engine_version" json:"-"`
	AIPolicyVersion      string          `db:"ai_policy_version" json:"-"`
	StateSchemaVersion   int32           `db:"state_schema_version" json:"-"`
	StateVersion         int64           `db:"state_version" json:"-"`
	LastEventSequence    int64           `db:"last_event_sequence" json:"-"`
	ServerTick           int64           `db:"server_tick" json:"-"`
	Phase                string          `db:"phase" json:"-"`
	TurnSeat             int16           `db:"turn_seat" json:"-"`
	RoundNumber          int32           `db:"round_number" json:"-"`
	InitialRNGSeed       int64           `db:"initial_rng_seed" json:"-"`
	RNGState             int64           `db:"rng_state" json:"-"`
	RNGDrawCount         int64           `db:"rng_draw_count" json:"-"`
	State                json.RawMessage `db:"state" json:"-"`
	StateHash            string          `db:"state_hash" json:"-"`
	DecisionDeadlineAt   *time.Time      `db:"decision_deadline_at" json:"-"`
	DecisionDeadlineTick *int64          `db:"decision_deadline_tick" json:"-"`
	ErrorTrace           json.RawMessage `db:"error_trace" json:"-"`
	ResultReason         *string         `db:"result_reason" json:"-"`
	WinnerSeat           *int16          `db:"winner_seat" json:"-"`
	ResultDescription    *string         `db:"result_description" json:"-"`
	CreatedAt            time.Time       `db:"created_at" json:"-"`
	StartedAt            time.Time       `db:"started_at" json:"-"`
	EndedAt              *time.Time      `db:"ended_at" json:"-"`
	UpdatedAt            time.Time       `db:"updated_at" json:"-"`
}

// MatchRepo is the data-access contract for naruto.matches.
type MatchRepo interface {
	ReadProjection(matchID, userID uuid.UUID) (*Match, []*MatchPlayer, error)
	GetByID(id uuid.UUID) (*Match, error)
	Create(value *Match) error
	Update(value *Match) error
	ForParticipant(matchID, userID uuid.UUID) (*Match, error)
}

// NewMatch constructs a row value for scanning or persistence.
func NewMatch() *Match {

	return &Match{}
}

func (m *Match) GetID() uuid.UUID {

	return m.ID
}

func (m *Match) SetID(value uuid.UUID) {

	m.ID = value
}

func (m *Match) GetRoomID() uuid.UUID {

	return m.RoomID
}

func (m *Match) SetRoomID(value uuid.UUID) {

	m.RoomID = value
}

func (m *Match) GetArenaID() string {

	return m.ArenaID
}

func (m *Match) SetArenaID(value string) {

	m.ArenaID = value
}

func (m *Match) GetStatus() string {

	return m.Status
}

func (m *Match) SetStatus(value string) {

	m.Status = value
}

func (m *Match) GetParticipantCount() int16 {

	return m.ParticipantCount
}

func (m *Match) SetParticipantCount(value int16) {

	m.ParticipantCount = value
}

func (m *Match) GetTargetChakra() int32 {

	return m.TargetChakra
}

func (m *Match) SetTargetChakra(value int32) {

	m.TargetChakra = value
}

func (m *Match) GetRule() string {

	return m.Rule
}

func (m *Match) SetRule(value string) {

	m.Rule = value
}

func (m *Match) GetSettingsSnapshot() json.RawMessage {

	return append(json.RawMessage(nil), m.SettingsSnapshot...)
}

func (m *Match) SetSettingsSnapshot(value json.RawMessage) {

	m.SettingsSnapshot = append(json.RawMessage(nil), value...)
}

func (m *Match) GetRulesHash() string {

	return m.RulesHash
}

func (m *Match) SetRulesHash(value string) {

	m.RulesHash = value
}

func (m *Match) GetAIRulesHash() string {

	return m.AIRulesHash
}

func (m *Match) SetAIRulesHash(value string) {

	m.AIRulesHash = value
}

func (m *Match) GetBoardDataHash() string {

	return m.BoardDataHash
}

func (m *Match) SetBoardDataHash(value string) {

	m.BoardDataHash = value
}

func (m *Match) GetAssetsHash() string {

	return m.AssetsHash
}

func (m *Match) SetAssetsHash(value string) {

	m.AssetsHash = value
}

func (m *Match) GetEngineVersion() string {

	return m.EngineVersion
}

func (m *Match) SetEngineVersion(value string) {

	m.EngineVersion = value
}

func (m *Match) GetAIPolicyVersion() string {

	return m.AIPolicyVersion
}

func (m *Match) SetAIPolicyVersion(value string) {

	m.AIPolicyVersion = value
}

func (m *Match) GetStateSchemaVersion() int32 {

	return m.StateSchemaVersion
}

func (m *Match) SetStateSchemaVersion(value int32) {

	m.StateSchemaVersion = value
}

func (m *Match) GetStateVersion() int64 {

	return m.StateVersion
}

func (m *Match) SetStateVersion(value int64) {

	m.StateVersion = value
}

func (m *Match) GetLastEventSequence() int64 {

	return m.LastEventSequence
}

func (m *Match) SetLastEventSequence(value int64) {

	m.LastEventSequence = value
}

func (m *Match) GetServerTick() int64 {

	return m.ServerTick
}

func (m *Match) SetServerTick(value int64) {

	m.ServerTick = value
}

func (m *Match) GetPhase() string {

	return m.Phase
}

func (m *Match) SetPhase(value string) {

	m.Phase = value
}

func (m *Match) GetTurnSeat() int16 {

	return m.TurnSeat
}

func (m *Match) SetTurnSeat(value int16) {

	m.TurnSeat = value
}

func (m *Match) GetRoundNumber() int32 {

	return m.RoundNumber
}

func (m *Match) SetRoundNumber(value int32) {

	m.RoundNumber = value
}

func (m *Match) GetInitialRNGSeed() int64 {

	return m.InitialRNGSeed
}

func (m *Match) SetInitialRNGSeed(value int64) {

	m.InitialRNGSeed = value
}

func (m *Match) GetRNGState() int64 {

	return m.RNGState
}

func (m *Match) SetRNGState(value int64) {

	m.RNGState = value
}

func (m *Match) GetRNGDrawCount() int64 {

	return m.RNGDrawCount
}

func (m *Match) SetRNGDrawCount(value int64) {

	m.RNGDrawCount = value
}

func (m *Match) GetState() json.RawMessage {

	return append(json.RawMessage(nil), m.State...)
}

func (m *Match) SetState(value json.RawMessage) {

	m.State = append(json.RawMessage(nil), value...)
}

func (m *Match) GetStateHash() string {

	return m.StateHash
}

func (m *Match) SetStateHash(value string) {

	m.StateHash = value
}

func (m *Match) GetDecisionDeadlineAt() *time.Time {

	return m.DecisionDeadlineAt
}

func (m *Match) SetDecisionDeadlineAt(value *time.Time) {

	m.DecisionDeadlineAt = value
}

func (m *Match) GetDecisionDeadlineTick() *int64 {

	return m.DecisionDeadlineTick
}

func (m *Match) SetDecisionDeadlineTick(value *int64) {

	m.DecisionDeadlineTick = value
}

func (m *Match) GetErrorTrace() json.RawMessage {

	return append(json.RawMessage(nil), m.ErrorTrace...)
}

func (m *Match) SetErrorTrace(value json.RawMessage) {

	m.ErrorTrace = append(json.RawMessage(nil), value...)
}

func (m *Match) GetResultReason() *string {

	return m.ResultReason
}

func (m *Match) SetResultReason(value *string) {

	m.ResultReason = value
}

func (m *Match) GetWinnerSeat() *int16 {

	return m.WinnerSeat
}

func (m *Match) SetWinnerSeat(value *int16) {

	m.WinnerSeat = value
}

func (m *Match) GetResultDescription() *string {

	return m.ResultDescription
}

func (m *Match) SetResultDescription(value *string) {

	m.ResultDescription = value
}

func (m *Match) GetCreatedAt() time.Time {

	return m.CreatedAt
}

func (m *Match) SetCreatedAt(value time.Time) {

	m.CreatedAt = value
}

func (m *Match) GetStartedAt() time.Time {

	return m.StartedAt
}

func (m *Match) SetStartedAt(value time.Time) {

	m.StartedAt = value
}

func (m *Match) GetEndedAt() *time.Time {

	return m.EndedAt
}

func (m *Match) SetEndedAt(value *time.Time) {

	m.EndedAt = value
}

func (m *Match) GetUpdatedAt() time.Time {

	return m.UpdatedAt
}

func (m *Match) SetUpdatedAt(value time.Time) {

	m.UpdatedAt = value
}
