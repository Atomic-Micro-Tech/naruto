package repo

import (
	"context"
	"database/sql"
	"github.com/google/uuid"
	"narutoserver/models"
)

type UserIdentityRepoImpl struct{ *repository }

var _ models.UserIdentityRepo = (*UserIdentityRepoImpl)(nil)

func NewUserIdentityRepo(ctx context.Context) (models.UserIdentityRepo, error) {

	r, err := newRepository(ctx)

	if err != nil {

		return nil, err
	}

	return &UserIdentityRepoImpl{r}, nil
}

func NewUserIdentityRepoTx(ctx context.Context, tx *sql.Tx) (models.UserIdentityRepo, error) {

	r, err := newRepositoryTx(ctx, tx)

	if err != nil {

		return nil, err
	}

	return &UserIdentityRepoImpl{r}, nil
}

func (r *UserIdentityRepoImpl) GetByID(id uuid.UUID) (*models.UserIdentity, error) {

	return getRow[models.UserIdentity](r.repository, "user_identities", []string{"id"}, id)
}

func (r *UserIdentityRepoImpl) Create(value *models.UserIdentity) error {

	return createRow(r.repository, "user_identities", value, "")
}
