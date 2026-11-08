package testcase

import (
	"context"
	"encoding/json"
	"github.com/google/uuid"
	"narutoserver/internal"
	"narutoserver/repo"
	"narutoserver/usecase"
	"testing"
	"time"
)

func matchLifecycle(t *testing.T) {

	ctx0, _, _ := account(t, 10)

	ctx1, _, _ := account(t, 11)

	outsider, _, _ := account(t, 12)

	contexts := []context.Context{ctx0, ctx1}
	principals := make([]internal.Principal, 2)

	connections, err := repo.NewRealtimeConnectionRepo(ctx0)

	fail(t, err)

	connectionIDs := make([]uuid.UUID, 2)

	for i, ctx := range contexts {

		principals[i], err = internal.CurrentPrincipal(ctx)

		fail(t, err)

		conn, err := connections.Connect(principals[i].SessionID)

		fail(t, err)

		connectionIDs[i] = conn.ID

	}

	capacity := int16(2)

	target := int32(3000)

	voice := false
	rooms, err := usecase.NewRoomUseCase(ctx0)

	fail(t, err)

	created, err := rooms.CreateRoom(internal.ParamCreateRoom{Name: "Match lifecycle", Visibility: "public", Settings: &internal.RoomSettingsInput{ArenaID: "arena-1", Capacity: &capacity, TargetChakra: &target, Rule: "normal", VoiceEnabled: &voice}, IdempotencyKey: uuid.New()})

	fail(t, err)

	guest, err := usecase.NewRoomUseCase(ctx1)

	fail(t, err)

	_, err = guest.JoinRoom(internal.ParamJoinRoom{RoomID: created.Room.ID, IdempotencyKey: uuid.New()})

	fail(t, err)

	arenaRepo, err := repo.NewArenaRepo(ctx0)

	fail(t, err)

	arena, err := arenaRepo.GetByID("arena-1")

	fail(t, err)

	lobby := make([]internal.RealtimeUseCase, 2)

	for i, ctx := range contexts {

		lobby[i], err = usecase.NewRealtimeUseCase(ctx)

		fail(t, err)

	}

	readyAndStart := func() uuid.UUID {

		for i := range contexts {

			current, err := rooms.GetRoom(internal.ParamGetRoom{RoomID: created.Room.ID})

			fail(t, err)

			_, err = lobby[i].ExecuteLobby(internal.ParamLobbyCommand{RequestID: uuid.New(), ConnectionID: connectionIDs[i], Type: "room.ready", RoomID: created.Room.ID, ExpectedRoomVersion: current.RoomVersion, Ready: true, AssetsReady: true, AssetManifestHash: arena.AssetManifestHash, CharacterID: int16(i)})

			fail(t, err)

		}

		current, err := rooms.GetRoom(internal.ParamGetRoom{RoomID: created.Room.ID})

		fail(t, err)

		_, err = lobby[0].ExecuteLobby(internal.ParamLobbyCommand{RequestID: uuid.New(), ConnectionID: connectionIDs[0], Type: "room.start", RoomID: created.Room.ID, ExpectedRoomVersion: current.RoomVersion})

		fail(t, err)

		current, err = rooms.GetRoom(internal.ParamGetRoom{RoomID: created.Room.ID})

		fail(t, err)

		if current.ActiveMatchID == nil {

			t.Fatal("start did not create a match")
		}

		return *current.ActiveMatchID

	}
	id := readyAndStart()

	services := make([]internal.MatchUseCase, 2)

	for i, ctx := range contexts {

		services[i], err = usecase.NewMatchUseCase(ctx)

		fail(t, err)
	}

	snapshot := func(seat int) internal.PublicMatchSnapshot {

		data, err := services[seat].GetMatch(internal.ParamGetMatch{MatchID: id})

		fail(t, err)

		var value internal.PublicMatchSnapshot
		err = json.Unmarshal(data.Snapshot, &value)

		fail(t, err)

		return value

	}
	command := func(seat int, option string) internal.ParamExecuteMatch {

		state := snapshot(seat)

		if len(state.AllowedActions) == 0 {

			t.Fatal("no offered action for actor")
		}

		payload, err := json.Marshal(map[string]string{"choiceId": *state.AllowedActions[0].ChoiceID, "optionId": option})

		fail(t, err)

		fixture := usecase.MockMatchCommand
		fixture.MatchID = id
		fixture.CommandID = uuid.New()

		fixture.ExpectedStateVersion = state.StateVersion
		fixture.ControlEpoch = state.Players[seat].Controller.ControlEpoch
		fixture.Action.Payload = payload
		return internal.ParamExecuteMatch{RequestExecuteMatch: fixture, RequestID: uuid.New(), ConnectionID: connectionIDs[seat]}

	}
	stranger, err := usecase.NewMatchUseCase(outsider)

	fail(t, err)

	_, err = stranger.GetMatch(internal.ParamGetMatch{MatchID: id})

	expect(t, err, "NOT_FOUND")

	initial := snapshot(0)

	if initial.Status != "playing" || len(initial.Players) != 2 || len(initial.Tiles) != 22 {

		t.Fatal("invalid public projection")
	}

	request := command(0, "roll")

	ack, err := services[0].ExecuteMatch(request)

	fail(t, err)

	retry := request
	retry.RequestID = uuid.New()

	duplicated, err := services[0].ExecuteMatch(retry)

	fail(t, err)

	if !duplicated.Duplicate || duplicated.StateVersion != ack.StateVersion {

		t.Fatal("commandId replay applied twice")
	}

	stale := request
	stale.RequestID = uuid.New()

	stale.CommandID = uuid.New()

	_, err = services[0].ExecuteMatch(stale)

	expect(t, err, "VERSION_CONFLICT")

	forged := request
	forged.RequestID = uuid.New()

	forged.Action.Payload = json.RawMessage(`{"choiceId":"00000000-0000-4000-8000-000000000103","optionId":"surrender"}`)

	_, err = services[0].ExecuteMatch(forged)

	expect(t, err, "IDEMPOTENCY_CONFLICT")

	wrongActor := command(0, "stop")

	wrongActor.ConnectionID = connectionIDs[1]
	_, err = services[1].ExecuteMatch(wrongActor)

	expect(t, err, "INVALID_ACTION")

	err = connections.Disconnect(connectionIDs[0])

	fail(t, err)

	_, err = services[0].AdvanceMatches(internal.ParamAdvanceMatches{})

	fail(t, err)

	controlled := snapshot(0)

	if controlled.Players[0].Controller.ControllerKind != "cpu" || controlled.Players[0].Controller.ParticipantKind != "human" || len(controlled.AllowedActions) != 0 {

		t.Fatal("disconnect did not fence the human controller")
	}

	matches, err := repo.NewMatchRepo(ctx0)

	fail(t, err)

	row, err := matches.GetByID(id)

	fail(t, err)

	before := row.StateVersion
	// The database trigger owns updated_at. Wait for the production CPU decision cadence.
	time.Sleep(700 * time.Millisecond)

	_, err = services[0].AdvanceMatches(internal.ParamAdvanceMatches{})

	fail(t, err)

	row, err = matches.GetByID(id)

	fail(t, err)

	if row.StateVersion <= before || row.Status != "running" {

		t.Fatal("CPU failed to continue the live roulette")
	}

	conn, err := connections.Connect(principals[0].SessionID)

	fail(t, err)

	oldConnection := connectionIDs[0]
	connectionIDs[0] = conn.ID
	controlled = snapshot(0)

	reclaim := usecase.MockReclaimMatch
	reclaim.MatchID = id
	reclaim.ExpectedControlEpoch = controlled.Players[0].Controller.ControlEpoch
	_, err = services[0].ReclaimMatch(internal.ParamReclaimMatch{RequestReclaimMatch: reclaim, RequestID: uuid.New(), ConnectionID: connectionIDs[0]})

	fail(t, err)

	after := snapshot(0)

	if after.Players[0].Controller.ControlEpoch != reclaim.ExpectedControlEpoch+1 || after.Players[0].Controller.ControllerKind != "human" {

		t.Fatal("reclaim did not advance epoch")
	}

	fenced := command(0, after.AllowedActions[0].Options[0].Id)

	fenced.ControlEpoch = reclaim.ExpectedControlEpoch
	_, err = services[0].ExecuteMatch(fenced)

	expect(t, err, "STALE_CONTROL_EPOCH")

	fenced.ControlEpoch++
	fenced.ConnectionID = oldConnection
	fenced.RequestID = uuid.New()

	_, err = services[0].ExecuteMatch(fenced)

	expect(t, err, "UNAUTHENTICATED")

	// Complete real turns until a surrender menu is offered, including chance/land resolution.
	for step := 0; step < 60; step++ {

		state := snapshot(0)

		actor := int(state.Presentation.ActorSeat)

		current := snapshot(actor)

		option := current.AllowedActions[0].Options[0].Id
		for _, o := range current.AllowedActions[0].Options {

			if o.Id == "surrender" || o.Id == "surrender:yes" {

				option = o.Id
				break
			}
		}

		_, err = services[actor].ExecuteMatch(command(actor, option))

		fail(t, err)

		if snapshot(0).Result != nil {

			break
		}

	}

	finished := snapshot(0)

	if finished.Status != "finished" || finished.Result == nil || finished.Result.Reason != "surrender" {

		t.Fatal("match did not finish")
	}

	second := readyAndStart()

	if second == id {

		t.Fatal("rematch reused match identity")
	}

	// Leaving a running match preserves its CPU seats, including when the room becomes empty.
	for i := range contexts {

		current, err := rooms.GetRoom(internal.ParamGetRoom{RoomID: created.Room.ID})

		if i == 1 {

			current, err = guest.GetRoom(internal.ParamGetRoom{RoomID: created.Room.ID})
		}

		fail(t, err)

		_, err = lobby[i].ExecuteLobby(internal.ParamLobbyCommand{Type: "room.leave", RequestID: uuid.New(), ConnectionID: connectionIDs[i], RoomID: created.Room.ID, ExpectedRoomVersion: current.RoomVersion})

		fail(t, err)

	}

	row, err = matches.GetByID(second)

	fail(t, err)

	if row.Status != "running" {

		t.Fatal("all users leaving must not terminate the game")
	}

}
