package usecase

import (
	"context"
	"narutoserver/internal"
	"narutoserver/repo"
)

type SystemCase struct{ ctx context.Context }

func NewSystemUseCase(ctx context.Context) (internal.SystemUseCase, error) {

	if ctx == nil {

		return nil, internal.Reject("INVALID_INPUT", "invalid context")
	}

	return &SystemCase{ctx}, nil
}

func (u *SystemCase) GetHealth(param internal.ParamGetHealth) (*internal.DataGetHealth, error) {

	return &internal.DataGetHealth{Status: "ok"}, nil
}

func (u *SystemCase) GetReadiness(param internal.ParamGetReadiness) (*internal.DataGetReadiness, error) {

	migration, err := repo.NewSchemaMigrationRepo(u.ctx)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	_, err = migration.GetByVersion(internal.RequiredSchemaVersion)

	if err != nil {

		return nil, &internal.InternalError{Cause: err}
	}

	r, err := repo.NewArenaRepo(u.ctx)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	rows, err := r.ListEnabled()

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	if len(rows) != 1 {

		return nil, internal.Reject("UNAVAILABLE", "arena data unavailable")
	}

	return &internal.DataGetReadiness{Status: "ready"}, nil
}
