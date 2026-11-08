package repo

import (
	"context"
	"database/sql"
	"github.com/google/uuid"
	"narutoserver/models"
)

type RoomMemberRepoImpl struct{ *repository }

var _ models.RoomMemberRepo = (*RoomMemberRepoImpl)(nil)

func NewRoomMemberRepo(ctx context.Context) (models.RoomMemberRepo, error) {

	r, err := newRepository(ctx)

	if err != nil {

		return nil, err
	}

	return &RoomMemberRepoImpl{r}, nil
}

func NewRoomMemberRepoTx(ctx context.Context, tx *sql.Tx) (models.RoomMemberRepo, error) {

	r, err := newRepositoryTx(ctx, tx)

	if err != nil {

		return nil, err
	}

	return &RoomMemberRepoImpl{r}, nil
}

func (r *RoomMemberRepoImpl) GetByKey(roomID uuid.UUID, userID uuid.UUID) (*models.RoomMember, error) {

	return getRow[models.RoomMember](r.repository, "room_members", []string{"room_id", "user_id"}, roomID, userID)
}

func (r *RoomMemberRepoImpl) Create(value *models.RoomMember) error {

	return createRow(r.repository, "room_members", value, "join_order")
}

func (r *RoomMemberRepoImpl) Update(value *models.RoomMember) error {

	return updateRow(r.repository, "room_members", value, []string{"room_id", "user_id"}, "join_order")
}

func (r *RoomMemberRepoImpl) DeleteByKey(roomID uuid.UUID, userID uuid.UUID) error {

	return deleteRow(r.repository, "room_members", []string{"room_id", "user_id"}, roomID, userID)
}
