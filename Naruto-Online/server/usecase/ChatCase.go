package usecase

import (
	"context"
	"narutoserver/internal"
	"narutoserver/repo"
)

type ChatCase struct{ ctx context.Context }

func NewChatUseCase(ctx context.Context) (internal.ChatUseCase, error) {

	if ctx == nil {

		return nil, internal.Reject("INVALID_INPUT", "invalid context")
	}

	return &ChatCase{ctx}, nil
}

func (u *ChatCase) ListRoomMessages(param internal.ParamListRoomMessages) (*internal.DataListRoomMessages, error) {

	principal, err := internal.CurrentPrincipal(u.ctx)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	rooms, err := repo.NewRoomRepo(u.ctx)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	member, err := rooms.MemberExists(param.RoomID, principal.UserID)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	if !member {

		return nil, internal.Reject("NOT_FOUND", "room not found")
	}

	messages, err := repo.NewChatMessageRepo(u.ctx)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	at, id := cursorParts(param.Cursor)

	rows, err := messages.Page(param.RoomID, principal.UserID, param.Limit+1, at, id)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	data := &internal.DataListRoomMessages{Items: []internal.ChatMessageData{}}
	if len(rows) > param.Limit {

		rows = rows[:param.Limit]
		last := rows[len(rows)-1]
		data.NextCursor = encodeCursor(last.CreatedAt, last.ID, param.Scope)
	}

	for _, row := range rows {

		value := internal.ChatMessageData{ID: row.ID, RoomID: row.RoomID, Kind: row.Kind, Text: row.Body, CreatedAt: row.CreatedAt, ClientMessageID: row.ClientMessageID}
		if row.SenderUserID != nil && row.SenderDisplayName != nil {

			value.Sender = &internal.PlayerIdentity{UserID: *row.SenderUserID, DisplayName: *row.SenderDisplayName}
		}

		data.Items = append(data.Items, value)
	}

	return data, nil
}
