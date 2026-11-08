package repo

import (
	"context"
	"database/sql"
	"github.com/google/uuid"
	"narutoserver/models"
)

type ReportRepoImpl struct{ *repository }

var _ models.ReportRepo = (*ReportRepoImpl)(nil)

func NewReportRepo(ctx context.Context) (models.ReportRepo, error) {

	r, err := newRepository(ctx)

	if err != nil {

		return nil, err
	}

	return &ReportRepoImpl{r}, nil
}

func NewReportRepoTx(ctx context.Context, tx *sql.Tx) (models.ReportRepo, error) {

	r, err := newRepositoryTx(ctx, tx)

	if err != nil {

		return nil, err
	}

	return &ReportRepoImpl{r}, nil
}

func (r *ReportRepoImpl) GetByID(id uuid.UUID) (*models.Report, error) {

	return getRow[models.Report](r.repository, "reports", []string{"id"}, id)
}

func (r *ReportRepoImpl) Create(value *models.Report) error {

	return createRow(r.repository, "reports", value, "")
}

func (r *ReportRepoImpl) Update(value *models.Report) error {

	return updateRow(r.repository, "reports", value, []string{"id"}, "")
}
