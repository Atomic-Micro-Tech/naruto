package models

import (
	"github.com/google/uuid"
	"time"
)

// Room maps naruto.rooms. The database remains the source of constraints and defaults.
type Room struct {
	ID                   uuid.UUID  `db:"id" json:"-"`
	Name                 string     `db:"name" json:"-"`
	HostUserID           *uuid.UUID `db:"host_user_id" json:"-"`
	Visibility           string     `db:"visibility" json:"-"`
	Status               string     `db:"status" json:"-"`
	ArenaID              string     `db:"arena_id" json:"-"`
	Capacity             int16      `db:"capacity" json:"-"`
	TargetChakra         int32      `db:"target_chakra" json:"-"`
	Rule                 string     `db:"rule" json:"-"`
	VoiceEnabled         bool       `db:"voice_enabled" json:"-"`
	RoomVersion          int64      `db:"room_version" json:"-"`
	InviteCodeHash       []byte     `db:"invite_code_hash" json:"-"`
	InviteCodeCiphertext []byte     `db:"invite_code_ciphertext" json:"-"`
	InviteKeyID          *string    `db:"invite_key_id" json:"-"`
	InviteVersion        int64      `db:"invite_version" json:"-"`
	ActiveMatchID        *uuid.UUID `db:"active_match_id" json:"-"`
	CreatedAt            time.Time  `db:"created_at" json:"-"`
	UpdatedAt            time.Time  `db:"updated_at" json:"-"`
	ClosedAt             *time.Time `db:"closed_at" json:"-"`
}

// RoomRepo is the data-access contract for naruto.rooms.
type RoomRepo interface {
	GetByID(id uuid.UUID) (*Room, error)
	Create(value *Room) error
	Update(value *Room) error
	Search(query, status string, open bool, limit int, at *time.Time, id *uuid.UUID) ([]*Room, error)
	Lock(id uuid.UUID) (*Room, error)
	FindByInvite(hash []byte) (*Room, error)
	MemberExists(roomID, userID uuid.UUID) (bool, error)
	IncrementVersion(id uuid.UUID) error
	EnqueueChanged(roomID uuid.UUID, version int64) error
	RemoveMember(id, userID uuid.UUID) error
	ExpireWaiting() error
}

// NewRoom constructs a row value for scanning or persistence.
func NewRoom() *Room {

	return &Room{}
}

func (m *Room) GetID() uuid.UUID {

	return m.ID
}

func (m *Room) SetID(value uuid.UUID) {

	m.ID = value
}

func (m *Room) GetName() string {

	return m.Name
}

func (m *Room) SetName(value string) {

	m.Name = value
}

func (m *Room) GetHostUserID() *uuid.UUID {

	return m.HostUserID
}

func (m *Room) SetHostUserID(value *uuid.UUID) {

	m.HostUserID = value
}

func (m *Room) GetVisibility() string {

	return m.Visibility
}

func (m *Room) SetVisibility(value string) {

	m.Visibility = value
}

func (m *Room) GetStatus() string {

	return m.Status
}

func (m *Room) SetStatus(value string) {

	m.Status = value
}

func (m *Room) GetArenaID() string {

	return m.ArenaID
}

func (m *Room) SetArenaID(value string) {

	m.ArenaID = value
}

func (m *Room) GetCapacity() int16 {

	return m.Capacity
}

func (m *Room) SetCapacity(value int16) {

	m.Capacity = value
}

func (m *Room) GetTargetChakra() int32 {

	return m.TargetChakra
}

func (m *Room) SetTargetChakra(value int32) {

	m.TargetChakra = value
}

func (m *Room) GetRule() string {

	return m.Rule
}

func (m *Room) SetRule(value string) {

	m.Rule = value
}

func (m *Room) GetVoiceEnabled() bool {

	return m.VoiceEnabled
}

func (m *Room) SetVoiceEnabled(value bool) {

	m.VoiceEnabled = value
}

func (m *Room) GetRoomVersion() int64 {

	return m.RoomVersion
}

func (m *Room) SetRoomVersion(value int64) {

	m.RoomVersion = value
}

func (m *Room) GetInviteCodeHash() []byte {

	return append([]byte(nil), m.InviteCodeHash...)
}

func (m *Room) SetInviteCodeHash(value []byte) {

	m.InviteCodeHash = append([]byte(nil), value...)
}

func (m *Room) GetInviteCodeCiphertext() []byte {

	return append([]byte(nil), m.InviteCodeCiphertext...)
}

func (m *Room) SetInviteCodeCiphertext(value []byte) {

	m.InviteCodeCiphertext = append([]byte(nil), value...)
}

func (m *Room) GetInviteKeyID() *string {

	return m.InviteKeyID
}

func (m *Room) SetInviteKeyID(value *string) {

	m.InviteKeyID = value
}

func (m *Room) GetInviteVersion() int64 {

	return m.InviteVersion
}

func (m *Room) SetInviteVersion(value int64) {

	m.InviteVersion = value
}

func (m *Room) GetActiveMatchID() *uuid.UUID {

	return m.ActiveMatchID
}

func (m *Room) SetActiveMatchID(value *uuid.UUID) {

	m.ActiveMatchID = value
}

func (m *Room) GetCreatedAt() time.Time {

	return m.CreatedAt
}

func (m *Room) SetCreatedAt(value time.Time) {

	m.CreatedAt = value
}

func (m *Room) GetUpdatedAt() time.Time {

	return m.UpdatedAt
}

func (m *Room) SetUpdatedAt(value time.Time) {

	m.UpdatedAt = value
}

func (m *Room) GetClosedAt() *time.Time {

	return m.ClosedAt
}

func (m *Room) SetClosedAt(value *time.Time) {

	m.ClosedAt = value
}
