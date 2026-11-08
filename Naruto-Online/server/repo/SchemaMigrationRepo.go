package repo

import (
	"context"
	"database/sql"
	"narutoserver/models"
)

type SchemaMigrationRepoImpl struct{ *repository }

var _ models.SchemaMigrationRepo = (*SchemaMigrationRepoImpl)(nil)

func NewSchemaMigrationRepo(ctx context.Context) (models.SchemaMigrationRepo, error) {

	r, err := newRepository(ctx)

	if err != nil {

		return nil, err
	}

	return &SchemaMigrationRepoImpl{r}, nil
}

func NewSchemaMigrationRepoTx(ctx context.Context, tx *sql.Tx) (models.SchemaMigrationRepo, error) {

	r, err := newRepositoryTx(ctx, tx)

	if err != nil {

		return nil, err
	}

	return &SchemaMigrationRepoImpl{r}, nil
}

func (r *SchemaMigrationRepoImpl) GetByVersion(version string) (*models.SchemaMigration, error) {

	return getRow[models.SchemaMigration](r.repository, "schema_migrations", []string{"version"}, version)
}

func (r *SchemaMigrationRepoImpl) Create(value *models.SchemaMigration) error {

	return createRow(r.repository, "schema_migrations", value, "")
}
