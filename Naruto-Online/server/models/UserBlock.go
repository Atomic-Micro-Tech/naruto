package models

import (
	"github.com/google/uuid"
	"time"
)

// UserBlock maps naruto.user_blocks. The database remains the source of constraints and defaults.
type UserBlock struct {
	UserID       uuid.UUID `db:"user_id" json:"-"`
	TargetUserID uuid.UUID `db:"target_user_id" json:"-"`
	CreatedAt    time.Time `db:"created_at" json:"-"`
}

// UserBlockRepo is the data-access contract for naruto.user_blocks.
type UserBlockRepo interface {
	GetByKey(userID uuid.UUID, targetUserID uuid.UUID) (*UserBlock, error)
	Create(value *UserBlock) error
	DeleteByKey(userID uuid.UUID, targetUserID uuid.UUID) error
	Put(userID, targetID uuid.UUID) (*UserBlock, error)
	Page(userID uuid.UUID, limit int, at *time.Time, id *uuid.UUID) ([]*UserBlock, error)
	Exists(userID, target uuid.UUID) (bool, error)
}

// NewUserBlock constructs a row value for scanning or persistence.
func NewUserBlock() *UserBlock {

	return &UserBlock{}
}

func (m *UserBlock) GetUserID() uuid.UUID {

	return m.UserID
}

func (m *UserBlock) SetUserID(value uuid.UUID) {

	m.UserID = value
}

func (m *UserBlock) GetTargetUserID() uuid.UUID {

	return m.TargetUserID
}

func (m *UserBlock) SetTargetUserID(value uuid.UUID) {

	m.TargetUserID = value
}

func (m *UserBlock) GetCreatedAt() time.Time {

	return m.CreatedAt
}

func (m *UserBlock) SetCreatedAt(value time.Time) {

	m.CreatedAt = value
}
