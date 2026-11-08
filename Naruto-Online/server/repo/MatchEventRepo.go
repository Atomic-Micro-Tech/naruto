package repo

import (
	"context"
	"database/sql"
	"github.com/google/uuid"
	"narutoserver/models"
)

type MatchEventRepoImpl struct{ *repository }

var _ models.MatchEventRepo = (*MatchEventRepoImpl)(nil)

func NewMatchEventRepo(ctx context.Context) (models.MatchEventRepo, error) {

	r, err := newRepository(ctx)

	if err != nil {

		return nil, err
	}

	return &MatchEventRepoImpl{r}, nil
}

func NewMatchEventRepoTx(ctx context.Context, tx *sql.Tx) (models.MatchEventRepo, error) {

	r, err := newRepositoryTx(ctx, tx)

	if err != nil {

		return nil, err
	}

	return &MatchEventRepoImpl{r}, nil
}

func (r *MatchEventRepoImpl) GetByKey(matchID uuid.UUID, sequence int64) (*models.MatchEvent, error) {

	return getRow[models.MatchEvent](r.repository, "match_events", []string{"match_id", "sequence"}, matchID, sequence)
}

func (r *MatchEventRepoImpl) Create(value *models.MatchEvent) error {

	return createRow(r.repository, "match_events", value, "")
}
