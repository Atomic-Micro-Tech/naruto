package internal

import (
	"github.com/google/uuid"
)

type RequestListRoomMessages struct {
	RoomID uuid.UUID
	PageParam
}

type ParamListRoomMessages struct {
	RoomID uuid.UUID
	PageParam
}

type DataListRoomMessages struct {
	Items      []ChatMessageData `json:"items"`
	NextCursor *string           `json:"nextCursor"`
}

type ChatUseCase interface {
	ListRoomMessages(param ParamListRoomMessages) (*DataListRoomMessages, error)
}
