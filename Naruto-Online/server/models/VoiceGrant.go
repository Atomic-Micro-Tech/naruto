package models

import (
	"github.com/google/uuid"
	"time"
)

// VoiceGrant maps naruto.voice_grants. The database remains the source of constraints and defaults.
type VoiceGrant struct {
	ID               uuid.UUID  `db:"id" json:"-"`
	RoomID           uuid.UUID  `db:"room_id" json:"-"`
	UserID           uuid.UUID  `db:"user_id" json:"-"`
	SessionID        uuid.UUID  `db:"session_id" json:"-"`
	TokenJTIHash     []byte     `db:"token_jti_hash" json:"-"`
	ProviderRoomName string     `db:"provider_room_name" json:"-"`
	ProviderIdentity string     `db:"provider_identity" json:"-"`
	IssuedAt         time.Time  `db:"issued_at" json:"-"`
	ExpiresAt        time.Time  `db:"expires_at" json:"-"`
	RevokedAt        *time.Time `db:"revoked_at" json:"-"`
	RevokeReason     *string    `db:"revoke_reason" json:"-"`
}

// VoiceGrantRepo is the data-access contract for naruto.voice_grants.
type VoiceGrantRepo interface {
	GetByID(id uuid.UUID) (*VoiceGrant, error)
	Create(value *VoiceGrant) error
	Update(value *VoiceGrant) error
}

// NewVoiceGrant constructs a row value for scanning or persistence.
func NewVoiceGrant() *VoiceGrant {

	return &VoiceGrant{}
}

func (m *VoiceGrant) GetID() uuid.UUID {

	return m.ID
}

func (m *VoiceGrant) SetID(value uuid.UUID) {

	m.ID = value
}

func (m *VoiceGrant) GetRoomID() uuid.UUID {

	return m.RoomID
}

func (m *VoiceGrant) SetRoomID(value uuid.UUID) {

	m.RoomID = value
}

func (m *VoiceGrant) GetUserID() uuid.UUID {

	return m.UserID
}

func (m *VoiceGrant) SetUserID(value uuid.UUID) {

	m.UserID = value
}

func (m *VoiceGrant) GetSessionID() uuid.UUID {

	return m.SessionID
}

func (m *VoiceGrant) SetSessionID(value uuid.UUID) {

	m.SessionID = value
}

func (m *VoiceGrant) GetTokenJTIHash() []byte {

	return append([]byte(nil), m.TokenJTIHash...)
}

func (m *VoiceGrant) SetTokenJTIHash(value []byte) {

	m.TokenJTIHash = append([]byte(nil), value...)
}

func (m *VoiceGrant) GetProviderRoomName() string {

	return m.ProviderRoomName
}

func (m *VoiceGrant) SetProviderRoomName(value string) {

	m.ProviderRoomName = value
}

func (m *VoiceGrant) GetProviderIdentity() string {

	return m.ProviderIdentity
}

func (m *VoiceGrant) SetProviderIdentity(value string) {

	m.ProviderIdentity = value
}

func (m *VoiceGrant) GetIssuedAt() time.Time {

	return m.IssuedAt
}

func (m *VoiceGrant) SetIssuedAt(value time.Time) {

	m.IssuedAt = value
}

func (m *VoiceGrant) GetExpiresAt() time.Time {

	return m.ExpiresAt
}

func (m *VoiceGrant) SetExpiresAt(value time.Time) {

	m.ExpiresAt = value
}

func (m *VoiceGrant) GetRevokedAt() *time.Time {

	return m.RevokedAt
}

func (m *VoiceGrant) SetRevokedAt(value *time.Time) {

	m.RevokedAt = value
}

func (m *VoiceGrant) GetRevokeReason() *string {

	return m.RevokeReason
}

func (m *VoiceGrant) SetRevokeReason(value *string) {

	m.RevokeReason = value
}
