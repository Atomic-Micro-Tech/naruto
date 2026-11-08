package repo

import (
	"context"
	"database/sql"
	"github.com/google/uuid"
	"narutoserver/models"
)

type UserRepoImpl struct{ *repository }

var _ models.UserRepo = (*UserRepoImpl)(nil)

func NewUserRepo(ctx context.Context) (models.UserRepo, error) {

	r, err := newRepository(ctx)

	if err != nil {

		return nil, err
	}

	return &UserRepoImpl{r}, nil
}

func NewUserRepoTx(ctx context.Context, tx *sql.Tx) (models.UserRepo, error) {

	r, err := newRepositoryTx(ctx, tx)

	if err != nil {

		return nil, err
	}

	return &UserRepoImpl{r}, nil
}

func (r *UserRepoImpl) GetByID(id uuid.UUID) (*models.User, error) {

	return getRow[models.User](r.repository, "users", []string{"id"}, id)
}

func (r *UserRepoImpl) Create(value *models.User) error {

	return createRow(r.repository, "users", value, "")
}

func (r *UserRepoImpl) Update(value *models.User) error {

	return updateRow(r.repository, "users", value, []string{"id"}, "")
}
