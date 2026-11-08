package repo

import (
	"context"
	"database/sql"
	"github.com/google/uuid"
	"narutoserver/models"
)

type MatchCommandRepoImpl struct{ *repository }

var _ models.MatchCommandRepo = (*MatchCommandRepoImpl)(nil)

func NewMatchCommandRepo(ctx context.Context) (models.MatchCommandRepo, error) {

	r, err := newRepository(ctx)

	if err != nil {

		return nil, err
	}

	return &MatchCommandRepoImpl{r}, nil
}

func NewMatchCommandRepoTx(ctx context.Context, tx *sql.Tx) (models.MatchCommandRepo, error) {

	r, err := newRepositoryTx(ctx, tx)

	if err != nil {

		return nil, err
	}

	return &MatchCommandRepoImpl{r}, nil
}

func (r *MatchCommandRepoImpl) GetByKey(matchID uuid.UUID, commandID uuid.UUID) (*models.MatchCommand, error) {

	return getRow[models.MatchCommand](r.repository, "match_commands", []string{"match_id", "command_id"}, matchID, commandID)
}

func (r *MatchCommandRepoImpl) Create(value *models.MatchCommand) error {

	return createRow(r.repository, "match_commands", value, "")
}
