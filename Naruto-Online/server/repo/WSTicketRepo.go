package repo

import (
	"context"
	"database/sql"
	"github.com/google/uuid"
	"narutoserver/models"
)

type WSTicketRepoImpl struct{ *repository }

var _ models.WSTicketRepo = (*WSTicketRepoImpl)(nil)

func NewWSTicketRepo(ctx context.Context) (models.WSTicketRepo, error) {

	r, err := newRepository(ctx)

	if err != nil {

		return nil, err
	}

	return &WSTicketRepoImpl{r}, nil
}

func NewWSTicketRepoTx(ctx context.Context, tx *sql.Tx) (models.WSTicketRepo, error) {

	r, err := newRepositoryTx(ctx, tx)

	if err != nil {

		return nil, err
	}

	return &WSTicketRepoImpl{r}, nil
}

func (r *WSTicketRepoImpl) GetByID(id uuid.UUID) (*models.WSTicket, error) {

	return getRow[models.WSTicket](r.repository, "ws_tickets", []string{"id"}, id)
}

func (r *WSTicketRepoImpl) Create(value *models.WSTicket) error {

	return createRow(r.repository, "ws_tickets", value, "")
}

func (r *WSTicketRepoImpl) Update(value *models.WSTicket) error {

	return updateRow(r.repository, "ws_tickets", value, []string{"id"}, "")
}
