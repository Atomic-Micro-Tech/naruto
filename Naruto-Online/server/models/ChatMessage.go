package models

import (
	"github.com/google/uuid"
	"time"
)

// ChatMessage maps naruto.chat_messages. The database remains the source of constraints and defaults.
type ChatMessage struct {
	ID                uuid.UUID  `db:"id" json:"-"`
	RoomID            uuid.UUID  `db:"room_id" json:"-"`
	SenderUserID      *uuid.UUID `db:"sender_user_id" json:"-"`
	SenderDisplayName *string    `db:"sender_display_name" json:"-"`
	Kind              string     `db:"kind" json:"-"`
	Body              string     `db:"body" json:"-"`
	ClientMessageID   *uuid.UUID `db:"client_message_id" json:"-"`
	RequestHash       *string    `db:"request_hash" json:"-"`
	CreatedAt         time.Time  `db:"created_at" json:"-"`
	HiddenAt          *time.Time `db:"hidden_at" json:"-"`
}

// ChatMessageRepo is the data-access contract for naruto.chat_messages.
type ChatMessageRepo interface {
	GetByID(id uuid.UUID) (*ChatMessage, error)
	Create(value *ChatMessage) error
	Update(value *ChatMessage) error
}

// NewChatMessage constructs a row value for scanning or persistence.
func NewChatMessage() *ChatMessage {

	return &ChatMessage{}
}

func (m *ChatMessage) GetID() uuid.UUID {

	return m.ID
}

func (m *ChatMessage) SetID(value uuid.UUID) {

	m.ID = value
}

func (m *ChatMessage) GetRoomID() uuid.UUID {

	return m.RoomID
}

func (m *ChatMessage) SetRoomID(value uuid.UUID) {

	m.RoomID = value
}

func (m *ChatMessage) GetSenderUserID() *uuid.UUID {

	return m.SenderUserID
}

func (m *ChatMessage) SetSenderUserID(value *uuid.UUID) {

	m.SenderUserID = value
}

func (m *ChatMessage) GetSenderDisplayName() *string {

	return m.SenderDisplayName
}

func (m *ChatMessage) SetSenderDisplayName(value *string) {

	m.SenderDisplayName = value
}

func (m *ChatMessage) GetKind() string {

	return m.Kind
}

func (m *ChatMessage) SetKind(value string) {

	m.Kind = value
}

func (m *ChatMessage) GetBody() string {

	return m.Body
}

func (m *ChatMessage) SetBody(value string) {

	m.Body = value
}

func (m *ChatMessage) GetClientMessageID() *uuid.UUID {

	return m.ClientMessageID
}

func (m *ChatMessage) SetClientMessageID(value *uuid.UUID) {

	m.ClientMessageID = value
}

func (m *ChatMessage) GetRequestHash() *string {

	return m.RequestHash
}

func (m *ChatMessage) SetRequestHash(value *string) {

	m.RequestHash = value
}

func (m *ChatMessage) GetCreatedAt() time.Time {

	return m.CreatedAt
}

func (m *ChatMessage) SetCreatedAt(value time.Time) {

	m.CreatedAt = value
}

func (m *ChatMessage) GetHiddenAt() *time.Time {

	return m.HiddenAt
}

func (m *ChatMessage) SetHiddenAt(value *time.Time) {

	m.HiddenAt = value
}
