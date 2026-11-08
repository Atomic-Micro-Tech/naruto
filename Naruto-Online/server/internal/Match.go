package internal

import (
	"encoding/json"
	"github.com/google/uuid"
)

type RequestGetMatch struct{ MatchID uuid.UUID }
type ParamGetMatch struct{ MatchID uuid.UUID }
type DataGetMatch struct {
	Snapshot json.RawMessage `json:"-"`
}

type MatchUseCase interface {
	GetMatch(param ParamGetMatch) (*DataGetMatch, error)
}

func (d DataGetMatch) MarshalJSON() ([]byte, error) {

	return d.Snapshot.MarshalJSON()
}
