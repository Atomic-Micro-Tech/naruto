import test from "node:test";
import assert from "node:assert/strict";
import { execute, options } from "../../server/internal/game/source/online.js";

const choiceId = "00000000-0000-4000-8000-000000000001";
const now = "2026-11-09T00:00:00Z";

test("chance artwork IDs are offered only to the deciding player", () => {
  const state = initial().engine;
  state.phase = "chance";
  const result = execute({ state, tick: 0, choiceId, now });
  assert.deepEqual(
    result.allowedBySeat[0][0].options.map((o) => o.cardId),
    state.decks[0].slice(0, 3),
  );
  assert.deepEqual(result.allowedBySeat[1], []);
  assert.equal(JSON.stringify(result.public).includes('"cardId"'), false);
});

test("passing chance exposes only three slot choices, including after reconnect", () => {
  const state = initial().engine;
  state.phase = "chance";
  state.players[0].pos = 5;
  state.remaining = 2;
  state.decks[0].splice(0, 3, 0, 1, 2);
  for (const checkpoint of [state, JSON.parse(JSON.stringify(state))]) {
    const result = execute({ state: checkpoint, tick: 0, choiceId, now });
    assert.deepEqual(result.allowedBySeat[0][0].options, [0, 1, 2].map(i => ({
      id: `chance:${i}`, label: `Kartu tertutup ${i + 1}`, enabled: true,
    })));
    assert.deepEqual(result.allowedBySeat[1], []);
    assert.equal(JSON.stringify(result.public).includes('"cardId"'), false);
  }
  const chakra = state.players[0].chakra;
  const result = execute({ mode: "command", state, seat: 0, option: "chance:1", tick: 1, choiceId, now });
  assert.equal(result.engine.lastEvent.cardId, 1);
  assert.equal(result.public.players[0].chakra, chakra + 150);
  assert.equal(result.public.presentation.remaining, 2);
  assert.equal(result.public.presentation.phase, "move");
});

test("invalid hidden-card slot cannot consume a card or advance movement", () => {
  const state = initial().engine;
  state.phase = "chance";
  state.remaining = 2;
  const before = JSON.stringify(state);
  assert.throws(() => execute({ mode: "command", state, seat: 0, option: "chance:3", tick: 1, choiceId, now }), /Illegal action/);
  assert.equal(JSON.stringify(state), before);
});
function initial(seed = 42, count = 2, target = 3000) {
  return execute({
    seed,
    roster: Array.from({ length: count }, (_, i) => ({
      characterId: i,
      name: `Player ${i}`,
    })),
    target,
    tick: 0,
    choiceId,
    now,
  });
}

test("36 complete Party matches, 2–4 participants, preserve human identity during CPU control", () => {
  for (const count of [2, 3, 4])
    for (let seed = 1; seed <= 12; seed++) {
      let checkpoint = initial(seed, count),
        steps = 0;
      while (!checkpoint.public.result && steps < 5000) {
        const restored = JSON.parse(JSON.stringify(checkpoint.engine));
        checkpoint = execute({
          mode: "cpu",
          state: restored,
          tick: ++steps * 60,
          choiceId,
          now,
        });
        assert.equal(checkpoint.public.players.length, count);
        assert.ok(checkpoint.engine.players.every((p) => p.human));
        assert.ok(
          checkpoint.public.players.every(
            (p) =>
              p.chakra >= -9999 &&
              p.chakra <= 99999 &&
              p.skillPoints >= 0 &&
              p.skillPoints <= 8,
          ),
        );
        for (let seat = 0; seat < count; seat++)
          if (seat !== checkpoint.actor)
            assert.deepEqual(checkpoint.allowedBySeat[seat], []);
        // Includes conservative room/player metadata overhead for the 16 KiB WS envelope.
        const projection = {
          ...checkpoint.public,
          self: checkpoint.privateBySeat[checkpoint.actor],
          allowedActions: checkpoint.allowedBySeat[checkpoint.actor],
        };
        assert.ok(Buffer.byteLength(JSON.stringify(projection)) + 2500 < 16384);
      }
      assert.ok(
        checkpoint.public.result,
        `seed ${seed}, count ${count} stalled at ${checkpoint.engine.phase}`,
      );
      assert.equal(checkpoint.public.result.reason, "source_victory");
      assert.ok(checkpoint.public.result.entries.some((p) => p.chakra >= 3000));
      assert.ok(checkpoint.rngDrawCount > 408);
    }
});

test("restart/replay is deterministic and private state stays out of projection", () => {
  const first = initial();
  const input = { mode: "cpu", tick: 60, choiceId, now };
  const a = execute({ ...input, state: structuredClone(first.engine) }),
    b = execute({ ...input, state: structuredClone(first.engine) });
  assert.deepEqual(a, b);
  assert.equal(a.public.seed, undefined);
  assert.equal(a.public.decks, undefined);
  assert.equal(a.public.players[1].inventory, undefined);
  assert.throws(
    () =>
      execute({
        mode: "command",
        state: structuredClone(first.engine),
        seat: 1,
        option: "roll",
        choiceId,
        tick: 1,
        now,
      }),
    /Illegal action/,
  );
  assert.throws(
    () =>
      execute({
        mode: "command",
        state: structuredClone(first.engine),
        seat: 0,
        option: "move:999",
        choiceId,
        tick: 1,
        now,
      }),
    /Illegal action/,
  );
});

test("Party surrender preserves original ordering and requires an explicit confirmation", () => {
  const initialState = initial();
  const request = execute({
    mode: "command",
    state: initialState.engine,
    seat: 0,
    option: "surrender",
    tick: 1,
    choiceId,
    now,
  });
  assert.equal(request.public.result, null);
  assert.deepEqual(
    options(request.engine).map((o) => o.id),
    ["surrender:yes", "surrender:no"],
  );
  const cancel = execute({
    mode: "command",
    state: structuredClone(request.engine),
    seat: 0,
    option: "surrender:no",
    tick: 2,
    choiceId,
    now,
  });
  assert.equal(cancel.public.result, null);
  const done = execute({
    mode: "command",
    state: request.engine,
    seat: 0,
    option: "surrender:yes",
    tick: 2,
    choiceId,
    now,
  });
  assert.equal(done.public.result.reason, "surrender");
  assert.equal(done.public.result.winnerSeat, null);
  assert.equal(done.public.result.entries.at(-1).seat, 0);
  assert.equal(done.public.result.entries.at(-1).badgeId, 3);
});

test("teleport inventory card is consumed and Party target zero is accepted", () => {
  const checkpoint = initial(42, 2, 0);
  assert.equal(checkpoint.public.targetChakra, 0);
  const state = checkpoint.engine;
  state.players[0].inventory = [19, 255, 255];
  let next = execute({
    mode: "command",
    state,
    seat: 0,
    option: "card:0",
    tick: 1,
    choiceId,
    now,
  });
  const option = options(next.engine).find(
    (o) => o.enabled && o.id.startsWith("target:"),
  );
  assert.ok(option);
  next = execute({
    mode: "command",
    state: next.engine,
    seat: 0,
    option: option.id,
    tick: 2,
    choiceId,
    now,
  });
  assert.equal(next.engine.players[0].inventory.includes(19), false);
  assert.equal(next.engine.cardUsed, true);
});
