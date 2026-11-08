package testcase

import (
	"context"
	"database/sql"
	"encoding/json"
	"github.com/google/uuid"
	"narutoserver/internal"
	"narutoserver/internal/auth"
	"narutoserver/models"
	"narutoserver/repo"
	"narutoserver/usecase"
	"strings"
	"testing"
	"time"
)

func projectionPrivacy(t *testing.T, roomID uuid.UUID, host, guest, outsider context.Context) {

	t.Helper()

	now := time.Now().UTC()

	hash := strings.Repeat("a", 64)

	match := models.NewMatch()

	match.ID = uuid.New()

	match.RoomID = roomID
	match.ArenaID = "arena-1"
	match.Status = "aborted"
	match.ParticipantCount = 2
	match.TargetChakra = 3000
	match.Rule = "normal"
	match.SettingsSnapshot = []byte("{}")

	match.RulesHash = hash
	match.AIRulesHash = hash
	match.BoardDataHash = hash
	match.AssetsHash = hash
	match.EngineVersion = "synthetic-test"
	match.AIPolicyVersion = "synthetic-test"
	match.StateSchemaVersion = 1
	match.StateVersion = 7
	match.Phase = "pre_move"
	match.RoundNumber = 1
	match.State = usecase.MockProjectionCheckpoint()

	match.StateHash = auth.Hash(match.State)

	match.CreatedAt = now
	match.StartedAt = now
	match.EndedAt = &now
	match.UpdatedAt = now
	err := repo.WithinTransaction(host, func(tx *sql.Tx) error {

		matches, err := repo.NewMatchRepoTx(host, tx)

		if err != nil {

			return err
		}

		err = matches.Create(match)

		if err != nil {

			return err
		}

		players, err := repo.NewMatchPlayerRepoTx(host, tx)

		if err != nil {

			return err
		}

		for i, ctx := range []context.Context{host, guest} {

			p, err := internal.CurrentPrincipal(ctx)

			if err != nil {

				return err
			}

			player := models.NewMatchPlayer()

			player.MatchID = match.ID
			player.Seat = int16(i)

			player.ParticipantCount = 2
			player.UserID = p.UserID
			player.DisplayNameSnapshot = "Synthetic"
			player.CharacterID = int16(i)

			player.ParticipantKind = "human"
			player.ControllerKind = "human"
			player.ConnectionStatus = "connected"
			player.ControllerChangedAt = now
			player.PolicyState = []byte("{}")

			err = players.Create(player)

			if err != nil {

				return err
			}
		}

		return nil
	})

	fail(t, err)

	service, err := usecase.NewMatchUseCase(host)

	fail(t, err)

	data, err := service.GetMatch(internal.ParamGetMatch{MatchID: match.ID})

	fail(t, err)

	raw := string(data.Snapshot)

	if strings.Contains(raw, "PRIVATE_") || strings.Contains(raw, "privateBySeat") || strings.Contains(raw, `"cardId":99`) {

		t.Fatal("private match state leaked")
	}

	var projected internal.PublicMatchSnapshot
	err = json.Unmarshal(data.Snapshot, &projected)

	fail(t, err)

	if projected.StateVersion != 7 || len(projected.Self.Cards) != 1 || projected.Self.Cards[0].CardID != 1 {

		t.Fatal("wrong viewer projection")
	}

	visitor, err := usecase.NewMatchUseCase(outsider)

	fail(t, err)

	_, err = visitor.GetMatch(internal.ParamGetMatch{MatchID: match.ID})

	expect(t, err, "NOT_FOUND")
}
