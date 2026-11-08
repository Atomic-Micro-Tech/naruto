package internal

import (
	"github.com/google/uuid"
	"time"
)

type RequestCreateVoiceToken struct{ RoomID uuid.UUID }
type ParamCreateVoiceToken struct{ RoomID uuid.UUID }
type DataCreateVoiceToken struct {
	URL             string    `json:"url"`
	Token           string    `json:"token"`
	ExpiresAt       time.Time `json:"expiresAt"`
	RoomID          uuid.UUID `json:"roomId"`
	Identity        uuid.UUID `json:"identity"`
	CanPublishAudio bool      `json:"canPublishAudio"`
	CanPublishVideo bool      `json:"canPublishVideo"`
	CanSubscribe    bool      `json:"canSubscribe"`
}

type VoiceUseCase interface {
	CreateVoiceToken(param ParamCreateVoiceToken) (*DataCreateVoiceToken, error)
}
