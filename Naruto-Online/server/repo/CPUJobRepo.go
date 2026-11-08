package repo

import (
	"context"
	"database/sql"
	"github.com/google/uuid"
	"narutoserver/models"
)

type CPUJobRepoImpl struct{ *repository }

var _ models.CPUJobRepo = (*CPUJobRepoImpl)(nil)

func NewCPUJobRepo(ctx context.Context) (models.CPUJobRepo, error) {

	r, err := newRepository(ctx)

	if err != nil {

		return nil, err
	}

	return &CPUJobRepoImpl{r}, nil
}

func NewCPUJobRepoTx(ctx context.Context, tx *sql.Tx) (models.CPUJobRepo, error) {

	r, err := newRepositoryTx(ctx, tx)

	if err != nil {

		return nil, err
	}

	return &CPUJobRepoImpl{r}, nil
}

func (r *CPUJobRepoImpl) GetByID(id uuid.UUID) (*models.CPUJob, error) {

	return getRow[models.CPUJob](r.repository, "cpu_jobs", []string{"id"}, id)
}

func (r *CPUJobRepoImpl) Create(value *models.CPUJob) error {

	return createRow(r.repository, "cpu_jobs", value, "")
}

func (r *CPUJobRepoImpl) Update(value *models.CPUJob) error {

	return updateRow(r.repository, "cpu_jobs", value, []string{"id"}, "")
}
