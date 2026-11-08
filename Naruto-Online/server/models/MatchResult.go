package models

import (
	"github.com/google/uuid"
)

// MatchResult maps naruto.match_results. The database remains the source of constraints and defaults.
type MatchResult struct {
	MatchID      uuid.UUID `db:"match_id" json:"-"`
	Seat         int16     `db:"seat" json:"-"`
	DisplayOrder int16     `db:"display_order" json:"-"`
	BadgeID      int16     `db:"badge_id" json:"-"`
	Chakra       int32     `db:"chakra" json:"-"`
}

// MatchResultRepo is the data-access contract for naruto.match_results.
type MatchResultRepo interface {
	GetByKey(matchID uuid.UUID, seat int16) (*MatchResult, error)
	Create(value *MatchResult) error
}

// NewMatchResult constructs a row value for scanning or persistence.
func NewMatchResult() *MatchResult {

	return &MatchResult{}
}

func (m *MatchResult) GetMatchID() uuid.UUID {

	return m.MatchID
}

func (m *MatchResult) SetMatchID(value uuid.UUID) {

	m.MatchID = value
}

func (m *MatchResult) GetSeat() int16 {

	return m.Seat
}

func (m *MatchResult) SetSeat(value int16) {

	m.Seat = value
}

func (m *MatchResult) GetDisplayOrder() int16 {

	return m.DisplayOrder
}

func (m *MatchResult) SetDisplayOrder(value int16) {

	m.DisplayOrder = value
}

func (m *MatchResult) GetBadgeID() int16 {

	return m.BadgeID
}

func (m *MatchResult) SetBadgeID(value int16) {

	m.BadgeID = value
}

func (m *MatchResult) GetChakra() int32 {

	return m.Chakra
}

func (m *MatchResult) SetChakra(value int32) {

	m.Chakra = value
}
