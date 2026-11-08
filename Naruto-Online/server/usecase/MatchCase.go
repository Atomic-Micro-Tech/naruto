package usecase

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/binary"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/google/uuid"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/trace"
	"narutoserver/internal"
	"narutoserver/internal/auth"
	"narutoserver/internal/game"
	"narutoserver/models"
	"narutoserver/repo"
	"narutoserver/telemetry"
	"strconv"
	"time"
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
	state.Status = "playing"
	if match.Status == "completed" || match.Status == "aborted" {

		state.Status = "finished"

	} else if match.Status == "paused_error" {

		state.Status = "paused_error"

	}

	state.Phase = internal.PublicMatchPhase(match.Phase)

	state.StateVersion = match.StateVersion
	state.EventSequence = match.LastEventSequence
	state.ServerTick = match.ServerTick
	if match.Status == "running" {

		state.ServerTick = max(match.ServerTick, time.Since(match.StartedAt).Milliseconds()*60/1000)

	}

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
	if self.ControllerKind != "human" || match.Status != "running" {

		state.AllowedActions = nil

	}

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

// Called inside room.start's receipt transaction, with the room already locked.
func startMatch(ctx context.Context, tx *sql.Tx, room *models.Room, roster []*models.RoomMember) error {

	arenas, err := repo.NewArenaRepoTx(ctx, tx)

	if err != nil {

		return err
	}

	arena, err := arenas.GetByID(room.ArenaID)

	if err != nil {

		return err
	}

	if !arena.Enabled || arena.MapID != 0 {

		return internal.Reject("INVALID_ACTION", "arena is unavailable")
	}

	for _, member := range roster {

		if member.AssetManifestHash == nil || *member.AssetManifestHash != arena.AssetManifestHash {

			return internal.Reject("ASSET_VERSION_MISMATCH", "reload the arena assets before starting")
		}

	}

	users, err := repo.NewUserRepoTx(ctx, tx)

	if err != nil {

		return err
	}

	seats := make([]game.Player, 0, len(roster))

	for _, member := range roster {

		user, err := users.GetByID(member.UserID)

		if err != nil {

			return err
		}

		seats = append(seats, game.Player{CharacterID: member.CharacterID, Name: user.DisplayName})

	}

	var random [4]byte
	_, err = rand.Read(random[:])

	if err != nil {

		return err
	}

	seed := int64(binary.LittleEndian.Uint32(random[:]))

	if seed == 0 {

		seed = 1
	}

	now := time.Now().UTC()

	checkpoint, err := game.Run(ctx, game.Input{Mode: "init", Roster: seats, Seed: seed, Target: room.TargetChakra, ChoiceID: uuid.NewString(), Now: now.Format(time.RFC3339Nano)})

	if err != nil {

		return err
	}

	settings, err := json.Marshal(map[string]any{"arenaId": room.ArenaID, "targetChakra": room.TargetChakra, "rule": room.Rule, "capacity": room.Capacity})

	if err != nil {

		return err
	}

	match := &models.Match{ID: uuid.New(), RoomID: room.ID, ArenaID: room.ArenaID, Status: "running", ParticipantCount: int16(len(roster)), TargetChakra: room.TargetChakra, Rule: room.Rule, SettingsSnapshot: settings, RulesHash: arena.RulesHash, AIRulesHash: arena.AIRulesHash, BoardDataHash: arena.BoardDataHash, AssetsHash: arena.AssetManifestHash, EngineVersion: internal.GameEngineVersion, AIPolicyVersion: internal.GameAIPolicyVersion, StateSchemaVersion: 1, StateVersion: 1, LastEventSequence: 1, InitialRNGSeed: seed, CreatedAt: now, StartedAt: now, UpdatedAt: now}
	err = assignCheckpoint(match, checkpoint, now)

	if err != nil {

		return err
	}

	matches, err := repo.NewMatchRepoTx(ctx, tx)

	if err != nil {

		return err
	}

	err = matches.Create(match)

	if err != nil {

		return err
	}

	players, err := repo.NewMatchPlayerRepoTx(ctx, tx)

	if err != nil {

		return err
	}

	for i, member := range roster {

		err = players.Create(&models.MatchPlayer{MatchID: match.ID, Seat: int16(i), ParticipantCount: match.ParticipantCount, UserID: member.UserID, DisplayNameSnapshot: seats[i].Name, CharacterID: member.CharacterID, ParticipantKind: "human", ControllerKind: "human", ConnectionStatus: "connected", ControllerChangedAt: now, LastInputAt: &now, PolicyState: json.RawMessage(`{}`)})

		if err != nil {

			return err
		}

	}

	room.Status = "playing"
	room.ActiveMatchID = &match.ID
	rooms, err := repo.NewRoomRepoTx(ctx, tx)

	if err != nil {

		return err
	}

	err = rooms.Update(room)

	if err != nil {

		return err
	}

	return recordMatch(ctx, tx, match, "match.started", nil, nil)

}

