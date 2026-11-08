package repo

import (
	"context"
	"database/sql"
	"github.com/google/uuid"
	"narutoserver/models"
)

type ChatMessageRepoImpl struct{ *repository }

var _ models.ChatMessageRepo = (*ChatMessageRepoImpl)(nil)

func NewChatMessageRepo(ctx context.Context) (models.ChatMessageRepo, error) {

	r, err := newRepository(ctx)

	if err != nil {

		return nil, err
	}

	return &ChatMessageRepoImpl{r}, nil
}

func NewChatMessageRepoTx(ctx context.Context, tx *sql.Tx) (models.ChatMessageRepo, error) {

	r, err := newRepositoryTx(ctx, tx)

	if err != nil {

		return nil, err
	}

	return &ChatMessageRepoImpl{r}, nil
}

func (r *ChatMessageRepoImpl) GetByID(id uuid.UUID) (*models.ChatMessage, error) {

	return getRow[models.ChatMessage](r.repository, "chat_messages", []string{"id"}, id)
}

func (r *ChatMessageRepoImpl) Create(value *models.ChatMessage) error {

	return createRow(r.repository, "chat_messages", value, "")
}

func (r *ChatMessageRepoImpl) Update(value *models.ChatMessage) error {

	return updateRow(r.repository, "chat_messages", value, []string{"id"}, "")
}
