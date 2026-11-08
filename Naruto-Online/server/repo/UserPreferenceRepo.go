package repo

import (
	"context"
	"database/sql"
	"github.com/google/uuid"
	"narutoserver/models"
)

type UserPreferenceRepoImpl struct{ *repository }

var _ models.UserPreferenceRepo = (*UserPreferenceRepoImpl)(nil)

func NewUserPreferenceRepo(ctx context.Context) (models.UserPreferenceRepo, error) {

	r, err := newRepository(ctx)

	if err != nil {

		return nil, err
	}

	return &UserPreferenceRepoImpl{r}, nil
}

func NewUserPreferenceRepoTx(ctx context.Context, tx *sql.Tx) (models.UserPreferenceRepo, error) {

	r, err := newRepositoryTx(ctx, tx)

	if err != nil {

		return nil, err
	}

	return &UserPreferenceRepoImpl{r}, nil
}

func (r *UserPreferenceRepoImpl) GetByUserID(userID uuid.UUID) (*models.UserPreference, error) {

	return getRow[models.UserPreference](r.repository, "user_preferences", []string{"user_id"}, userID)
}

func (r *UserPreferenceRepoImpl) Create(value *models.UserPreference) error {

	return createRow(r.repository, "user_preferences", value, "")
}

func (r *UserPreferenceRepoImpl) Update(value *models.UserPreference) error {

	return updateRow(r.repository, "user_preferences", value, []string{"user_id"}, "")
}