func assignCheckpoint(match *models.Match, checkpoint *game.Checkpoint, now time.Time) error {

	encoded, err := json.Marshal(checkpoint)

	if err != nil {

		return err
	}

	match.State = encoded
	match.StateHash = auth.Hash(encoded)

	match.RNGState = checkpoint.Seed
	match.RNGDrawCount = checkpoint.RNGDrawCount
	match.Phase = string(checkpoint.Public.Phase)

	match.TurnSeat = int16(checkpoint.Public.TurnSeat)

	match.RoundNumber = int32(checkpoint.Public.Round)

	match.UpdatedAt = now
	deadline := now.Add(120 * time.Second)

	tick := match.ServerTick + 7200
	match.DecisionDeadlineAt = &deadline
	match.DecisionDeadlineTick = &tick
	if checkpoint.Public.Result != nil {

		result := checkpoint.Public.Result
		match.Status = "completed"
		match.EndedAt = &now
		match.ResultReason = &result.Reason
		match.ResultDescription = &result.Description
		match.DecisionDeadlineAt = nil
		match.DecisionDeadlineTick = nil
		if result.WinnerSeat != nil {

			seat := int16(*result.WinnerSeat)

			match.WinnerSeat = &seat
		}

	}

	return nil

}

func recordMatch(ctx context.Context, tx *sql.Tx, match *models.Match, eventType string, commandID *uuid.UUID, actor *int16) error {

	events, err := repo.NewMatchEventRepoTx(ctx, tx)

	if err != nil {

		return err
	}

	err = events.Create(&models.MatchEvent{MatchID: match.ID, Sequence: match.LastEventSequence, StateVersion: match.StateVersion, ServerTick: match.ServerTick, EventType: eventType, CommandID: commandID, ActorSeat: actor, Payload: json.RawMessage(`{}`), CreatedAt: match.UpdatedAt})

	if err != nil {

		return err
	}

	snapshots, err := repo.NewMatchSnapshotRepoTx(ctx, tx)

	if err != nil {

		return err
	}

	if match.StateVersion == 1 || match.StateVersion%20 == 0 || match.Status != "running" {

		err = snapshots.Create(&models.MatchSnapshot{MatchID: match.ID, StateVersion: match.StateVersion, LastEventSequence: match.LastEventSequence, ServerTick: match.ServerTick, StateSchemaVersion: match.StateSchemaVersion, RNGState: match.RNGState, RNGDrawCount: match.RNGDrawCount, Snapshot: match.State, StateHash: match.StateHash, CreatedAt: match.UpdatedAt})

		if err != nil {

			return err
		}

	}

	outbox, err := repo.NewOutboxEventRepoTx(ctx, tx)

	if err != nil {

		return err
	}

	payload, err := json.Marshal(map[string]any{"eventType": eventType})

	if err != nil {

		return err
	}

	return outbox.Create(&models.OutboxEvent{Topic: "match.changed", AggregateID: match.ID, DeduplicationKey: fmt.Sprintf("match:%s:%d", match.ID, match.LastEventSequence), Payload: payload, CreatedAt: match.UpdatedAt, AvailableAt: match.UpdatedAt})

}

