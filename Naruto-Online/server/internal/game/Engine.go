package game

import (
	"context"
	_ "embed"
	"encoding/json"
	"errors"
	"github.com/dop251/goja"
	"narutoserver/internal"
	"sync"
	"time"
)

//go:embed Rules.js
var source string
var once sync.Once
var program *goja.Program
var compileError error

type Player struct {
	CharacterID int16  `json:"characterId"`
	Name        string `json:"name"`
}
type Input struct {
	Mode     string          `json:"mode"`
	State    json.RawMessage `json:"state,omitempty"`
	Roster   []Player        `json:"roster,omitempty"`
	Seed     int64           `json:"seed"`
	Target   int32           `json:"target"`
	Seat     int16           `json:"seat"`
	Option   string          `json:"option"`
	ChoiceID string          `json:"choiceId"`
	Tick     int64           `json:"tick"`
	Now      string          `json:"now"`
}
type Checkpoint struct {
	Trace         json.RawMessage                           `json:"trace"`
	Engine        json.RawMessage                           `json:"engine"`
	Actor         int16                                     `json:"actor"`
	Seed          int64                                     `json:"seed"`
	RNGDrawCount  int64                                     `json:"rngDrawCount"`
	ChoiceID      string                                    `json:"choiceId"`
	Public        internal.PublicMatchSnapshot              `json:"public"`
	PrivateBySeat map[string]internal.PublicSelfState       `json:"privateBySeat"`
	AllowedBySeat map[string][]internal.PublicAllowedAction `json:"allowedBySeat"`
}

func Prepare() error {

	once.Do(func() {

		program, compileError = goja.Compile("Rules.js", source, false)
	})

	return compileError

}

// Each evaluation has its own VM: no shared mutable RNG or player state.
func Run(ctx context.Context, input Input) (*Checkpoint, error) {

	if ctx == nil {

		return nil, errors.New("engine context is required")
	}

	err := ctx.Err()

	if err != nil {

		return nil, err
	}

	err = Prepare()

	if err != nil {

		return nil, err
	}

	vm := goja.New()

	limit, cancel := context.WithTimeout(ctx, 3*time.Second)

	defer cancel()

	stop := context.AfterFunc(limit, func() {

		vm.Interrupt(limit.Err())
	})

	defer stop()

	_, err = vm.RunProgram(program)

	if err != nil {

		return nil, err
	}

	function, ok := goja.AssertFunction(vm.Get("NarutoEngine").ToObject(vm).Get("run"))

	if !ok {

		return nil, errors.New("engine export missing")
	}

	encoded, err := json.Marshal(input)

	if err != nil {

		return nil, err
	}

	value, err := function(goja.Undefined(), vm.ToValue(string(encoded)))

	if err != nil {

		return nil, err
	}

	var result Checkpoint
	err = json.Unmarshal([]byte(value.String()), &result)

	if err != nil {

		return nil, err
	}

	return &result, nil

}
