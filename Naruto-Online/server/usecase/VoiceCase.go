package usecase

import (
	"context"
	"github.com/google/uuid"
	"narutoserver/internal"
	"narutoserver/internal/auth"
	"narutoserver/internal/voice"
	"narutoserver/models"
	"narutoserver/repo"
	"time"
)

type VoiceCase struct{ ctx context.Context }

func NewVoiceUseCase(ctx context.Context) (internal.VoiceUseCase, error) {

	if ctx == nil {

		return nil, internal.Reject("INVALID_INPUT", "invalid context")
	}

	return &VoiceCase{ctx}, nil
}

func (u *VoiceCase) CreateVoiceToken(param internal.ParamCreateVoiceToken) (*internal.DataCreateVoiceToken, error) {

	p, err := internal.CurrentPrincipal(u.ctx)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	cfg, err := internal.GetConfig()

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	now := time.Now().UTC()

	expiry := now.Add(5 * time.Minute)

	if expiry.After(p.ExpiresAt) {

		expiry = p.ExpiresAt
	}

	id := uuid.New()

	token, err := voice.Sign(p.UserID.String(), param.RoomID.String(), id.String(), expiry, false)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	grants, err := repo.NewVoiceGrantRepo(u.ctx)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	row := models.NewVoiceGrant()

	row.ID = id
	row.RoomID = param.RoomID
	row.UserID = p.UserID
	row.SessionID = p.SessionID
	row.TokenJTIHash = auth.Digest(id.String())

	row.ProviderRoomName = param.RoomID.String()

	row.ProviderIdentity = p.UserID.String()

	row.IssuedAt = now
	row.ExpiresAt = expiry
	err = grants.Grant(row)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	return &internal.DataCreateVoiceToken{URL: cfg.Voice.URL, Token: token, ExpiresAt: expiry, RoomID: param.RoomID, Identity: p.UserID, CanPublishAudio: true, CanPublishVideo: false, CanSubscribe: true}, nil
}