func finishMatch(ctx context.Context, tx *sql.Tx, match *models.Match, checkpoint *game.Checkpoint) error {

	if match.Status != "completed" {

		return nil
	}

	results, err := repo.NewMatchResultRepoTx(ctx, tx)

	if err != nil {

		return err
	}

	for i, row := range checkpoint.Public.Result.Entries {

		err = results.Create(&models.MatchResult{MatchID: match.ID, Seat: int16(row.Seat), DisplayOrder: int16(i), BadgeID: int16(row.BadgeID), Chakra: int32(row.Chakra)})

		if err != nil {

			return err
		}

	}

	rooms, err := repo.NewRoomRepoTx(ctx, tx)

	if err != nil {

		return err
	}

	room, err := rooms.GetByID(match.RoomID)

	if err != nil {

		return err
	}

	if room.Status == "closed" {

		return nil
	}

	room.Status = "waiting"
	room.ActiveMatchID = nil
	room.RoomVersion++
	room.UpdatedAt = match.UpdatedAt
	err = rooms.Update(room)

	if err != nil {

		return err
	}

	members, err := repo.NewRoomMemberRepoTx(ctx, tx)

	if err != nil {

		return err
	}

	err = members.ResetReady(room.ID)

	if err != nil {

		return err
	}

	return rooms.EnqueueChanged(room.ID, room.RoomVersion)

}

func activeMatchController(ctx context.Context, tx *sql.Tx, connectionID, userID uuid.UUID) error {

	// Connect/logout also lock the user before the room. Fence replacement for the
	// entire match transaction, not just the moment Alive is read.
	users, err := repo.NewUserRepoTx(ctx, tx)

	if err != nil {

		return err
	}

	err = users.Lock(userID)

	if err != nil {

		return err
	}

	connections, err := repo.NewRealtimeConnectionRepoTx(ctx, tx)

	if err != nil {

		return err
	}

	connection, err := connections.GetByID(connectionID)

	if err != nil {

		return err
	}

	alive, err := connections.Alive(connectionID)

	if err != nil {

		return err
	}

	if !alive || connection.UserID != userID {

		return internal.Reject("UNAUTHENTICATED", "connection replaced or expired")
	}

	return nil

}

