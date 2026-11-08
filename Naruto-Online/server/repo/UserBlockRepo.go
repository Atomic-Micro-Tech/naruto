package repo

import (
	"context"
	"database/sql"
	"github.com/google/uuid"
	"narutoserver/models"
)

type UserBlockRepoImpl struct{ *repository }

var _ models.UserBlockRepo = (*UserBlockRepoImpl)(nil)

func NewUserBlockRepo(ctx context.Context) (models.UserBlockRepo, error) {

	r, err := newRepository(ctx)

	if err != nil {

		return nil, err
	}

	return &UserBlockRepoImpl{r}, nil
}

func NewUserBlockRepoTx(ctx context.Context, tx *sql.Tx) (models.UserBlockRepo, error) {

	r, err := newRepositoryTx(ctx, tx)

	if err != nil {

		return nil, err
	}

	return &UserBlockRepoImpl{r}, nil
}

func (r *UserBlockRepoImpl) GetByKey(userID uuid.UUID, targetUserID uuid.UUID) (*models.UserBlock, error) {

	return getRow[models.UserBlock](r.repository, "user_blocks", []string{"user_id", "target_user_id"}, userID, targetUserID)
}

func (r *UserBlockRepoImpl) Create(value *models.UserBlock) error {

	return createRow(r.repository, "user_blocks", value, "")
}

func (r *UserBlockRepoImpl) DeleteByKey(userID uuid.UUID, targetUserID uuid.UUID) error {

	return deleteRow(r.repository, "user_blocks", []string{"user_id", "target_user_id"}, userID, targetUserID)
}
