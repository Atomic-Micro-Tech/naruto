package repo

import (
	"context"
	"database/sql"
	"github.com/google/uuid"
	"narutoserver/models"
)

type RealtimeConnectionRepoImpl struct{ *repository }

var _ models.RealtimeConnectionRepo = (*RealtimeConnectionRepoImpl)(nil)

func NewRealtimeConnectionRepo(ctx context.Context) (models.RealtimeConnectionRepo, error) {

	r, err := newRepository(ctx)

	if err != nil {

		return nil, err
	}

	return &RealtimeConnectionRepoImpl{r}, nil
}

func NewRealtimeConnectionRepoTx(ctx context.Context, tx *sql.Tx) (models.RealtimeConnectionRepo, error) {

	r, err := newRepositoryTx(ctx, tx)

	if err != nil {

		return nil, err
	}

	return &RealtimeConnectionRepoImpl{r}, nil
}

func (r *RealtimeConnectionRepoImpl) GetByID(id uuid.UUID) (*models.RealtimeConnection, error) {

	return getRow[models.RealtimeConnection](r.repository, "realtime_connections", []string{"id"}, id)
}

func (r *RealtimeConnectionRepoImpl) Create(value *models.RealtimeConnection) error {

	return createRow(r.repository, "realtime_connections", value, "")
}

func (r *RealtimeConnectionRepoImpl) Update(value *models.RealtimeConnection) error {

	return updateRow(r.repository, "realtime_connections", value, []string{"id"}, "")
}
