import test from 'node:test';import assert from 'node:assert/strict';
import {scrollPowerOptions,consumeScrollPower,resolveScrollPower,scrollPowerRouletteFaces,
 resetScrollCounters,recordScrollSourceBonus,recordScrollMovementRoll,cpuScrollRouletteTarget} from './story1-scroll.mjs';
const fixture=()=>({modeFlags:0,players:[{flags:0x200,chakra:1500,skillPoints:3,scrollBonusCount:1,scrollNegativeBonusCount:2,scrollRollCount:8},{flags:0x100,chakra:1000}],tiles:[
 {id:0,typeCode:0,owner:15,level:1,hp:2,neighbors:[1,2,255,255]},
 {id:1,typeCode:5,owner:1,level:2,hp:1,effect:5,repairCounter:1,rents:[50,100,200,400,800],neighbors:[2,0,255,255]},
 {id:2,typeCode:5,owner:0,level:5,hp:6,effect:1,repairCounter:1,rents:[50,100,200,400,800],neighbors:[0,1,255,255]}]});
test('availability requires scroll and exact charge thresholds',()=>{
 const s=fixture();assert.deepEqual(scrollPowerOptions(s,0).map(o=>o.enabled),[true,true,true,true]);
 Object.assign(s.players[0],{scrollNegativeBonusCount:1,scrollBonusCount:0,scrollRollCount:7});
 assert.deepEqual(scrollPowerOptions(s,0).map(o=>o.enabled),[false,false,true,false]);
 s.players[0].flags=0;assert(scrollPowerOptions(s,0).every(o=>!o.enabled));
});
test('bonus counters inspect pre-bonus chakra; movement rolls only; wrap bytes',()=>{
 let p={flags:512,chakra:-1,scrollBonusCount:255,scrollNegativeBonusCount:255,scrollRollCount:255};
 p=recordScrollSourceBonus(p);assert.equal(p.scrollBonusCount,0);assert.equal(p.scrollNegativeBonusCount,0);
 p=recordScrollMovementRoll(p);assert.equal(p.scrollRollCount,0);
 assert.deepEqual(resetScrollCounters({...p,scrollBonusCount:2}),p);
 assert.equal(recordScrollSourceBonus({...p,chakra:0}).scrollNegativeBonusCount,0);
});
test('consumption resets bonus charges, preserves roll count and skill points',()=>{
 const original=fixture(),s=consumeScrollPower(original,0,2);
 assert.equal(s.players[0].flags&512,0);assert.equal(s.players[0].scrollRollCount,8);
 assert.equal(s.players[0].skillPoints,3);assert.equal(s.players[0].scrollBonusCount,0);
 assert.equal(original.players[0].flags,512);assert.throws(()=>consumeScrollPower(s,0,2),/progress/);
});
test('revolution lower clamp and no rounding/queue conversion',()=>{
 const s=fixture();s.players[0].chakra=-1500;s.players[1].chakra=80000;
 const out=resolveScrollPower(consumeScrollPower(s,0,0));assert.deepEqual(out.players.map(p=>p.chakra),[1500,-9999]);
});
test('catastrophe exact6 threshold, level inversion, full HP and retained effect',()=>{
 let s=resolveScrollPower(consumeScrollPower(fixture(),0,1),{value:5});assert.equal(s.tiles[1].level,2);
 s=resolveScrollPower(consumeScrollPower(fixture(),0,1),{value:6});
 assert.deepEqual(s.tiles.slice(1).map(t=>[t.level,t.hp,t.effect,t.repairCounter]),[[4,5,5,1],[1,2,1,1]]);
 assert.deepEqual(scrollPowerRouletteFaces(1),[0,1,2,3,4,5,6,7,8,9,10,11]);
});
test('scroll capture strict comparison, max defender bypass, no HP reset',()=>{
 let s=resolveScrollPower(consumeScrollPower(fixture(),0,2),{target:1,defenderRoll:11});
 assert.equal(s.scrollOutcome.success,false);assert.equal(s.players[0].chakra,1400);assert.equal(s.players[1].chakra,1000);assert.equal(s.tiles[1].effect,5);
 s=resolveScrollPower(consumeScrollPower(fixture(),0,2),{target:1,defenderRoll:4,attackerRoll:4});assert.equal(s.scrollOutcome.success,false);
 s=resolveScrollPower(consumeScrollPower(fixture(),0,2),{target:1,defenderRoll:4,attackerRoll:5});
 assert.deepEqual([s.tiles[1].owner,s.tiles[1].hp,s.tiles[1].level,s.tiles[1].effect,s.tiles[1].repairCounter],[0,1,2,5,0]);
});
test('absorption transfers500 times opponent roulette, default faces retained',()=>{
 const s=resolveScrollPower(consumeScrollPower(fixture(),0,3),{rolls:[{actor:1,value:6}]});
 assert.deepEqual(s.players.map(p=>p.chakra),[4500,-2000]);assert.equal(s.scrollOutcome.endTurn,true);
 const faces=[1,2,2,3,3,3,4,4,4,5,5,6];assert.deepEqual(scrollPowerRouletteFaces(3,faces),faces);
});
test('CPU target range ignores twelfth slot and consumes one source RNGdraw',()=>{
 for(let seed=0;seed<50;seed++){
  const a=cpuScrollRouletteTarget(scrollPowerRouletteFaces(1),seed);assert(a.target>=0&&a.target<=10);assert.equal(a.draws,1);
  const b=cpuScrollRouletteTarget([1,2,2,3,3,3,4,4,4,5,5,6],seed);assert(b.target>=1&&b.target<=5);
 }
});

import {scrollDebtNotice,clearScrollDebtNoticeLatch} from './story1-scroll.mjs';
test('debt notice is latched until source bonus; positive wallet resets only after prior notice',()=>{
 const p={chakra:-10,scrollNegativeBonusCount:0};
 let r=scrollDebtNotice(p,0);assert.equal(r.notice,129);assert.equal(r.messageId,0x322);assert.equal(r.remainingBonuses,2);
 r=scrollDebtNotice({chakra:100,scrollNegativeBonusCount:1},r.notice);
 assert.equal(r.reset,false);assert.equal(r.player.scrollNegativeBonusCount,1);
 r=scrollDebtNotice(r.player,clearScrollDebtNoticeLatch(r.notice));
 assert.equal(r.reset,true);assert.equal(r.notice,128);assert.equal(r.messageId,0x324);assert.equal(r.player.scrollNegativeBonusCount,0);
 assert.equal(p.scrollNegativeBonusCount,0);
});
test('debt notice exact threshold, exhausted latch, and positive zero-notice quirk',()=>{
 const p={chakra:-1,scrollNegativeBonusCount:2};
 assert.equal(scrollDebtNotice(p,1).messageId,0x323);assert.equal(scrollDebtNotice(p,1).notice,255);
 assert.equal(scrollDebtNotice(p,127).messageId,null);
 assert.equal(scrollDebtNotice({...p,chakra:1},127).messageId,0x324);
 assert.equal(scrollDebtNotice({...p,chakra:1},0).messageId,0x323);
 assert.equal(scrollDebtNotice({chakra:1,scrollNegativeBonusCount:1},0).reset,false);
});
