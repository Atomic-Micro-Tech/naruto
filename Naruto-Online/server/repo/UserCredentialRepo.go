package repo

import (
	"context"
	"database/sql"
	"github.com/google/uuid"
	"narutoserver/models"
)

type UserCredentialRepoImpl struct{ *repository }

var _ models.UserCredentialRepo = (*UserCredentialRepoImpl)(nil)

func NewUserCredentialRepo(ctx context.Context) (models.UserCredentialRepo, error) {

	r, err := newRepository(ctx)

	if err != nil {

		return nil, err
	}

	return &UserCredentialRepoImpl{r}, nil
}

func NewUserCredentialRepoTx(ctx context.Context, tx *sql.Tx) (models.UserCredentialRepo, error) {

	r, err := newRepositoryTx(ctx, tx)

	if err != nil {

		return nil, err
	}

	return &UserCredentialRepoImpl{r}, nil
}

func (r *UserCredentialRepoImpl) GetByUserID(userID uuid.UUID) (*models.UserCredential, error) {

	return getRow[models.UserCredential](r.repository, "user_credentials", []string{"user_id"}, userID)
}

func (r *UserCredentialRepoImpl) Create(value *models.UserCredential) error {

	return createRow(r.repository, "user_credentials", value, "")
}

func (r *UserCredentialRepoImpl) Update(value *models.UserCredential) error {

	return updateRow(r.repository, "user_credentials", value, []string{"user_id"}, "")
}
