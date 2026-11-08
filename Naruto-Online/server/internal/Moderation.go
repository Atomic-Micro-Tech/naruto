package internal

import (
	"github.com/google/uuid"
	"time"
)

type RequestCreateReport struct {
	RoomID         uuid.UUID  `json:"roomId"`
	MatchID        *uuid.UUID `json:"matchId,omitempty"`
	TargetUserID   uuid.UUID  `json:"targetUserId"`
	MessageID      *uuid.UUID `json:"messageId,omitempty"`
	Category       string     `json:"category"`
	Description    string     `json:"description"`
	IdempotencyKey uuid.UUID  `json:"-"`
}

type ParamCreateReport struct {
	RoomID         uuid.UUID  `json:"roomId"`
	MatchID        *uuid.UUID `json:"matchId,omitempty"`
	TargetUserID   uuid.UUID  `json:"targetUserId"`
	MessageID      *uuid.UUID `json:"messageId,omitempty"`
	Category       string     `json:"category"`
	Description    string     `json:"description"`
	IdempotencyKey uuid.UUID  `json:"-"`
}

type DataCreateReport struct {
	ID        uuid.UUID `json:"id"`
	CreatedAt time.Time `json:"createdAt"`
}

type RequestBlockUser struct{ UserID uuid.UUID }
type ParamBlockUser struct{ UserID uuid.UUID }
type DataBlockUser struct{ BlockData }

type RequestUnblockUser struct{ UserID uuid.UUID }
type ParamUnblockUser struct{ UserID uuid.UUID }
type DataUnblockUser struct{}

type RequestListBlocks struct{ PageParam }
type ParamListBlocks struct{ PageParam }
type DataListBlocks struct {
	Items      []BlockData `json:"items"`
	NextCursor *string     `json:"nextCursor"`
}

type ModerationUseCase interface {
	CreateReport(param ParamCreateReport) (*DataCreateReport, error)
	BlockUser(param ParamBlockUser) (*DataBlockUser, error)
	UnblockUser(param ParamUnblockUser) (*DataUnblockUser, error)
	ListBlocks(param ParamListBlocks) (*DataListBlocks, error)
}