func (u *MatchCase) ExecuteMatch(param internal.ParamExecuteMatch) (output *internal.DataExecuteMatch, returnErr error) {

	ctx, span := telemetry.Tracer.Start(u.ctx, "usecase/MatchCase.ExecuteMatch")

	defer span.End()

	defer markMatchError(span, &returnErr)

	principal, err := internal.CurrentPrincipal(ctx)

	if err != nil {

		return nil, err
	}

	receipts, err := repo.NewRequestReceiptRepo(ctx)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	fingerprint, err := json.Marshal(param.RequestExecuteMatch)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	hash := auth.Hash(fingerprint)

	value, duplicate, err := receipts.Execute(principal.UserID, "ws", "match.command", param.RequestID, hash, func(tx *sql.Tx) ([]byte, error) {

		err := activeMatchController(ctx, tx, param.ConnectionID, principal.UserID)

		if err != nil {

			return nil, err
		}

		matches, err := repo.NewMatchRepoTx(ctx, tx)

		if err != nil {

			return nil, err
		}

		match, err := matches.Lock(param.MatchID)

		if err != nil {

			return nil, err
		}

		players, err := repo.NewMatchPlayerRepoTx(ctx, tx)

		if err != nil {

			return nil, err
		}

		player, err := players.ByUser(match.ID, principal.UserID)

		if err != nil {

			return nil, err
		}

		commands, err := repo.NewMatchCommandRepoTx(ctx, tx)

		if err != nil {

			return nil, err
		}

		old, findErr := commands.GetByKey(match.ID, param.CommandID)

		if findErr == nil {

			if old.ActorUserID != principal.UserID || old.RequestHash != hash {

				return nil, internal.Reject("IDEMPOTENCY_CONFLICT", "command ID already used")
			}

			var ack internal.DataExecuteMatch
			err = json.Unmarshal(old.Response, &ack)

			if err != nil {

				return nil, err
			}

			ack.RequestID = param.RequestID
			ack.Duplicate = true
			return json.Marshal(ack)

		}

		var missing *internal.InputError
		if !errors.As(findErr, &missing) || missing.Code != "NOT_FOUND" {

			return nil, findErr
		}

		if match.Status != "running" {

			return nil, internal.Reject("INVALID_ACTION", "match is not running")
		}

		if player.ControllerKind != "human" {

			return nil, internal.Reject("NOT_CONTROLLER", "reclaim your seat before playing")
		}

		if player.ControlEpoch != param.ControlEpoch {

			return nil, internal.Reject("STALE_CONTROL_EPOCH", "control changed; reclaim your seat")
		}

		if match.StateVersion != param.ExpectedStateVersion {

			return nil, internal.Reject("VERSION_CONFLICT", "match version changed")
		}

		var previous game.Checkpoint
		err = json.Unmarshal(match.State, &previous)

		if err != nil {

			return nil, err
		}

		option, err := matchOption(previous, param.Action, player.Seat)

		if err != nil {

			return nil, err
		}

		now := time.Now().UTC()

		tick := max(match.ServerTick+1, now.Sub(match.StartedAt).Milliseconds()*60/1000)

		checkpoint, err := game.Run(ctx, game.Input{Mode: "command", State: previous.Engine, Seat: player.Seat, Option: option, Tick: tick, ChoiceID: uuid.NewString(), Now: now.Format(time.RFC3339Nano)})

		if err != nil {

			return nil, err
		}

		expected := match.StateVersion
		match.StateVersion++
		match.LastEventSequence++
		match.ServerTick = tick
		err = assignCheckpoint(match, checkpoint, now)

		if err != nil {

			return nil, err
		}

		err = matches.Update(match)

		if err != nil {

			return nil, err
		}

		player.LastInputAt = &now
		err = players.Update(player)

		if err != nil {

			return nil, err
		}

		ack := internal.DataExecuteMatch{RequestID: param.RequestID, CommandID: &param.CommandID, StateVersion: match.StateVersion, EventSequence: match.LastEventSequence, Outcome: "applied"}
		response, err := json.Marshal(ack)

		if err != nil {

			return nil, err
		}

		err = commands.Create(&models.MatchCommand{MatchID: match.ID, CommandID: param.CommandID, ActorSeat: player.Seat, ActorUserID: player.UserID, ControllerKind: "human", ControlEpoch: player.ControlEpoch, RequestHash: hash, ActionType: param.Action.Type, Payload: param.Action.Payload, ExpectedStateVersion: expected, ReceivedAt: now, AppliedTick: tick, Outcome: "accepted", ResultStateVersion: match.StateVersion, LastEventSequence: match.LastEventSequence, Response: response})

		if err != nil {

			return nil, err
		}

		err = finishMatch(ctx, tx, match, checkpoint)

		if err != nil {

			return nil, err
		}

		eventType := "state.changed"
		if match.Status == "completed" {

			eventType = "match.finished"
		}

		err = recordMatch(ctx, tx, match, eventType, &param.CommandID, &player.Seat)

		if err != nil {

			return nil, err
		}

		return response, nil

	})

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	var result internal.DataExecuteMatch
	err = json.Unmarshal(value, &result)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	result.Duplicate = result.Duplicate || duplicate
	return &result, nil

}

