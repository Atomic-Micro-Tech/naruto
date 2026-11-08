package repo

import (
	"context"
	"database/sql"
	"github.com/google/uuid"
	"narutoserver/models"
)

type VoiceGrantRepoImpl struct{ *repository }

var _ models.VoiceGrantRepo = (*VoiceGrantRepoImpl)(nil)

func NewVoiceGrantRepo(ctx context.Context) (models.VoiceGrantRepo, error) {

	r, err := newRepository(ctx)

	if err != nil {

		return nil, err
	}

	return &VoiceGrantRepoImpl{r}, nil
}

func NewVoiceGrantRepoTx(ctx context.Context, tx *sql.Tx) (models.VoiceGrantRepo, error) {

	r, err := newRepositoryTx(ctx, tx)

	if err != nil {

		return nil, err
	}

	return &VoiceGrantRepoImpl{r}, nil
}

func (r *VoiceGrantRepoImpl) GetByID(id uuid.UUID) (*models.VoiceGrant, error) {

	return getRow[models.VoiceGrant](r.repository, "voice_grants", []string{"id"}, id)
}

func (r *VoiceGrantRepoImpl) Create(value *models.VoiceGrant) error {

	return createRow(r.repository, "voice_grants", value, "")
}

func (r *VoiceGrantRepoImpl) Update(value *models.VoiceGrant) error {

	return updateRow(r.repository, "voice_grants", value, []string{"id"}, "")
}
