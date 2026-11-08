import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { purchasedTiles, sealFrame } from '../src/seal.js';

const data = JSON.parse(readFileSync(new URL('../../assets/sprite/effects/seal.json', import.meta.url)));
const before = { id: 'match', status: 'playing', stateVersion: 1,
  tiles: [{ id: 2, typeCode: 4, ownerSeat: null, level: 0 }],
  players: [{ seat: 0, position: 2 }] };
const after = { ...before, stateVersion: 2,
  tiles: [{ ...before.tiles[0], typeCode: 5, ownerSeat: 0, level: 1 }] };

test('seal only follows a new authoritative purchase, never initial/repeated snapshots', () => {
  assert.deepEqual(purchasedTiles(before, after), after.tiles);
  assert.deepEqual(purchasedTiles(null, after), []);
  assert.deepEqual(purchasedTiles(after, after), []);
  assert.deepEqual(purchasedTiles(before, { ...after, stateVersion: 1 }), []);
  assert.deepEqual(purchasedTiles(before, { ...after, id: 'other' }), []);
  assert.deepEqual(purchasedTiles(before, { ...before, stateVersion: 2 }), []);
  assert.deepEqual(purchasedTiles(after, { ...after, stateVersion: 3 }), []);
  assert.deepEqual(purchasedTiles(after, { ...after, stateVersion: 3,
    tiles: [{ ...after.tiles[0], level: 2 }] }), []);
});

test('native sequence reveals at cursor 39, ends once, and tolerates a suspended tab', () => {
  assert.equal(data.sequence.length, 51);
  assert.ok(data.sequence.every(s => s.duration === 1));
  assert.equal(sealFrame(data, 1299).revealed, false);
  assert.equal(sealFrame(data, 1300).revealed, true);
  assert.equal(sealFrame(data, 1699).done, false);
  assert.equal(sealFrame(data, 1700).done, true);
  assert.equal(sealFrame(data, 60000).done, true);
  for (const frame of data.frames) for (const sprite of frame) {
    assert.ok(sprite.u + sprite.width <= 256 && sprite.v + sprite.height <= 256);
  }
});