func matchOption(previous game.Checkpoint, action internal.MatchAction, seat int16) (string, error) {

	if previous.Actor != seat {

		return "", internal.Reject("INVALID_ACTION", "another player must act")
	}

	var input struct {
		ChoiceID string `json:"choiceId"`
		OptionID string `json:"optionId"`
	}
	err := json.Unmarshal(action.Payload, &input)

	if err != nil {

		return "", internal.Reject("INVALID_ACTION", "invalid action")
	}

	if action.Type != "choice.select" || input.ChoiceID != previous.ChoiceID {

		return "", internal.Reject("INVALID_ACTION", "use a current server choice")
	}

	for _, action := range previous.AllowedBySeat[strconv.Itoa(int(seat))] {

		for _, option := range action.Options {

			if option.Enabled && option.Id == input.OptionID {

				return option.Id, nil
			}
		}

	}

	return "", internal.Reject("INVALID_ACTION", "option is unavailable")

}

func (u *MatchCase) ReclaimMatch(param internal.ParamReclaimMatch) (output *internal.DataExecuteMatch, returnErr error) {

	ctx, span := telemetry.Tracer.Start(u.ctx, "usecase/MatchCase.ReclaimMatch")

	defer span.End()

	defer markMatchError(span, &returnErr)

	principal, err := internal.CurrentPrincipal(ctx)

	if err != nil {

		return nil, err
	}

	receipts, err := repo.NewRequestReceiptRepo(ctx)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	encoded, err := json.Marshal(param.RequestReclaimMatch)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	value, duplicate, err := receipts.Execute(principal.UserID, "ws", "match.reclaim", param.RequestID, auth.Hash(encoded), func(tx *sql.Tx) ([]byte, error) {

		err := activeMatchController(ctx, tx, param.ConnectionID, principal.UserID)

		if err != nil {

			return nil, err
		}

		matches, err := repo.NewMatchRepoTx(ctx, tx)

		if err != nil {

			return nil, err
		}

		match, err := matches.Lock(param.MatchID)

		if err != nil {

			return nil, err
		}

		players, err := repo.NewMatchPlayerRepoTx(ctx, tx)

		if err != nil {

			return nil, err
		}

		player, err := players.ByUser(match.ID, principal.UserID)

		if err != nil {

			return nil, err
		}

		if match.Status != "running" {

			return nil, internal.Reject("INVALID_ACTION", "match is not running")
		}

		if player.ControlEpoch != param.ExpectedControlEpoch {

			return nil, internal.Reject("STALE_CONTROL_EPOCH", "control changed")
		}

		members, err := repo.NewRoomMemberRepoTx(ctx, tx)

		if err != nil {

			return nil, err
		}

		_, err = members.GetByKey(match.RoomID, principal.UserID)

		if err != nil {

			return nil, err
		}

		outcome := "noop"
		if player.ControllerKind == "cpu" {

			now := time.Now().UTC()

			reason := "reconnect"
			// Every persisted checkpoint is a decision boundary; the match lock fences an in-flight CPU action.
			player.ControllerKind = "human"
			player.ControlEpoch++
			player.ConnectionStatus = "connected"
			player.TakeoverReason = &reason
			player.ControllerChangedAt = now
			player.LastInputAt = &now
			player.ReclaimRequestedAt = nil
			err = players.Update(player)

			if err != nil {

				return nil, err
			}

			match.StateVersion++
			match.LastEventSequence++
			match.UpdatedAt = now
			deadline := now.Add(120 * time.Second)

			match.DecisionDeadlineAt = &deadline
			err = matches.Update(match)

			if err != nil {

				return nil, err
			}

			err = recordMatch(ctx, tx, match, "controller.changed", nil, &player.Seat)

			if err != nil {

				return nil, err
			}

			outcome = "applied"

		}

		return json.Marshal(internal.DataExecuteMatch{RequestID: param.RequestID, StateVersion: match.StateVersion, EventSequence: match.LastEventSequence, Outcome: outcome})

	})

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	var result internal.DataExecuteMatch
	err = json.Unmarshal(value, &result)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	result.Duplicate = duplicate
	return &result, nil

}

