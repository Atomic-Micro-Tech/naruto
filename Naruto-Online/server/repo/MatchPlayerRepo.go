package repo

import (
	"context"
	"database/sql"
	"github.com/google/uuid"
	"narutoserver/models"
)

type MatchPlayerRepoImpl struct{ *repository }

var _ models.MatchPlayerRepo = (*MatchPlayerRepoImpl)(nil)

func NewMatchPlayerRepo(ctx context.Context) (models.MatchPlayerRepo, error) {

	r, err := newRepository(ctx)

	if err != nil {

		return nil, err
	}

	return &MatchPlayerRepoImpl{r}, nil
}

func NewMatchPlayerRepoTx(ctx context.Context, tx *sql.Tx) (models.MatchPlayerRepo, error) {

	r, err := newRepositoryTx(ctx, tx)

	if err != nil {

		return nil, err
	}

	return &MatchPlayerRepoImpl{r}, nil
}

func (r *MatchPlayerRepoImpl) GetByKey(matchID uuid.UUID, seat int16) (*models.MatchPlayer, error) {

	return getRow[models.MatchPlayer](r.repository, "match_players", []string{"match_id", "seat"}, matchID, seat)
}

func (r *MatchPlayerRepoImpl) Create(value *models.MatchPlayer) error {

	return createRow(r.repository, "match_players", value, "")
}

func (r *MatchPlayerRepoImpl) Update(value *models.MatchPlayer) error {

	return updateRow(r.repository, "match_players", value, []string{"match_id", "seat"}, "")
}
