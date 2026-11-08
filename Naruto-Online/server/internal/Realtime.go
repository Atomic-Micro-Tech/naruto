package internal

import (
	"github.com/google/uuid"
	"time"
)

type RequestCreateWebSocketTicket struct{ Origin string }
type ParamCreateWebSocketTicket struct{ Origin string }
type DataCreateWebSocketTicket struct {
	Ticket    string    `json:"ticket"`
	ExpiresAt time.Time `json:"expiresAt"`
	Path      string    `json:"path"`
	Protocol  string    `json:"protocol"`
}

type RequestUpgradeWebSocket struct {
	Ticket string
	Origin string
}

type ParamUpgradeWebSocket struct {
	Ticket string
	Origin string
}

type DataUpgradeWebSocket struct {
	Principal    Principal `json:"-"`
	ConnectionID uuid.UUID `json:"-"`
}

type RealtimeUseCase interface {
	ExecuteLobby(param ParamLobbyCommand) (*DataLobbyCommand, error)
	CreateWebSocketTicket(param ParamCreateWebSocketTicket) (*DataCreateWebSocketTicket, error)
	UpgradeWebSocket(param ParamUpgradeWebSocket) (*DataUpgradeWebSocket, error)
}

// Lobby commands use the same authenticated session and persistent request receipts.
type ParamLobbyCommand struct {
	ConnectionID        uuid.UUID
	RequestID           uuid.UUID
	Type                string
	RoomID              uuid.UUID
	ExpectedRoomVersion int64
	Name                string
	Settings            *RoomSettingsInput
	Ready               bool
	CharacterID         int16
	AssetsReady         bool
	AssetManifestHash   string
	TargetUserID        uuid.UUID
	ClientMessageID     uuid.UUID
	Text                string
}

type DataLobbyCommand struct {
	InviteCode  *string   `json:"-"`
	RequestID   uuid.UUID `json:"requestId"`
	RoomVersion int64     `json:"roomVersion"`
	Duplicate   bool      `json:"duplicate"`
	Outcome     string    `json:"outcome"`
}
