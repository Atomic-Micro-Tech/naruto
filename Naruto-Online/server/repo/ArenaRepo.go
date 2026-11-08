package repo

import (
	"context"
	"database/sql"
	"narutoserver/models"
)

type ArenaRepoImpl struct{ *repository }

var _ models.ArenaRepo = (*ArenaRepoImpl)(nil)

func NewArenaRepo(ctx context.Context) (models.ArenaRepo, error) {

	r, err := newRepository(ctx)

	if err != nil {

		return nil, err
	}

	return &ArenaRepoImpl{r}, nil
}

func NewArenaRepoTx(ctx context.Context, tx *sql.Tx) (models.ArenaRepo, error) {

	r, err := newRepositoryTx(ctx, tx)

	if err != nil {

		return nil, err
	}

	return &ArenaRepoImpl{r}, nil
}

func (r *ArenaRepoImpl) GetByID(id string) (*models.Arena, error) {

	return getRow[models.Arena](r.repository, "arenas", []string{"id"}, id)
}

func (r *ArenaRepoImpl) Create(value *models.Arena) error {

	return createRow(r.repository, "arenas", value, "")
}

func (r *ArenaRepoImpl) Update(value *models.Arena) error {

	return updateRow(r.repository, "arenas", value, []string{"id"}, "")
}
