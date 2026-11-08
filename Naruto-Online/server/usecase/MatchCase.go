package usecase

import (
	"context"
	"encoding/json"
	"errors"
	"narutoserver/internal"
	"narutoserver/models"
	"narutoserver/repo"
	"strconv"
)

type MatchCase struct{ ctx context.Context }

func NewMatchUseCase(ctx context.Context) (internal.MatchUseCase, error) {

	if ctx == nil {

		return nil, internal.Reject("INVALID_INPUT", "invalid context")
	}

	return &MatchCase{ctx}, nil
}

func (u *MatchCase) GetMatch(param internal.ParamGetMatch) (*internal.DataGetMatch, error) {

	p, err := internal.CurrentPrincipal(u.ctx)

	if err != nil {

		return nil, err
	}

	matches, err := repo.NewMatchRepo(u.ctx)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	match, rows, err := matches.ReadProjection(param.MatchID, p.UserID)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	var self *models.MatchPlayer
	for _, row := range rows {

		if row.UserID == p.UserID {

			self = row
		}
	}

	if self == nil || len(rows) != int(match.ParticipantCount) {

		return nil, internal.BusinessError(errors.New("incomplete match roster"))
	}

	var checkpoint struct {
		Public        *internal.PublicMatchSnapshot             `json:"public"`
		PrivateBySeat map[string]internal.PublicSelfState       `json:"privateBySeat"`
		AllowedBySeat map[string][]internal.PublicAllowedAction `json:"allowedBySeat"`
	}

	err = json.Unmarshal(match.State, &checkpoint)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	state := checkpoint.Public
	private, ok := checkpoint.PrivateBySeat[strconv.Itoa(int(self.Seat))]
	if state == nil || !ok || private.Seat != int64(self.Seat) || len(state.Players) != int(match.ParticipantCount) || len(state.Tiles) != 22 {

		return nil, internal.BusinessError(errors.New("unsupported match checkpoint projection"))
	}

	state.Id = match.ID.String()

	state.RoomID = match.RoomID.String()

	state.ArenaID = match.ArenaID
	state.Status = match.Status
	state.Phase = internal.PublicMatchPhase(match.Phase)

	state.StateVersion = match.StateVersion
	state.EventSequence = match.LastEventSequence
	state.ServerTick = match.ServerTick
	state.TurnSeat = int64(match.TurnSeat)

	state.Round = int64(match.RoundNumber)

	state.TargetChakra = int64(match.TargetChakra)

	state.RulesHash = internal.PublicSha256(match.RulesHash)

	state.AiRulesHash = internal.PublicSha256(match.AIRulesHash)

	state.AiPolicyVersion = match.AIPolicyVersion
	state.AssetManifestHash = internal.PublicSha256(match.AssetsHash)

	state.Self = private
	if state.Self.Cards == nil {

		state.Self.Cards = []internal.PublicHeldCard{}
	}

	state.AllowedActions = checkpoint.AllowedBySeat[strconv.Itoa(int(self.Seat))]
	if state.AllowedActions == nil {

		state.AllowedActions = []internal.PublicAllowedAction{}
	}

	for _, row := range rows {

		for i := range state.Players {

			if state.Players[i].Seat == int64(row.Seat) {

				state.Players[i].UserID = row.UserID.String()

				state.Players[i].DisplayName = row.DisplayNameSnapshot
				state.Players[i].CharacterID = int64(row.CharacterID)

				state.Players[i].Controller = internal.PublicControllerState{Seat: int64(row.Seat), UserID: row.UserID.String(), ParticipantKind: row.ParticipantKind, ControllerKind: internal.PublicControllerKind(row.ControllerKind), ControlEpoch: row.ControlEpoch, ConnectionStatus: row.ConnectionStatus, Reason: row.TakeoverReason, ReclaimPending: row.ReclaimRequestedAt != nil}
			}
		}
	}

	encoded, err := json.Marshal(state)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	return &internal.DataGetMatch{Snapshot: encoded}, nil
}
