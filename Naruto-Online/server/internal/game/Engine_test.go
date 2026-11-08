package game

import (
	"context"
	"encoding/json"
	"testing"
	"time"
)

func TestEmbeddedEngineExecutesAndPreservesPrivateCheckpoint(t *testing.T) {

	input := Input{Mode: "init", Roster: []Player{{CharacterID: 0, Name: "Test Naruto"}, {CharacterID: 2, Name: "Test Sakura"}}, Seed: 42, Target: 3000, ChoiceID: "00000000-0000-4000-8000-000000000001", Now: time.Now().UTC().Format(time.RFC3339Nano)}
	checkpoint, err := Run(context.Background(), input)

	if err != nil {

		t.Fatal(err)
	}

	if len(checkpoint.Public.Tiles) != 22 || len(checkpoint.Public.Players) != 2 || checkpoint.Public.Players[0].Chakra != 1500 || checkpoint.RNGDrawCount == 0 {

		t.Fatal("incorrect initial Party state")
	}

	input.Mode = "command"
	input.State = checkpoint.Engine
	input.Option = "roll"
	input.Tick = 1
	checkpoint, err = Run(context.Background(), input)

	if err != nil {

		t.Fatal(err)
	}

	if checkpoint.Public.Roulette == nil {

		t.Fatal("roulette was not started")
	}

	input.State = checkpoint.Engine
	input.Option = "stop"
	input.Tick = 60
	checkpoint, err = Run(context.Background(), input)

	if err != nil {

		t.Fatal(err)
	}

	if checkpoint.Public.Roulette != nil || checkpoint.Public.Presentation.Remaining < 1 {

		t.Fatal("roulette did not settle")
	}

	var engine map[string]any
	err = json.Unmarshal(checkpoint.Engine, &engine)

	if err != nil {

		t.Fatal(err)
	}

	if engine["seed"] == nil || engine["decks"] == nil {

		t.Fatal("server checkpoint lost private RNG/decks")
	}

}

func TestEngineCancellation(t *testing.T) {

	ctx, cancel := context.WithCancel(context.Background())

	cancel()

	_, err := Run(ctx, Input{Mode: "init", Roster: []Player{{Name: "A"}, {CharacterID: 1, Name: "B"}}, Seed: 1, Target: 3000})

	if err == nil {

		t.Fatal("cancelled computation should fail")
	}

}
