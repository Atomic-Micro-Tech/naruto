package repo

import (
	"context"
	"database/sql"
	"github.com/google/uuid"
	"narutoserver/models"
)

type RequestReceiptRepoImpl struct{ *repository }

var _ models.RequestReceiptRepo = (*RequestReceiptRepoImpl)(nil)

func NewRequestReceiptRepo(ctx context.Context) (models.RequestReceiptRepo, error) {

	r, err := newRepository(ctx)

	if err != nil {

		return nil, err
	}

	return &RequestReceiptRepoImpl{r}, nil
}

func NewRequestReceiptRepoTx(ctx context.Context, tx *sql.Tx) (models.RequestReceiptRepo, error) {

	r, err := newRepositoryTx(ctx, tx)

	if err != nil {

		return nil, err
	}

	return &RequestReceiptRepoImpl{r}, nil
}

func (r *RequestReceiptRepoImpl) GetByKey(userID uuid.UUID, transport string, operation string, requestID uuid.UUID) (*models.RequestReceipt, error) {

	return getRow[models.RequestReceipt](r.repository, "request_receipts", []string{"user_id", "transport", "operation", "request_id"}, userID, transport, operation, requestID)
}

func (r *RequestReceiptRepoImpl) Create(value *models.RequestReceipt) error {

	return createRow(r.repository, "request_receipts", value, "")
}
