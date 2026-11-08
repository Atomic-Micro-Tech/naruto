package models

import (
	"encoding/json"
	"github.com/google/uuid"
	"time"
)

// OutboxEvent maps naruto.outbox_events. The database remains the source of constraints and defaults.
type OutboxEvent struct {
	ID               int64           `db:"id" json:"-"`
	Topic            string          `db:"topic" json:"-"`
	AggregateID      uuid.UUID       `db:"aggregate_id" json:"-"`
	DeduplicationKey string          `db:"deduplication_key" json:"-"`
	Payload          json.RawMessage `db:"payload" json:"-"`
	CreatedAt        time.Time       `db:"created_at" json:"-"`
	AvailableAt      time.Time       `db:"available_at" json:"-"`
	Attempts         int32           `db:"attempts" json:"-"`
	DeliveredAt      *time.Time      `db:"delivered_at" json:"-"`
	LastError        *string         `db:"last_error" json:"-"`
}

// OutboxEventRepo is the data-access contract for naruto.outbox_events.
type OutboxEventRepo interface {
	GetByID(id int64) (*OutboxEvent, error)
	Create(value *OutboxEvent) error
	Update(value *OutboxEvent) error
	Deliver(id int64, send func(*OutboxEvent) error) (bool, error)
}

// NewOutboxEvent constructs a row value for scanning or persistence.
func NewOutboxEvent() *OutboxEvent {

	return &OutboxEvent{}
}

func (m *OutboxEvent) GetID() int64 {

	return m.ID
}

func (m *OutboxEvent) SetID(value int64) {

	m.ID = value
}

func (m *OutboxEvent) GetTopic() string {

	return m.Topic
}

func (m *OutboxEvent) SetTopic(value string) {

	m.Topic = value
}

func (m *OutboxEvent) GetAggregateID() uuid.UUID {

	return m.AggregateID
}

func (m *OutboxEvent) SetAggregateID(value uuid.UUID) {

	m.AggregateID = value
}

func (m *OutboxEvent) GetDeduplicationKey() string {

	return m.DeduplicationKey
}

func (m *OutboxEvent) SetDeduplicationKey(value string) {

	m.DeduplicationKey = value
}

func (m *OutboxEvent) GetPayload() json.RawMessage {

	return append(json.RawMessage(nil), m.Payload...)
}

func (m *OutboxEvent) SetPayload(value json.RawMessage) {

	m.Payload = append(json.RawMessage(nil), value...)
}

func (m *OutboxEvent) GetCreatedAt() time.Time {

	return m.CreatedAt
}

func (m *OutboxEvent) SetCreatedAt(value time.Time) {

	m.CreatedAt = value
}

func (m *OutboxEvent) GetAvailableAt() time.Time {

	return m.AvailableAt
}

func (m *OutboxEvent) SetAvailableAt(value time.Time) {

	m.AvailableAt = value
}

func (m *OutboxEvent) GetAttempts() int32 {

	return m.Attempts
}

func (m *OutboxEvent) SetAttempts(value int32) {

	m.Attempts = value
}

func (m *OutboxEvent) GetDeliveredAt() *time.Time {

	return m.DeliveredAt
}

func (m *OutboxEvent) SetDeliveredAt(value *time.Time) {

	m.DeliveredAt = value
}

func (m *OutboxEvent) GetLastError() *string {

	return m.LastError
}

func (m *OutboxEvent) SetLastError(value *string) {

	m.LastError = value
}
