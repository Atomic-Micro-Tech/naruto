import { test } from "node:test";
import assert from "node:assert/strict";
import { automaticAction, directionLabel } from "../src/presentation.js";
const snapshot = {
  id: "synthetic",
  status: "playing",
  self: { seat: 0 },
  players: [{ seat: 0, position: 0, controller: { controllerKind: "human" } }],
  presentation: { phase: "move", actorSeat: 0 },
  tiles: [
    { x: 0, y: 0 },
    { x: 40, y: 0 },
    { x: 0, y: 40 },
  ],
  allowedActions: [{ options: [{ id: "move:1", tileId: 1, enabled: true }] }],
};
test("automatic movement only advances a sole legal step belonging to this human", () => {
  assert.equal(automaticAction(snapshot), "move:1");
  assert.equal(
    automaticAction({
      ...snapshot,
      allowedActions: [
        {
          options: [
            ...snapshot.allowedActions[0].options,
            { id: "move:2", tileId: 2, enabled: true },
          ],
        },
      ],
    }),
    null,
  );
  assert.equal(
    automaticAction({
      ...snapshot,
      players: [
        { ...snapshot.players[0], controller: { controllerKind: "cpu" } },
      ],
    }),
    null,
  );
  assert.equal(
    automaticAction({
      ...snapshot,
      presentation: { phase: "move", actorSeat: 1 },
    }),
    null,
  );
  assert.equal(automaticAction({ ...snapshot, roulette: {} }), null);
  assert.equal(automaticAction({ ...snapshot, status: "finished" }), null);
});
test("financial/card/roulette decisions are never selected automatically", () => {
  for (const [phase, id] of [
    ["land", "act:claim"],
    ["chance", "chance:0"],
    ["roll", "roll"],
    ["roll", "surrender:yes"],
    ["defend", "tech:0"],
  ]) {
    assert.equal(
      automaticAction({
        ...snapshot,
        presentation: { phase, actorSeat: 0 },
        allowedActions: [{ options: [{ id, enabled: true }] }],
      }),
      null,
    );
  }
  assert.equal(
    automaticAction({
      ...snapshot,
      presentation: { phase: "end", actorSeat: 0 },
      allowedActions: [{ options: [{ id: "end", enabled: true }] }],
    }),
    "end",
  );
});
test("direction labels use board coordinates, not tile ordering", () => {
  assert.equal(
    directionLabel(snapshot, { id: "move:1", tileId: 1 }),
    "→ Kanan",
  );
  assert.equal(
    directionLabel(snapshot, { id: "move:2", tileId: 2 }),
    "↓ Bawah",
  );
});
