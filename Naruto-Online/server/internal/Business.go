package internal

import (
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type Principal struct {
	UserID       uuid.UUID
	SessionID    uuid.UUID
	SessionEpoch int64
	ExpiresAt    time.Time
	CSRFToken    string
	TokenHash    []byte
}

type principalKey struct{}

func WithPrincipal(ctx context.Context, principal Principal) context.Context {

	return context.WithValue(ctx, principalKey{}, principal)
}

func CurrentPrincipal(ctx context.Context) (Principal, error) {

	principal, ok := ctx.Value(principalKey{}).(Principal)

	if !ok {

		return Principal{}, Reject("UNAUTHENTICATED", "login required")
	}

	return principal, nil
}

type UserData struct {
	ID            uuid.UUID `json:"id"`
	Email         string    `json:"email"`
	DisplayName   string    `json:"displayName"`
	EmailVerified bool      `json:"emailVerified"`
	CreatedAt     time.Time `json:"createdAt"`
}

type PlayerIdentity struct {
	UserID      uuid.UUID `json:"userId"`
	DisplayName string    `json:"displayName"`
}

type SessionData struct {
	User      UserData  `json:"user"`
	ExpiresAt time.Time `json:"expiresAt"`
	CSRFToken string    `json:"csrfToken"`
}

type RoomSettings struct {
	ArenaID      string `json:"arenaId"`
	Capacity     int16  `json:"capacity"`
	TargetChakra int32  `json:"targetChakra"`
	Rule         string `json:"rule"`
	VoiceEnabled bool   `json:"voiceEnabled"`
}

type RoomSettingsInput struct {
	ArenaID      string `json:"arenaId"`
	Capacity     *int16 `json:"capacity"`
	TargetChakra *int32 `json:"targetChakra"`
	Rule         string `json:"rule"`
	VoiceEnabled *bool  `json:"voiceEnabled"`
}

type RoomMemberData struct {
	UserID           uuid.UUID `json:"userId"`
	DisplayName      string    `json:"displayName"`
	Seat             int16     `json:"seat"`
	CharacterID      int16     `json:"characterId"`
	Ready            bool      `json:"ready"`
	AssetsReady      bool      `json:"assetsReady"`
	ConnectionStatus string    `json:"connectionStatus"`
	JoinedAt         time.Time `json:"joinedAt"`
}

type RoomData struct {
	ID            uuid.UUID        `json:"id"`
	Name          string           `json:"name"`
	HostUserID    uuid.UUID        `json:"hostUserId"`
	Visibility    string           `json:"visibility"`
	Status        string           `json:"status"`
	Settings      RoomSettings     `json:"settings"`
	RoomVersion   int64            `json:"roomVersion"`
	Members       []RoomMemberData `json:"members"`
	ActiveMatchID *uuid.UUID       `json:"activeMatchId"`
	CreatedAt     time.Time        `json:"createdAt"`
}

type RoomSummaryData struct {
	ID          uuid.UUID      `json:"id"`
	Name        string         `json:"name"`
	Host        PlayerIdentity `json:"host"`
	Visibility  string         `json:"visibility"`
	Status      string         `json:"status"`
	Settings    RoomSettings   `json:"settings"`
	MemberCount int            `json:"memberCount"`
	RoomVersion int64          `json:"roomVersion"`
	CanJoin     bool           `json:"canJoin"`
	CreatedAt   time.Time      `json:"createdAt"`
}

type MembershipData struct {
	Room       RoomData `json:"room"`
	SelfSeat   int16    `json:"selfSeat"`
	InviteCode *string  `json:"inviteCode"`
}

type Cursor struct {
	Scope     string    `json:"scope"`
	CreatedAt time.Time `json:"at"`
	ID        uuid.UUID `json:"id"`
}

type PageParam struct {
	Scope  string
	Limit  int
	Cursor *Cursor
}

type ChatMessageData struct {
	ID              uuid.UUID       `json:"id"`
	RoomID          uuid.UUID       `json:"roomId"`
	Sender          *PlayerIdentity `json:"sender"`
	Kind            string          `json:"kind"`
	Text            string          `json:"text"`
	CreatedAt       time.Time       `json:"createdAt"`
	ClientMessageID *uuid.UUID      `json:"clientMessageId"`
}

type BlockData struct {
	TargetUserID uuid.UUID `json:"targetUserId"`
	CreatedAt    time.Time `json:"createdAt"`
}

type ArenaData struct {
	ID                string `json:"id"`
	MapID             int16  `json:"mapId"`
	Name              string `json:"name"`
	Enabled           bool   `json:"enabled"`
	TileCount         int16  `json:"tileCount"`
	WorldWidth        int32  `json:"worldWidth"`
	WorldHeight       int32  `json:"worldHeight"`
	ThumbnailPath     string `json:"thumbnailPath"`
	RulesHash         string `json:"rulesHash"`
	AssetManifestHash string `json:"assetManifestHash"`
}

type WSMessage struct {
	ProtocolVersion int             `json:"protocolVersion"`
	RequestID       uuid.UUID       `json:"requestId"`
	Type            string          `json:"type"`
	Payload         json.RawMessage `json:"payload"`
}
