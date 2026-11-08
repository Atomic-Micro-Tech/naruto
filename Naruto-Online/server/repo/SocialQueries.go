package repo

import (
	"github.com/google/uuid"
	"narutoserver/models"
	"time"
)

func (r *ChatMessageRepoImpl) Page(roomID, userID uuid.UUID, limit int, at *time.Time, id *uuid.UUID) ([]*models.ChatMessage, error) {

	return listRows[models.ChatMessage](r.repository, "chat_messages", "WHERE room_id=$1 AND hidden_at IS NULL AND NOT EXISTS(SELECT 1 FROM naruto.user_blocks b WHERE b.user_id=$2 AND b.target_user_id=chat_messages.sender_user_id) AND ($3::timestamptz IS NULL OR (created_at,id)<($3,$4::uuid)) ORDER BY created_at DESC,id DESC LIMIT $5", roomID, userID, at, id, limit)
}

func (r *UserBlockRepoImpl) Put(userID, targetID uuid.UUID) (*models.UserBlock, error) {

	_, err := r.query.ExecContext(r.ctx, "INSERT INTO naruto.user_blocks(user_id,target_user_id) VALUES($1,$2) ON CONFLICT DO NOTHING", userID, targetID)

	if err != nil {

		return nil, translate(err)
	}

	return r.GetByKey(userID, targetID)
}

func (r *UserBlockRepoImpl) Page(userID uuid.UUID, limit int, at *time.Time, id *uuid.UUID) ([]*models.UserBlock, error) {

	return listRows[models.UserBlock](r.repository, "user_blocks", "WHERE user_id=$1 AND ($2::timestamptz IS NULL OR (created_at,target_user_id)<($2,$3::uuid)) ORDER BY created_at DESC,target_user_id DESC LIMIT $4", userID, at, id, limit)
}
