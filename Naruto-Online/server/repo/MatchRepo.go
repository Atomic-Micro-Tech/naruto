package repo

import (
	"context"
	"database/sql"
	"github.com/google/uuid"
	"narutoserver/models"
)

type MatchRepoImpl struct{ *repository }

var _ models.MatchRepo = (*MatchRepoImpl)(nil)

func NewMatchRepo(ctx context.Context) (models.MatchRepo, error) {

	r, err := newRepository(ctx)

	if err != nil {

		return nil, err
	}

	return &MatchRepoImpl{r}, nil
}

func NewMatchRepoTx(ctx context.Context, tx *sql.Tx) (models.MatchRepo, error) {

	r, err := newRepositoryTx(ctx, tx)

	if err != nil {

		return nil, err
	}

	return &MatchRepoImpl{r}, nil
}

func (r *MatchRepoImpl) GetByID(id uuid.UUID) (*models.Match, error) {

	return getRow[models.Match](r.repository, "matches", []string{"id"}, id)
}

func (r *MatchRepoImpl) Create(value *models.Match) error {

	return createRow(r.repository, "matches", value, "")
}

func (r *MatchRepoImpl) Update(value *models.Match) error {

	return updateRow(r.repository, "matches", value, []string{"id"}, "")
}
