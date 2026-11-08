package repo

import (
	"context"
	"database/sql"
	"github.com/google/uuid"
	"narutoserver/models"
)

type SessionRepoImpl struct{ *repository }

var _ models.SessionRepo = (*SessionRepoImpl)(nil)

func NewSessionRepo(ctx context.Context) (models.SessionRepo, error) {

	r, err := newRepository(ctx)

	if err != nil {

		return nil, err
	}

	return &SessionRepoImpl{r}, nil
}

func NewSessionRepoTx(ctx context.Context, tx *sql.Tx) (models.SessionRepo, error) {

	r, err := newRepositoryTx(ctx, tx)

	if err != nil {

		return nil, err
	}

	return &SessionRepoImpl{r}, nil
}

func (r *SessionRepoImpl) GetByID(id uuid.UUID) (*models.Session, error) {

	return getRow[models.Session](r.repository, "sessions", []string{"id"}, id)
}

func (r *SessionRepoImpl) Create(value *models.Session) error {

	return createRow(r.repository, "sessions", value, "")
}

func (r *SessionRepoImpl) Update(value *models.Session) error {

	return updateRow(r.repository, "sessions", value, []string{"id"}, "")
}
