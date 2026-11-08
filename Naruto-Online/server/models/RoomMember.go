package models

import (
	"github.com/google/uuid"
	"time"
)

// RoomMember maps naruto.room_members. The database remains the source of constraints and defaults.
type RoomMember struct {
	RoomID              uuid.UUID  `db:"room_id" json:"-"`
	UserID              uuid.UUID  `db:"user_id" json:"-"`
	RoomCapacity        int16      `db:"room_capacity" json:"-"`
	Seat                int16      `db:"seat" json:"-"`
	CharacterID         int16      `db:"character_id" json:"-"`
	Ready               bool       `db:"ready" json:"-"`
	AssetsReady         bool       `db:"assets_ready" json:"-"`
	AssetManifestHash   *string    `db:"asset_manifest_hash" json:"-"`
	ConnectionStatus    string     `db:"connection_status" json:"-"`
	JoinedAt            time.Time  `db:"joined_at" json:"-"`
	JoinOrder           int64      `db:"join_order" json:"-"`
	ReconnectDeadlineAt *time.Time `db:"reconnect_deadline_at" json:"-"`
}

// RoomMemberRepo is the data-access contract for naruto.room_members.
type RoomMemberRepo interface {
	GetByKey(roomID uuid.UUID, userID uuid.UUID) (*RoomMember, error)
	Create(value *RoomMember) error
	Update(value *RoomMember) error
	DeleteByKey(roomID uuid.UUID, userID uuid.UUID) error
	List(roomID uuid.UUID) ([]*RoomMember, error)
	Current(userID uuid.UUID) (*RoomMember, error)
	Add(roomID, userID uuid.UUID, capacity, seat int16) error
	ResetReady(id uuid.UUID) error
}

// NewRoomMember constructs a row value for scanning or persistence.
func NewRoomMember() *RoomMember {

	return &RoomMember{}
}

func (m *RoomMember) GetRoomID() uuid.UUID {

	return m.RoomID
}

func (m *RoomMember) SetRoomID(value uuid.UUID) {

	m.RoomID = value
}

func (m *RoomMember) GetUserID() uuid.UUID {

	return m.UserID
}

func (m *RoomMember) SetUserID(value uuid.UUID) {

	m.UserID = value
}

func (m *RoomMember) GetRoomCapacity() int16 {

	return m.RoomCapacity
}

func (m *RoomMember) SetRoomCapacity(value int16) {

	m.RoomCapacity = value
}

func (m *RoomMember) GetSeat() int16 {

	return m.Seat
}

func (m *RoomMember) SetSeat(value int16) {

	m.Seat = value
}

func (m *RoomMember) GetCharacterID() int16 {

	return m.CharacterID
}

func (m *RoomMember) SetCharacterID(value int16) {

	m.CharacterID = value
}

func (m *RoomMember) GetReady() bool {

	return m.Ready
}

func (m *RoomMember) SetReady(value bool) {

	m.Ready = value
}

func (m *RoomMember) GetAssetsReady() bool {

	return m.AssetsReady
}

func (m *RoomMember) SetAssetsReady(value bool) {

	m.AssetsReady = value
}

func (m *RoomMember) GetAssetManifestHash() *string {

	return m.AssetManifestHash
}

func (m *RoomMember) SetAssetManifestHash(value *string) {

	m.AssetManifestHash = value
}

func (m *RoomMember) GetConnectionStatus() string {

	return m.ConnectionStatus
}

func (m *RoomMember) SetConnectionStatus(value string) {

	m.ConnectionStatus = value
}

func (m *RoomMember) GetJoinedAt() time.Time {

	return m.JoinedAt
}

func (m *RoomMember) SetJoinedAt(value time.Time) {

	m.JoinedAt = value
}

func (m *RoomMember) GetJoinOrder() int64 {

	return m.JoinOrder
}

func (m *RoomMember) SetJoinOrder(value int64) {

	m.JoinOrder = value
}

func (m *RoomMember) GetReconnectDeadlineAt() *time.Time {

	return m.ReconnectDeadlineAt
}

func (m *RoomMember) SetReconnectDeadlineAt(value *time.Time) {

	m.ReconnectDeadlineAt = value
}
