package usecase

import "narutoserver/internal"
import "encoding/json"
import "github.com/google/uuid"

var MockMatchCommand = internal.RequestExecuteMatch{
	CommandID:            uuid.MustParse("00000000-0000-4000-8000-000000000101"),
	MatchID:              uuid.MustParse("00000000-0000-4000-8000-000000000102"),
	ExpectedStateVersion: 1,
	Action:               internal.MatchAction{Type: "choice.select", Payload: json.RawMessage(`{"choiceId":"00000000-0000-4000-8000-000000000103","optionId":"roll"}`)},
}
var MockReclaimMatch = internal.RequestReclaimMatch{MatchID: MockMatchCommand.MatchID, ExpectedControlEpoch: 1}

// Synthetic contract fixtures used only by direct use-case tests.
var MockRegisterRequest = internal.ParamRegisterEmail{Email: "tester@example.test", Password: "SyntheticPassword!123", DisplayName: "Tester"}
var MockRoomName = "Arena 1 test room"

func MockProjectionCheckpoint() json.RawMessage {

	players := []internal.PublicPlayerState{{Seat: 0}, {Seat: 1}}
	tiles := make([]internal.PublicTileState, 22)

	for i := range tiles {

		tiles[i].Id = int64(i)

		tiles[i].Neighbors = make([]*int64, 4)

		tiles[i].Rents = []int64{0, 0, 0}

	}

	public := internal.PublicMatchSnapshot{Players: players, Tiles: tiles}
	value, _ := json.Marshal(map[string]any{"public": public, "privateBySeat": map[string]any{"0": internal.PublicSelfState{Seat: 0, Cards: []internal.PublicHeldCard{{Slot: 0, CardID: 1}}}, "1": internal.PublicSelfState{Seat: 1, Cards: []internal.PublicHeldCard{{Slot: 0, CardID: 99}}}}, "allowedBySeat": map[string]any{}, "rng": "PRIVATE_ENGINE_SECRET", "nativeAI": "PRIVATE_AI_SECRET"})

	return value

}
