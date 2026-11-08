package usecase

import (
	"context"
	"database/sql"
	"encoding/json"
	"github.com/google/uuid"
	"narutoserver/internal"
	"narutoserver/internal/auth"
	"narutoserver/models"
	"narutoserver/repo"
	"time"
)

type ModerationCase struct{ ctx context.Context }

func NewModerationUseCase(ctx context.Context) (internal.ModerationUseCase, error) {

	if ctx == nil {

		return nil, internal.Reject("INVALID_INPUT", "invalid context")
	}

	return &ModerationCase{ctx}, nil
}

func (u *ModerationCase) BlockUser(param internal.ParamBlockUser) (*internal.DataBlockUser, error) {

	p, err := internal.CurrentPrincipal(u.ctx)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	if p.UserID == param.UserID {

		return nil, internal.Reject("INVALID_INPUT", "cannot block yourself")
	}

	users, err := repo.NewUserRepo(u.ctx)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	_, err = users.GetByID(param.UserID)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	blocks, err := repo.NewUserBlockRepo(u.ctx)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	block, err := blocks.Put(p.UserID, param.UserID)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	return &internal.DataBlockUser{BlockData: internal.BlockData{TargetUserID: block.TargetUserID, CreatedAt: block.CreatedAt}}, nil
}

func (u *ModerationCase) UnblockUser(param internal.ParamUnblockUser) (*internal.DataUnblockUser, error) {

	p, err := internal.CurrentPrincipal(u.ctx)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	blocks, err := repo.NewUserBlockRepo(u.ctx)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	err = blocks.DeleteByKey(p.UserID, param.UserID)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	return &internal.DataUnblockUser{}, nil
}

func (u *ModerationCase) ListBlocks(param internal.ParamListBlocks) (*internal.DataListBlocks, error) {

	p, err := internal.CurrentPrincipal(u.ctx)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	blocks, err := repo.NewUserBlockRepo(u.ctx)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	at, id := cursorParts(param.Cursor)

	rows, err := blocks.Page(p.UserID, param.Limit+1, at, id)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	data := &internal.DataListBlocks{Items: []internal.BlockData{}}
	if len(rows) > param.Limit {

		rows = rows[:param.Limit]
		last := rows[len(rows)-1]
		data.NextCursor = encodeCursor(last.CreatedAt, last.TargetUserID, param.Scope)
	}

	for _, row := range rows {

		data.Items = append(data.Items, internal.BlockData{TargetUserID: row.TargetUserID, CreatedAt: row.CreatedAt})
	}

	return data, nil
}

func (u *ModerationCase) CreateReport(param internal.ParamCreateReport) (*internal.DataCreateReport, error) {

	p, err := internal.CurrentPrincipal(u.ctx)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	if p.UserID == param.TargetUserID {

		return nil, internal.Reject("INVALID_INPUT", "cannot report yourself")
	}

	receipts, err := repo.NewRequestReceiptRepo(u.ctx)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	body, err := json.Marshal(param)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	result, _, err := receipts.Execute(p.UserID, "http", "createReport", param.IdempotencyKey, auth.Hash(body), func(tx *sql.Tx) ([]byte, error) {

		rooms, err := repo.NewRoomRepoTx(u.ctx, tx)

		if err != nil {

			return nil, err
		}

		member, err := rooms.MemberExists(param.RoomID, p.UserID)

		if err != nil {

			return nil, err
		}

		if !member {

			return nil, internal.Reject("NOT_FOUND", "room not found")
		}

		target, err := rooms.MemberExists(param.RoomID, param.TargetUserID)

		if err != nil {

			return nil, err
		}

		if param.MatchID != nil {

			matches, err := repo.NewMatchRepoTx(u.ctx, tx)

			if err != nil {

				return nil, err
			}

			match, err := matches.ForParticipant(*param.MatchID, p.UserID)

			if err != nil {

				return nil, err
			}

			if match.RoomID != param.RoomID {

				return nil, internal.Reject("NOT_FOUND", "match not found")
			}

			players, err := repo.NewMatchPlayerRepoTx(u.ctx, tx)

			if err != nil {

				return nil, err
			}

			_, err = players.ByUser(*param.MatchID, param.TargetUserID)

			if err != nil {

				return nil, err
			}

			target = true
		}

		evidence := []byte("{}")

		if param.MessageID != nil {

			messages, err := repo.NewChatMessageRepoTx(u.ctx, tx)

			if err != nil {

				return nil, err
			}

			message, err := messages.GetByID(*param.MessageID)

			if err != nil {

				return nil, err
			}

			if message.RoomID != param.RoomID || message.SenderUserID == nil || *message.SenderUserID != param.TargetUserID {

				return nil, internal.Reject("NOT_FOUND", "message not found")
			}

			evidence, err = json.Marshal(map[string]any{"text": message.Body, "sentAt": message.CreatedAt})

			if err != nil {

				return nil, err
			}

			target = true
		}

		if !target {

			return nil, internal.Reject("NOT_FOUND", "participant not found")
		}

		reports, err := repo.NewReportRepoTx(u.ctx, tx)

		if err != nil {

			return nil, err
		}

		row := models.NewReport()

		row.ID = uuid.New()

		row.ReporterUserID = p.UserID
		row.TargetUserID = param.TargetUserID
		row.RoomID = param.RoomID
		row.MatchID = param.MatchID
		row.MessageID = param.MessageID
		row.Category = param.Category
		row.Description = param.Description
		row.Evidence = evidence
		row.Status = "open"
		row.CreatedAt = time.Now().UTC()

		err = reports.Create(row)

		if err != nil {

			return nil, err
		}

		return json.Marshal(internal.DataCreateReport{ID: row.ID, CreatedAt: row.CreatedAt})
	})

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	data := new(internal.DataCreateReport)

	err = json.Unmarshal(result, data)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	return data, nil
}
