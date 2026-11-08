import test from 'node:test';
import assert from 'node:assert/strict';
import {startBoardRoulette, advanceBoardRoulette, stopBoardRoulette,
  rouletteIndex, rouletteValue, ticksToRouletteValue, freezeRoulette,
  prepareBoardRoll, finishBoardRoll} from './faithful-roulette.mjs';

const faces = Array.from({length:12}, (_,i)=>i+1);
test('64 original swaps plus initial angle consume exactly65draws', () => {
  const w = startBoardRoulette(faces, 1);
  assert.deepEqual(w.faces, [6,3,5,12,2,4,10,1,8,7,11,9]);
  assert.equal(w.rngState, 1223573862);
  assert.equal(w.angle, 2286);
  assert.deepEqual(faces, [1,2,3,4,5,6,7,8,9,10,11,12]);
});
test('fixed-point angle boundaries include the final four angles wrapping toslot0', () => {
  for (const [angle,index] of [[0,0],[340,0],[341,1],[3750,10],[3751,11],[4091,11],[4092,0],[4095,0],[4096,0]])
    assert.equal(rouletteIndex(angle), index);
  const w = freezeRoulette({...startBoardRoulette(faces,1),angle:4095});
  assert.equal(w.angle,4092); assert.equal(rouletteValue(w),6);
});
test('opening completes onupdate10; ignored early press doesnot stop spin', () => {
  const start=startBoardRoulette(faces,1), early=stopBoardRoulette(start);
  assert.equal(early.phase,0); assert.equal(early.spinning,true);
  const a=advanceBoardRoulette(start,9); assert.equal(a.phase,1); assert.equal(a.angle,3906);
  const b=advanceBoardRoulette(a); assert.equal(b.phase,2); assert.equal(b.angle,4086);
  assert.deepEqual(b.events,[{type:'ready',tick:0}]);
});
test('three tween callbacks occur3/5/7ticks afterpress andfreeze atsecond', () => {
  const ready=advanceBoardRoulette(startBoardRoulette(faces,1),10);
  let w=stopBoardRoulette(ready);
  w=advanceBoardRoulette(w,3); assert.equal(w.angle,530); assert.equal(w.spinning,true);
  assert.deepEqual(w.events,[{type:'hammer',index:0,tick:2}]);
  w=advanceBoardRoulette(w,2); assert.equal(w.angle,682); assert.equal(w.spinning,false);
  assert.equal(rouletteValue(w),5); assert.equal(w.countdown,60);
  w=advanceBoardRoulette(w,2); assert.equal(w.angle,682); assert.equal(w.countdown,60);
  assert.deepEqual(w.events,[{type:'hammer',index:2,tick:1}]);
  w=advanceBoardRoulette(w,60); assert.equal(w.phase,5); assert.equal(w.exitRemaining,7);
  w=advanceBoardRoulette(w,7); assert.equal(w.phase,6);
  assert.equal(finishBoardRoll(w,{rouletteStatus:0x11}).player.rouletteStatus,0);
});
test('CPU aims atfirstmatchingface and skips tweenupdate ontrigger tick', () => {
  let w={...startBoardRoulette(faces,1),faces:[1,2,3,4,5,6,1,2,3,4,5,6],
    phase:2,openingRemaining:0,angle:300,targetValue:4};
  assert.equal(ticksToRouletteValue(w,1),21); // first1atangle0, not laterduplicate
  assert.equal(ticksToRouletteValue(w,99),-1);
  w=advanceBoardRoulette(w); // angle480, targetangle1023, distance543 =>3ticks
  assert.equal(w.phase,3); assert.equal(w.hammerTick,0);
  assert.equal(w.angle,480);
  w=advanceBoardRoulette(w,5);
  assert.equal(w.spinning,false); assert.equal(w.angle,1364);
  assert.equal(rouletteValue(w),5); // source's stopdelay can overshoot target
});
test('forcedmove bypass preserves roulettecounter; ordinaryroll consumesit', () => {
  const p={forcedMove:8,rouletteStatus:0x12,playerStatus:2};
  const bypass=prepareBoardRoll(faces,p,true);
  assert.equal(bypass.movement,8); assert.equal(bypass.player.forcedMove,0);
  assert.equal(bypass.player.rouletteStatus,0x12); assert.equal(p.forcedMove,8);
  const roll=prepareBoardRoll(faces,p);
  assert.deepEqual(roll.faces,[1,2,3,1,2,3,1,2,3,1,2,3]);
  const done={...startBoardRoulette(roll.faces,1),phase:6};
  const end=finishBoardRoll(done,p);
  assert.equal(end.player.rouletteStatus,0x11); assert.equal(end.player.playerStatus,0);
  const precedence=finishBoardRoll(done,{rouletteStatus:0x11,playerStatus:2});
  assert.equal(precedence.player.rouletteStatus,0x10);
  assert.throws(()=>finishBoardRoll(startBoardRoulette(faces,1),p), /not finished/);
});
