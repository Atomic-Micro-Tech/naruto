package repo

import (
	"context"
	"database/sql"
	"github.com/google/uuid"
	"narutoserver/models"
)

type MatchSnapshotRepoImpl struct{ *repository }

var _ models.MatchSnapshotRepo = (*MatchSnapshotRepoImpl)(nil)

func NewMatchSnapshotRepo(ctx context.Context) (models.MatchSnapshotRepo, error) {

	r, err := newRepository(ctx)

	if err != nil {

		return nil, err
	}

	return &MatchSnapshotRepoImpl{r}, nil
}

func NewMatchSnapshotRepoTx(ctx context.Context, tx *sql.Tx) (models.MatchSnapshotRepo, error) {

	r, err := newRepositoryTx(ctx, tx)

	if err != nil {

		return nil, err
	}

	return &MatchSnapshotRepoImpl{r}, nil
}

func (r *MatchSnapshotRepoImpl) GetByKey(matchID uuid.UUID, stateVersion int64) (*models.MatchSnapshot, error) {

	return getRow[models.MatchSnapshot](r.repository, "match_snapshots", []string{"match_id", "state_version"}, matchID, stateVersion)
}

func (r *MatchSnapshotRepoImpl) Create(value *models.MatchSnapshot) error {

	return createRow(r.repository, "match_snapshots", value, "")
}
