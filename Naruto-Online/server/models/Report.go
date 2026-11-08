package models

import (
	"encoding/json"
	"github.com/google/uuid"
	"time"
)

// Report maps naruto.reports. The database remains the source of constraints and defaults.
type Report struct {
	ID             uuid.UUID       `db:"id" json:"-"`
	ReporterUserID uuid.UUID       `db:"reporter_user_id" json:"-"`
	TargetUserID   uuid.UUID       `db:"target_user_id" json:"-"`
	RoomID         uuid.UUID       `db:"room_id" json:"-"`
	MatchID        *uuid.UUID      `db:"match_id" json:"-"`
	MessageID      *uuid.UUID      `db:"message_id" json:"-"`
	Category       string          `db:"category" json:"-"`
	Description    string          `db:"description" json:"-"`
	Evidence       json.RawMessage `db:"evidence" json:"-"`
	Status         string          `db:"status" json:"-"`
	CreatedAt      time.Time       `db:"created_at" json:"-"`
	ResolvedAt     *time.Time      `db:"resolved_at" json:"-"`
	ResolutionNote *string         `db:"resolution_note" json:"-"`
}

// ReportRepo is the data-access contract for naruto.reports.
type ReportRepo interface {
	GetByID(id uuid.UUID) (*Report, error)
	Create(value *Report) error
	Update(value *Report) error
}

// NewReport constructs a row value for scanning or persistence.
func NewReport() *Report {

	return &Report{}
}

func (m *Report) GetID() uuid.UUID {

	return m.ID
}

func (m *Report) SetID(value uuid.UUID) {

	m.ID = value
}

func (m *Report) GetReporterUserID() uuid.UUID {

	return m.ReporterUserID
}

func (m *Report) SetReporterUserID(value uuid.UUID) {

	m.ReporterUserID = value
}

func (m *Report) GetTargetUserID() uuid.UUID {

	return m.TargetUserID
}

func (m *Report) SetTargetUserID(value uuid.UUID) {

	m.TargetUserID = value
}

func (m *Report) GetRoomID() uuid.UUID {

	return m.RoomID
}

func (m *Report) SetRoomID(value uuid.UUID) {

	m.RoomID = value
}

func (m *Report) GetMatchID() *uuid.UUID {

	return m.MatchID
}

func (m *Report) SetMatchID(value *uuid.UUID) {

	m.MatchID = value
}

func (m *Report) GetMessageID() *uuid.UUID {

	return m.MessageID
}

func (m *Report) SetMessageID(value *uuid.UUID) {

	m.MessageID = value
}

func (m *Report) GetCategory() string {

	return m.Category
}

func (m *Report) SetCategory(value string) {

	m.Category = value
}

func (m *Report) GetDescription() string {

	return m.Description
}

func (m *Report) SetDescription(value string) {

	m.Description = value
}

func (m *Report) GetEvidence() json.RawMessage {

	return append(json.RawMessage(nil), m.Evidence...)
}

func (m *Report) SetEvidence(value json.RawMessage) {

	m.Evidence = append(json.RawMessage(nil), value...)
}

func (m *Report) GetStatus() string {

	return m.Status
}

func (m *Report) SetStatus(value string) {

	m.Status = value
}

func (m *Report) GetCreatedAt() time.Time {

	return m.CreatedAt
}

func (m *Report) SetCreatedAt(value time.Time) {

	m.CreatedAt = value
}

func (m *Report) GetResolvedAt() *time.Time {

	return m.ResolvedAt
}

func (m *Report) SetResolvedAt(value *time.Time) {

	m.ResolvedAt = value
}

func (m *Report) GetResolutionNote() *string {

	return m.ResolutionNote
}

func (m *Report) SetResolutionNote(value *string) {

	m.ResolutionNote = value
}
