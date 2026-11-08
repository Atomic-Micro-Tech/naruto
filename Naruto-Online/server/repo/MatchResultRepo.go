package repo

import (
	"context"
	"database/sql"
	"github.com/google/uuid"
	"narutoserver/models"
)

type MatchResultRepoImpl struct{ *repository }

var _ models.MatchResultRepo = (*MatchResultRepoImpl)(nil)

func NewMatchResultRepo(ctx context.Context) (models.MatchResultRepo, error) {

	r, err := newRepository(ctx)

	if err != nil {

		return nil, err
	}

	return &MatchResultRepoImpl{r}, nil
}

func NewMatchResultRepoTx(ctx context.Context, tx *sql.Tx) (models.MatchResultRepo, error) {

	r, err := newRepositoryTx(ctx, tx)

	if err != nil {

		return nil, err
	}

	return &MatchResultRepoImpl{r}, nil
}

func (r *MatchResultRepoImpl) GetByKey(matchID uuid.UUID, seat int16) (*models.MatchResult, error) {

	return getRow[models.MatchResult](r.repository, "match_results", []string{"match_id", "seat"}, matchID, seat)
}

func (r *MatchResultRepoImpl) Create(value *models.MatchResult) error {

	return createRow(r.repository, "match_results", value, "")
}
