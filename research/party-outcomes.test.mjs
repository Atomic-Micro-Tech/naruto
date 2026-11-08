import test from 'node:test';
import assert from 'node:assert/strict';
import {sourceBonusWins, reachedTurnLimit, eliminationOutcome, partyResult} from './party-outcomes.mjs';
const players = scores => scores.map(chakra => ({chakra, actorStatus: 0, isCpu: false}));

test('source bonus threshold includes zero and 99999; scroll rules retain OR/AND distinction', () => {
  assert.equal(sourceBonusWins({target: 0, chakra: 0}), true);
  assert.equal(sourceBonusWins({target: 0, chakra: -1}), false);
  assert.equal(sourceBonusWins({target: 99999, chakra: 99998}), false);
  assert.equal(sourceBonusWins({target: 99999, chakra: 99999}), true);
  assert.equal(sourceBonusWins({rule: 4, target: 3000, chakra: 3000}), true);
  assert.equal(sourceBonusWins({rule: 4, target: 3000, chakra: 1, hasScroll: true, scrollBonuses: 5}), true);
  assert.equal(sourceBonusWins({rule: 4, target: 3000, chakra: 1, hasScroll: true, scrollBonuses: 4}), false);
  assert.equal(sourceBonusWins({rule: 8, target: 0, chakra: 1500}), false);
  assert.equal(sourceBonusWins({rule: 8, target: 0, chakra: 1500, hasScroll: true}), true);
});
test('turn termination requires last slot, settled changes and exact count', () => {
  const s = {rule: 2, round: 5, limit: 5, actor: 3, playerCount: 4, pending: [0,0,0,0]};
  assert.equal(reachedTurnLimit(s), true);
  assert.equal(reachedTurnLimit({...s, actor: 2}), false);
  assert.equal(reachedTurnLimit({...s, round: 6}), false);
  assert.equal(reachedTurnLimit({...s, pending: [0,1,0,0]}), false);
});
test('elimination is strictly negative, scans slots in order and can continue', () => {
  const r = eliminationOutcome(players([0,-1,50,-2]), 255);
  assert.deepEqual(r.eliminatedSlots, [1,3]);
  assert.deepEqual(r.active, [0,2]);
  assert.equal(r.finish, false);
});
test('last human leaving ends the match with multiple CPU survivors; not surrender flag', () => {
  const p = players([-1,500,500]); p[1].isCpu = p[2].isCpu = true;
  const r = eliminationOutcome(p, 255);
  assert.equal(r.finish, true); assert.equal(r.cpuOnlyFinish, true);
  assert.equal(r.candidate, 1); assert.equal(r.winnerSlot, 255);
  const result = partyResult({players: p.map((v,i)=>({...v,actorStatus:i===0?1:0})),winnerSlot:r.winnerSlot,rule:1});
  assert.deepEqual(result.order, [1,2,0]);
  assert.deepEqual(result.labels, ['1位','2位','ドベ']);
  assert.equal(result.specialResult, 0);
});
test('zero survivor preserves prior winner byte; model refuses to invent initialization', () => {
  const p = players([-50,0]);
  assert.throws(()=>eliminationOutcome(p), /actual/);
  for (const prior of [0,1,255]) {
    const r = eliminationOutcome(p, prior);
    assert.equal(r.winnerSlot, prior); assert.equal(r.cameraFocusSlot, prior);
    assert.equal(r.needsPriorMemory, true);
    assert.equal(r.validActiveCandidate, prior === 1);
  }
  const r = eliminationOutcome(players([-1,-1]), 0);
  assert.equal(r.finish, true); assert.deepEqual(r.active, []);
  assert.equal(r.winnerSlot, 0); assert.equal(r.validActiveCandidate, false);
});
test('exchange order reverses two tied slots but gives them the same bottom badge at turn limit', () => {
  const r = partyResult({players:players([100,100,200]),winnerSlot:255,rule:2,round:5});
  assert.deepEqual(r.order,[2,1,0]); assert.deepEqual(r.labels,['1位','ドベ','ドベ']);
});
test('all tied at turn limit shares first; normal source win remains unique', () => {
  let r=partyResult({players:players([100,100,100,100]),winnerSlot:255,rule:2,round:5});
  assert.deepEqual(r.labels,['1位','1位','1位','1位']);
  r=partyResult({players:players([100,100,100,100]),winnerSlot:2});
  assert.deepEqual(r.order,[2,1,0,3]);
  assert.deepEqual(r.labels,['1位','ドベ','ドベ','ドベ']);
  assert.equal(r.nextScene,2); assert.equal(r.evaluateProgression,false);
});
test('surrendering richest participant is placed last; other tied players can share first', () => {
  const r=partyResult({players:players([300,100,100]),winnerSlot:255,surrenderingSlot:0});
  assert.deepEqual(r.order,[1,2,0]); assert.deepEqual(r.labels,['1位','1位','ドベ']);
  assert.equal(r.specialResult,1);
});
test('surrender uses plain chakra sort; inactive overrides badges only after first position', () => {
  const p=players([100,999,500]); p[1].actorStatus=1;
  const r=partyResult({players:p,winnerSlot:255,surrenderingSlot:0});
  assert.deepEqual(r.order,[1,2,0]); assert.deepEqual(r.labels,['1位','2位','ドベ']);
});
test('normal ranking prioritizes declared source winner over a richer player', () => {
  const r=partyResult({players:players([100,999,400]),winnerSlot:0});
  assert.deepEqual(r.order,[0,1,2]); assert.deepEqual(r.labels,['1位','2位','ドベ']);
});
test('individual Party model rejects story/team flag combinations and missing winner state', () => {
  assert.throws(()=>partyResult({players:players([1,2]),winnerSlot:255,rule:0x1000}),RangeError);
  assert.throws(()=>sourceBonusWins({rule:3,target:0,chakra:1}),RangeError);
  assert.throws(()=>partyResult({players:players([1,2])}),TypeError);
});
