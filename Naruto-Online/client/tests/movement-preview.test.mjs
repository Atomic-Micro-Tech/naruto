import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { movementPreview } from "../src/movement-preview.js";
import { story1MovementPreview } from "../../../research/story1-route.mjs";
const tiles = JSON.parse(readFileSync(new URL("../../assets/image/arena1/map_00.json", import.meta.url))).tiles;
const snapshot = (position, remaining) => ({
  status: "playing", roulette: null,
  presentation: { phase: "move", actorSeat: 0, remaining },
  players: [{ seat: 0, position }],
  tiles: tiles.map(t => ({ ...t, neighbors: t.neighborSlots.map(n => n === 255 ? null : n) })),
  allowedActions: [{ options: tiles[position].neighbors.map(tileId => ({ id: `move:${tileId}`, tileId, enabled: true })) }],
});
test("landing preview matches recovered arena 1 rules for all tiles and 1–12 remaining steps", () => {
  for (let position = 0; position < 22; position++) for (let steps = 1; steps <= 12; steps++) {
    const result = movementPreview(snapshot(position, steps));
    const original = story1MovementPreview(tiles, position, steps);
    assert.deepEqual(result.map(r => r.destinations), original.map(r => [r.tile]));
  }
});
test("two-step preview marks the final tiles, updates after moving, and respects offered routes", () => {
  assert.deepEqual(movementPreview(snapshot(0, 2)).map(r => r.destinations), [[2], [20]]);
  const state = snapshot(1, 1);
  state.allowedActions[0].options = [{ id: "move:2", tileId: 2, enabled: true }];
  assert.deepEqual(movementPreview(state).map(r => r.destinations), [[2]]);
  state.allowedActions[0].options[0].enabled = false;
  assert.deepEqual(movementPreview(state), []);
  for (const phase of ["roll", "chance", "land", "end"])
    assert.deepEqual(movementPreview({ ...snapshot(0, 2), presentation: { phase, remaining: 2, actorSeat: 0 } }), []);
  assert.deepEqual(movementPreview({ ...snapshot(0, 2), roulette: {} }), []);
  assert.deepEqual(movementPreview(snapshot(0, 0)), []);
});
