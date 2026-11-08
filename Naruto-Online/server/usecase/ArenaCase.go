package usecase

import (
	"context"
	"narutoserver/internal"
	"narutoserver/repo"
)

type ArenaCase struct{ ctx context.Context }

func NewArenaUseCase(ctx context.Context) (internal.ArenaUseCase, error) {

	if ctx == nil {

		return nil, internal.Reject("INVALID_INPUT", "invalid context")
	}

	return &ArenaCase{ctx}, nil
}

func (u *ArenaCase) ListArenas(param internal.ParamListArenas) (*internal.DataListArenas, error) {

	r, err := repo.NewArenaRepo(u.ctx)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	rows, err := r.ListEnabled()

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	if len(rows) == 0 {

		return nil, &internal.InternalError{}
	}

	data := &internal.DataListArenas{Items: []internal.ArenaData{}}
	for _, row := range rows {

		data.Items = append(data.Items, internal.ArenaData{ID: row.ID, MapID: row.MapID, Name: row.Name, Enabled: row.Enabled, TileCount: row.TileCount, WorldWidth: row.WorldWidth, WorldHeight: row.WorldHeight, ThumbnailPath: row.ThumbnailPath, RulesHash: row.RulesHash, AssetManifestHash: row.AssetManifestHash})
	}

	return data, nil
}
