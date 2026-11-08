package repo

import (
	"context"
	"database/sql"
	"github.com/google/uuid"
	"narutoserver/models"
)

type RoomRepoImpl struct{ *repository }

var _ models.RoomRepo = (*RoomRepoImpl)(nil)

func NewRoomRepo(ctx context.Context) (models.RoomRepo, error) {

	r, err := newRepository(ctx)

	if err != nil {

		return nil, err
	}

	return &RoomRepoImpl{r}, nil
}

func NewRoomRepoTx(ctx context.Context, tx *sql.Tx) (models.RoomRepo, error) {

	r, err := newRepositoryTx(ctx, tx)

	if err != nil {

		return nil, err
	}

	return &RoomRepoImpl{r}, nil
}

func (r *RoomRepoImpl) GetByID(id uuid.UUID) (*models.Room, error) {

	return getRow[models.Room](r.repository, "rooms", []string{"id"}, id)
}

func (r *RoomRepoImpl) Create(value *models.Room) error {

	return createRow(r.repository, "rooms", value, "")
}

func (r *RoomRepoImpl) Update(value *models.Room) error {

	return updateRow(r.repository, "rooms", value, []string{"id"}, "")
}
