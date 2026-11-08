import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createActorMotion, setActorDestination, stepActorMotion,
  remainingWalkMS, walkAnimation, advanceSpriteSequence } from "../src/actor-motion.js";

const metadata = JSON.parse(readFileSync(new URL("../../assets/sprite/board-characters/characters.json", import.meta.url)));
const directions = metadata.characters[0].directions;
const tiles = [
  { id: 0, x: 0, y: 0, neighbors: [1, 3] },
  { id: 1, x: 48, y: 0, neighbors: [0, 2] },
  { id: 2, x: 48, y: 48, neighbors: [1, 3] },
  { id: 3, x: 0, y: 48, neighbors: [0, 2] },
];

test("native walking assets exist for all four characters and destination directions", () => {
  for (const character of metadata.characters.slice(0, 4)) {
    for (const [destination, expected] of [[{ x: 0, y: -1 }, 9], [{ x: 0, y: 1 }, 10],
      [{ x: -1, y: 0 }, 11], [{ x: 1, y: 0 }, 12], [{ x: 1, y: 1 }, 12]]) {
      const id = walkAnimation({ x: 0, y: 0 }, destination, character.directions);
      assert.equal(id, expected);
      const animation = character.animations.find(a => a.id === id);
      const png = readFileSync(new URL(`../../assets/sprite/board-characters/${animation.sprite}`, import.meta.url));
      assert.equal(png.subarray(1, 4).toString(), "PNG");
      assert.ok(new Set(animation.sequence.map(s => s.frame)).size > 1);
    }
  }
});

test("rapid CPU snapshots retain each observed segment and do not cut a corner", () => {
  const motion = createActorMotion(tiles[0]);
  setActorDestination(motion, tiles[1], tiles, directions, true);
  stepActorMotion(motion, 50);
  const elapsed = motion.segments[0].elapsed;
  setActorDestination(motion, tiles[1], tiles, directions, true);
  assert.equal(motion.segments[0].elapsed, elapsed);
  setActorDestination(motion, tiles[2], tiles, directions, true);
  assert.equal(motion.segments.length, 2);
  stepActorMotion(motion, 50);
  assert.equal(motion.y, 0);
  assert.ok(motion.x > 0 && motion.x < 48);
  stepActorMotion(motion, 50);
  assert.equal(motion.x, 48);
  assert.ok(motion.y > 0 && motion.y < 48);
  stepActorMotion(motion, 1000);
  assert.deepEqual([motion.x, motion.y, motion.tile], [48, 48, 2]);
  assert.equal(remainingWalkMS(motion), 0);
});

test("warp, initial snapshot and repeated destination do not fabricate a walking path", () => {
  const motion = createActorMotion(tiles[0]);
  setActorDestination(motion, tiles[0], tiles, directions);
  assert.equal(motion.segments.length, 0);
  setActorDestination(motion, tiles[2], tiles, directions);
  assert.deepEqual([motion.x, motion.y, motion.tile], [48, 48, 2]);
  assert.equal(motion.segments.length, 0);
});

test("source frame cadence remains identical at 15, 30, 60 and 120 browser FPS", () => {
  for (const character of metadata.characters.slice(0, 4)) {
    for (const animation of character.animations.filter(a => [9, 10, 11, 12].includes(a.id))) {
      const results = [15, 30, 60, 120].map(fps => {
        const actor = { frame: 0, counter: 0, animationClock: 0 };
        for (let i = 0; i < fps; i++) advanceSpriteSequence(actor, animation.sequence, 1000 / fps);
        return [actor.frame, actor.counter];
      });
      for (const result of results) assert.deepEqual(result, results[0]);
    }
  }
});
