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
	ExecuteMatch(param ParamExecuteMatch) (*DataExecuteMatch, error)
	ReclaimMatch(param ParamReclaimMatch) (*DataExecuteMatch, error)
	AdvanceMatches(param ParamAdvanceMatches) (*DataAdvanceMatches, error)
}

type MatchAction struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}
type RequestExecuteMatch struct {
	CommandID            uuid.UUID   `json:"commandId"`
	MatchID              uuid.UUID   `json:"matchId"`
	ExpectedStateVersion int64       `json:"expectedStateVersion"`
	ControlEpoch         int64       `json:"controlEpoch"`
	Action               MatchAction `json:"action"`
}
type ParamExecuteMatch struct {
	RequestExecuteMatch
	RequestID    uuid.UUID
	ConnectionID uuid.UUID
}
type RequestReclaimMatch struct {
	MatchID              uuid.UUID `json:"matchId"`
	ExpectedControlEpoch int64     `json:"expectedControlEpoch"`
}
type ParamReclaimMatch struct {
	RequestReclaimMatch
	RequestID    uuid.UUID
	ConnectionID uuid.UUID
}
type DataExecuteMatch struct {
	RequestID     uuid.UUID  `json:"requestId"`
	CommandID     *uuid.UUID `json:"commandId,omitempty"`
	StateVersion  int64      `json:"stateVersion"`
	EventSequence int64      `json:"eventSequence"`
	Duplicate     bool       `json:"duplicate"`
	Outcome       string     `json:"outcome"`
}
type RequestAdvanceMatches struct{}
type ParamAdvanceMatches struct{}
type DataAdvanceMatches struct{ Changed int }

func (d DataGetMatch) MarshalJSON() ([]byte, error) {

	return d.Snapshot.MarshalJSON()

}
