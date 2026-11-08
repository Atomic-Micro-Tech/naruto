package models

import (
	"time"
)

// SchemaMigration maps naruto.schema_migrations. The database remains the source of constraints and defaults.
type SchemaMigration struct {
	Version   string    `db:"version" json:"-"`
	AppliedAt time.Time `db:"applied_at" json:"-"`
}

// SchemaMigrationRepo is the data-access contract for naruto.schema_migrations.
type SchemaMigrationRepo interface {
	GetByVersion(version string) (*SchemaMigration, error)
	Create(value *SchemaMigration) error
}

// NewSchemaMigration constructs a row value for scanning or persistence.
func NewSchemaMigration() *SchemaMigration {

	return &SchemaMigration{}
}

func (m *SchemaMigration) GetVersion() string {

	return m.Version
}

func (m *SchemaMigration) SetVersion(value string) {

	m.Version = value
}

func (m *SchemaMigration) GetAppliedAt() time.Time {

	return m.AppliedAt
}

func (m *SchemaMigration) SetAppliedAt(value time.Time) {

	m.AppliedAt = value
}
