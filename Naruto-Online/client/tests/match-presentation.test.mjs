import test from 'node:test';
import assert from 'node:assert/strict';
import { MatchPresentation, chanceAnimation } from '../src/match-presentation.js';
const snapshot = (stateVersion, phase, extra = {}) => ({ id: 'match', stateVersion,
  presentation: { phase, ...extra } });

test('burst of CPU snapshots waits for the stopped wheel and each movement segment', () => {
  const queue = new MatchPresentation();
  const wheel = { ...snapshot(1, 'roll'), roulette: {id:'roll'} };
  queue.push(wheel);
  assert.equal(queue.next(0), wheel);
  queue.push(snapshot(2, 'move'));
  queue.push(snapshot(3, 'move'));
  queue.push(snapshot(4, 'chance'));
  assert.equal(queue.next(500), null);
  assert.equal(queue.next(900).stateVersion, 2); // starts roulette result animation
  assert.equal(queue.next(2000, true), null);
  assert.equal(queue.next(3500).stateVersion, 3); // first walk after result exits
  assert.equal(queue.next(3550, true), null);
  assert.equal(queue.next(3700).stateVersion, 4);
  assert.equal(queue.push(snapshot(3, 'move')), false);
  assert.equal(queue.push(snapshot(4, 'chance')), false);
});

test('CPU card result is shown before applying its effects or subsequent movement', () => {
  const queue = new MatchPresentation();
  const chance = { choiceId:'cards', actorSeat:1, faceUp:false, cards:[0,1,2].map(slot=>({slot})) };
  queue.push(snapshot(1, 'chance', {chance}));
  queue.next(0);
  queue.push(snapshot(2, 'move', {chanceResult:{actorSeat:1,slot:2,cardId:20}}));
  assert.equal(queue.next(100, true), null); // still arriving at the chance tile
  assert.equal(queue.next(300), null);
  assert.equal(queue.next(1049), null);
  assert.equal(queue.reveal, null);
  assert.equal(queue.next(1050), null);
  assert.equal(queue.reveal.slot, 2);
  assert.equal(queue.next(2449), null);
  assert.equal(queue.next(2450).stateVersion, 2);
  assert.equal(queue.busy, false);
  assert.equal(chanceAnimation(chance, {slot:2,cardId:20}, 349).cards[2].cardId, undefined);
  const cards = chanceAnimation(chance, {slot:2,cardId:20}, 350).cards;
  assert.deepEqual(cards.map(c=>c.cardId), [undefined,undefined,20]);
});

test('new match/logout discards pending animations; reconnect does not replay old card results', () => {
  const queue = new MatchPresentation();
  queue.push(snapshot(1,'move')); queue.next(0);
  queue.push(snapshot(2,'chance'));
  queue.push({...snapshot(1,'roll'),id:'new'});
  assert.equal(queue.next(10).id, 'new');
  queue.clear();
  assert.equal(queue.next(20), null);
  queue.push(snapshot(10,'move',{chanceResult:{actorSeat:1,slot:1,cardId:2}}));
  assert.equal(queue.next(30).stateVersion,10);
  assert.equal(queue.reveal,null);
});