func (u *MatchCase) AdvanceMatches(param internal.ParamAdvanceMatches) (output *internal.DataAdvanceMatches, returnErr error) {

	ctx, span := telemetry.Tracer.Start(u.ctx, "usecase/MatchCase.AdvanceMatches")

	defer span.End()

	defer markMatchError(span, &returnErr)

	matches, err := repo.NewMatchRepo(ctx)

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	ids, err := matches.RunningIDs()

	if err != nil {

		return nil, internal.BusinessError(err)
	}

	result := &internal.DataAdvanceMatches{}
	var failures []error
	for _, id := range ids {

		changed, err := advanceMatch(ctx, id)

		if err != nil {

			failures = append(failures, err)

			continue
		}

		if changed {

			result.Changed++
		}

	}

	if len(failures) > 0 {

		return nil, internal.BusinessError(errors.Join(failures...))
	}

	return result, nil

}

func advanceMatch(ctx context.Context, id uuid.UUID) (bool, error) {

	changed := false
	err := repo.WithinTransaction(ctx, func(tx *sql.Tx) error {

		matches, err := repo.NewMatchRepoTx(ctx, tx)

		if err != nil {

			return err
		}

		match, err := matches.Lock(id)

		if err != nil {

			return err
		}

		if match.Status != "running" {

			return nil
		}

		players, err := repo.NewMatchPlayerRepoTx(ctx, tx)

		if err != nil {

			return err
		}

		roster, err := players.List(id)

		if err != nil {

			return err
		}

		connections, err := repo.NewRealtimeConnectionRepoTx(ctx, tx)

		if err != nil {

			return err
		}

		var previous game.Checkpoint
		err = json.Unmarshal(match.State, &previous)

		if err != nil {

			return err
		}

		now := time.Now().UTC()

		var actor *models.MatchPlayer
		for _, p := range roster {

			connected, err := connections.UserConnected(p.UserID)

			if err != nil {

				return err
			}

			rooms, err := repo.NewRoomRepoTx(ctx, tx)

			if err != nil {

				return err
			}

			member, err := rooms.MemberExists(match.RoomID, p.UserID)

			if err != nil {

				return err
			}

			connected = connected && member
			status := "disconnected"
			if connected {

				status = "connected"
			}

			update := p.ConnectionStatus != status
			p.ConnectionStatus = status
			inactive := p.Seat == previous.Actor && match.DecisionDeadlineAt != nil && now.After(*match.DecisionDeadlineAt)
			if p.ControllerKind == "human" && (!connected || inactive) {

				reason := "disconnect"
				if connected {

					reason = "inactivity"
				}

				p.ControllerKind = "cpu"
				p.ControlEpoch++
				p.ControllerChangedAt = now
				p.TakeoverReason = &reason
				update = true

			}

			if update {

				err = players.Update(p)

				if err != nil {

					return err
				}

				changed = true
			}

			if p.Seat == previous.Actor {

				actor = p
			}

		}

		eventType := "controller.changed"
		var commandID *uuid.UUID
		if actor != nil && actor.ControllerKind == "cpu" && now.Sub(match.UpdatedAt) >= 650*time.Millisecond {

			tick := max(match.ServerTick+1, now.Sub(match.StartedAt).Milliseconds()*60/1000)

			checkpoint, engineErr := game.Run(ctx, game.Input{Mode: "cpu", State: previous.Engine, Seat: actor.Seat, Tick: tick, ChoiceID: uuid.NewString(), Now: now.Format(time.RFC3339Nano)})

			jobs, err := repo.NewCPUJobRepoTx(ctx, tx)

			if err != nil {

				return err
			}

			jobID := uuid.New()

			cmd := uuid.New()

			commandID = &cmd
			job := &models.CPUJob{ID: jobID, MatchID: id, Seat: actor.Seat, ControlEpoch: actor.ControlEpoch, DecisionID: previous.ChoiceID, AIPolicyVersion: match.AIPolicyVersion, ExpectedStateVersion: match.StateVersion, CommandID: cmd, Status: "completed", DueTick: tick, Context: json.RawMessage(`{}`), Trace: json.RawMessage(`{"policy":"local-party-v1"}`), CreatedAt: now, UpdatedAt: now}
			if engineErr != nil {

				job.Status = "unresolved"
				job.Trace, _ = json.Marshal(map[string]string{"error": engineErr.Error()})

				match.Status = "paused_error"
				match.Phase = "paused_error"
				match.ErrorTrace = job.Trace
				eventType = "match.paused"
				commandID = nil

			} else {

				job.Trace = checkpoint.Trace
				expected := match.StateVersion
				match.ServerTick = tick
				err = assignCheckpoint(match, checkpoint, now)

				if err != nil {

					return err
				}

				commands, err := repo.NewMatchCommandRepoTx(ctx, tx)

				if err != nil {

					return err
				}

				payload, _ := json.Marshal(map[string]string{"choiceId": previous.ChoiceID, "optionId": "cpu-policy"})

				response, _ := json.Marshal(map[string]any{"stateVersion": match.StateVersion + 1, "eventSequence": match.LastEventSequence + 1})

				err = commands.Create(&models.MatchCommand{MatchID: id, CommandID: cmd, ActorSeat: actor.Seat, ActorUserID: actor.UserID, ControllerKind: "cpu", ControlEpoch: actor.ControlEpoch, RequestHash: auth.Hash(payload), ActionType: "choice.select", Payload: payload, ExpectedStateVersion: expected, ReceivedAt: now, AppliedTick: tick, Outcome: "accepted", ResultStateVersion: match.StateVersion + 1, LastEventSequence: match.LastEventSequence + 1, Response: response})

				if err != nil {

					return err
				}

				actor.DecisionSequence++
				err = players.Update(actor)

				if err != nil {

					return err
				}

				err = finishMatch(ctx, tx, match, checkpoint)

				if err != nil {

					return err
				}

				eventType = "state.changed"
				if match.Status == "completed" {

					eventType = "match.finished"
				}

			}

			err = jobs.Create(job)

			if err != nil {

				return err
			}

			changed = true

		}

		if !changed {

			return nil
		}

		match.StateVersion++
		match.LastEventSequence++
		match.UpdatedAt = now
		err = matches.Update(match)

		if err != nil {

			return err
		}

		return recordMatch(ctx, tx, match, eventType, commandID, nil)

	})

	return changed, err

}

