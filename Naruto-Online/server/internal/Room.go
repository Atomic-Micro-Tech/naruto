package internal

import (
	"github.com/google/uuid"
)

type RequestListRooms struct {
	PageParam
	Q           string
	HasOpenSeat bool
	Status      string
}

type ParamListRooms struct {
	PageParam
	Q           string
	HasOpenSeat bool
	Status      string
}

type DataListRooms struct {
	Items      []RoomSummaryData `json:"items"`
	NextCursor *string           `json:"nextCursor"`
}

type RequestCreateRoom struct {
	Name           string             `json:"name"`
	Visibility     string             `json:"visibility"`
	Settings       *RoomSettingsInput `json:"settings"`
	IdempotencyKey uuid.UUID          `json:"-"`
}

type ParamCreateRoom struct {
	Name           string             `json:"name"`
	Visibility     string             `json:"visibility"`
	Settings       *RoomSettingsInput `json:"settings"`
	IdempotencyKey uuid.UUID          `json:"-"`
}

type DataCreateRoom struct{ MembershipData }

type RequestJoinRoomByCode struct {
	InviteCode     string    `json:"inviteCode"`
	IdempotencyKey uuid.UUID `json:"-"`
}

type ParamJoinRoomByCode struct {
	InviteCode     string    `json:"inviteCode"`
	IdempotencyKey uuid.UUID `json:"-"`
}

type DataJoinRoomByCode struct{ MembershipData }

type RequestGetRoom struct {
	RoomID uuid.UUID `json:"-"`
}

type ParamGetRoom struct {
	RoomID uuid.UUID `json:"-"`
}

type DataGetRoom struct{ RoomData }

type RequestJoinRoom struct {
	RoomID         uuid.UUID `json:"-"`
	InviteCode     string    `json:"inviteCode,omitempty"`
	IdempotencyKey uuid.UUID `json:"-"`
}

type ParamJoinRoom struct {
	RoomID         uuid.UUID `json:"-"`
	InviteCode     string    `json:"inviteCode,omitempty"`
	IdempotencyKey uuid.UUID `json:"-"`
}

type DataJoinRoom struct{ MembershipData }

type RoomUseCase interface {
	ListRooms(param ParamListRooms) (*DataListRooms, error)
	CreateRoom(param ParamCreateRoom) (*DataCreateRoom, error)
	JoinRoomByCode(param ParamJoinRoomByCode) (*DataJoinRoomByCode, error)
	GetRoom(param ParamGetRoom) (*DataGetRoom, error)
	JoinRoom(param ParamJoinRoom) (*DataJoinRoom, error)
}
