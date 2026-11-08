package repo

import (
	"context"
	"database/sql"
	"narutoserver/models"
)

type OutboxEventRepoImpl struct{ *repository }

var _ models.OutboxEventRepo = (*OutboxEventRepoImpl)(nil)

func NewOutboxEventRepo(ctx context.Context) (models.OutboxEventRepo, error) {

	r, err := newRepository(ctx)

	if err != nil {

		return nil, err
	}

	return &OutboxEventRepoImpl{r}, nil
}

func NewOutboxEventRepoTx(ctx context.Context, tx *sql.Tx) (models.OutboxEventRepo, error) {

	r, err := newRepositoryTx(ctx, tx)

	if err != nil {

		return nil, err
	}

	return &OutboxEventRepoImpl{r}, nil
}

func (r *OutboxEventRepoImpl) GetByID(id int64) (*models.OutboxEvent, error) {

	return getRow[models.OutboxEvent](r.repository, "outbox_events", []string{"id"}, id)
}

func (r *OutboxEventRepoImpl) Create(value *models.OutboxEvent) error {

	return createRow(r.repository, "outbox_events", value, "id")
}

func (r *OutboxEventRepoImpl) Update(value *models.OutboxEvent) error {

	return updateRow(r.repository, "outbox_events", value, []string{"id"}, "id")
}