func leavePlayingMatch(ctx context.Context, tx *sql.Tx, matchID, userID uuid.UUID) error {

	matches, err := repo.NewMatchRepoTx(ctx, tx)

	if err != nil {

		return err
	}

	match, err := matches.Lock(matchID)

	if err != nil {

		return err
	}

	players, err := repo.NewMatchPlayerRepoTx(ctx, tx)

	if err != nil {

		return err
	}

	player, err := players.ByUser(matchID, userID)

	if err != nil {

		return err
	}

	now := time.Now().UTC()

	reason := "disconnect"
	if player.ControllerKind != "cpu" {

		player.ControllerKind = "cpu"
		player.ControlEpoch++
	}

	player.ConnectionStatus = "disconnected"
	player.TakeoverReason = &reason
	player.ControllerChangedAt = now
	player.ReclaimRequestedAt = nil
	err = players.Update(player)

	if err != nil {

		return err
	}

	match.StateVersion++
	match.LastEventSequence++
	match.UpdatedAt = now
	err = matches.Update(match)

	if err != nil {

		return err
	}

	return recordMatch(ctx, tx, match, "controller.changed", nil, &player.Seat)

}

func markMatchError(span trace.Span, err *error) {

	if *err == nil {

		return
	}

	var input *internal.InputError
	if !errors.As(*err, &input) {

		span.SetStatus(codes.Error, "match operation failed")
	}
}
