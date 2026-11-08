package repo

import (
	"context"
	"database/sql"
	"github.com/google/uuid"
	"narutoserver/models"
)

type EmailTokenRepoImpl struct{ *repository }

var _ models.EmailTokenRepo = (*EmailTokenRepoImpl)(nil)

func NewEmailTokenRepo(ctx context.Context) (models.EmailTokenRepo, error) {

	r, err := newRepository(ctx)

	if err != nil {

		return nil, err
	}

	return &EmailTokenRepoImpl{r}, nil
}

func NewEmailTokenRepoTx(ctx context.Context, tx *sql.Tx) (models.EmailTokenRepo, error) {

	r, err := newRepositoryTx(ctx, tx)

	if err != nil {

		return nil, err
	}

	return &EmailTokenRepoImpl{r}, nil
}

func (r *EmailTokenRepoImpl) GetByID(id uuid.UUID) (*models.EmailToken, error) {

	return getRow[models.EmailToken](r.repository, "email_tokens", []string{"id"}, id)
}

func (r *EmailTokenRepoImpl) Create(value *models.EmailToken) error {

	return createRow(r.repository, "email_tokens", value, "")
}

func (r *EmailTokenRepoImpl) Update(value *models.EmailToken) error {

	return updateRow(r.repository, "email_tokens", value, []string{"id"}, "")
}
