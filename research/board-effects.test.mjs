import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as E from './board-effects.mjs';
const rules=JSON.parse(fs.readFileSync(new URL('./full-rules.json',import.meta.url)));
const costs=rules.boardNinjutsuCosts;
const fresh=()=>({rngState:1,modeFlags:0,targetChakra:3000,ruleParameters:Array(16).fill(0),players:
  Array.from({length:4},(_,i)=>({position:0,skillPoints:8,flags:0,status:0,actorStatus:0,team:255,
    chakra:1500,boardJutsu:Array.from({length:14},(_,j)=>j),inventory:[255,255,255],direction:0,facing:1})),
  tiles:Array.from({length:5},(_,i)=>({typeCode:i?4:5,owner:i?15:0,effect:0,hp:2,level:1,
    rents:[100,200,300,400,500],neighbors:[255,255,255,255],repairCounter:0,effectOwnerByte:0}))});
test('all14 IDs use source cost/effect mapping; hidden6 stays unavailable',()=>{
  assert.deepEqual(costs,[2,3,3,3,6,4,4,6,4,8,4,4,8,6]);
  for(let id=0;id<10;id++){
    const s=fresh();
    if(id===6){assert.equal(E.boardJutsuAvailability(s,0,id,costs).available,false);continue;}
    const r=E.castBoardJutsu(s,0,id,costs);
    assert.equal(r.tiles[0].effect,id+1);assert.equal(r.players[0].skillPoints,8-costs[id]);
    assert.equal(s.tiles[0].effect,0);
  }
});
test('target eligibility includes loadout, cost, empty effect, owned/barrier requirements',()=>{
  const s=fresh();s.tiles[0].owner=1;
  for(const id of [0,4,5])assert.equal(E.boardJutsuAvailability(s,0,id,costs).available,false);
  assert.equal(E.boardJutsuAvailability(s,0,3,costs).available,true);
  s.tiles[0].typeCode=4;assert.equal(E.boardJutsuAvailability(s,0,3,costs).available,false);
  s.tiles[0].effect=1;assert.equal(E.boardJutsuAvailability(s,0,1,costs).available,false);
  s.tiles[0].effect=0;s.players[0].skillPoints=2;
  assert.equal(E.boardJutsuAvailability(s,0,1,costs).available,false);
  s.players[0].skillPoints=-1;assert.equal(E.boardJutsuAvailability(s,0,1,costs).available,true);
  s.players[0].boardJutsu=[];assert.equal(E.boardJutsuAvailability(s,0,1,costs).available,false);
});
test('four damage IDs reduce1,1,3,2; destroyed ordinary barrier resets packedword',()=>{
  for(const [id,damage] of [[10,1],[11,1],[12,3],[13,2]]){
    const s=fresh();s.tiles[1]={...s.tiles[1],typeCode:5,owner:1,hp:5,level:4,effect:8};
    const r=E.castBoardJutsu(s,0,id,costs,1);assert.equal(r.tiles[1].hp,5-damage);
    s.tiles[1].hp=1;s.tiles[1].repairCounter=1;
    const t=E.castBoardJutsu(s,0,id,costs,1).tiles[1];
    assert.deepEqual([t.typeCode,t.owner,t.hp,t.level,t.effect,t.repairCounter],[4,15,2,1,0,1]);
  }
});
test('type8 targets require CPUflag; destroyed type8 retains packedword',()=>{
  const s=fresh();s.tiles[1]={...s.tiles[1],typeCode:8,owner:0,hp:2,level:3,effect:5};
  assert.deepEqual(E.boardJutsuTargets(s,0,12),[]);
  s.players[0].flags=0x100;const t=E.castBoardJutsu(s,0,12,costs,1).tiles[1];
  assert.deepEqual([t.typeCode,t.owner,t.hp,t.level,t.effect],[7,0,2,3,5]);
});
test('team target selection excludes teammates',()=>{
  const s=fresh();s.modeFlags=0x1000;s.players[0].team=s.players[1].team=1;
  s.tiles[1]={...s.tiles[1],typeCode:5,owner:1};assert.deepEqual(E.boardJutsuTargets(s,0,10),[]);
  s.players[1].team=2;assert.deepEqual(E.boardJutsuTargets(s,0,10),[1]);
});
test('landing effects wait until movement ends, force-stop interrupts passage',()=>{
  const s=fresh();s.tiles[0].effect=8;
  assert.equal(E.boardEffectOnStep(s,0,2).players[0].status,0);
  assert.equal(E.boardEffectOnStep(s,0,0).players[0].status,0x20);
  s.tiles[0].effect=9;assert.equal(E.boardEffectOnStep(s,0,0).players[0].skipTurns,1);
  s.tiles[0].effect=10;const r=E.boardEffectOnStep(s,0,4);
  assert.equal(r.remaining,0);assert.equal(r.tiles[0].effect,0);
});
test('reverse effect preserves255 sentinel and reverses junction direction/facing',()=>{
  const s=fresh();s.tiles[0].effect=3;s.tiles[0].typeCode=3;
  let r=E.boardEffectOnStep(s,0,0);assert.equal(r.players[0].direction,1);
  assert.equal(r.players[0].facing,2);assert.equal(r.players[0].actorStatus,2);
  s.players[0].direction=255;r=E.boardEffectOnStep(s,0,0);
  assert.equal(r.players[0].direction,255);assert.equal(r.players[0].facing,1);
});
test('random warp rejects same tile and connectors; once-per-turn guard retains next trap',()=>{
  const s=fresh();s.tiles[0].effect=2;s.tiles[1].typeCode=6;
  const r=E.boardEffectOnStep(s,0,0);assert.ok(r.players[0].position>=2);
  assert.equal(r.warpAlreadyUsed,true);assert.equal(r.players[0].direction,255);
  assert.equal(E.boardEffectOnStep(s,0,0,{warpAlreadyUsed:true}).tiles[0].effect,2);
});
test('barrier defense bonuses are temporary and separately consumed',()=>{
  for(const [effect,bonus] of [[1,1],[6,2]]){
    const t={typeCode:5,hp:3,effect};const r=E.prepareBarrierDefense(t);
    assert.equal(r.battleHp,3+bonus);assert.equal(r.tile.effect,effect);
    assert.equal(E.consumeBarrierDefenseEffect(r.tile).effect,0);
  }
  assert.equal(E.prepareBarrierDefense({typeCode:5,hp:3,effect:4}).tile.effect,0);
  assert.equal(E.prepareBarrierDefense({typeCode:8,hp:3,effect:4}).tile.effect,4);
});
test('double toll consumes effect and queues signed16 deltas; allied toll excluded',()=>{
  const s=fresh();s.tiles[0].owner=1;s.tiles[0].effect=5;
  const r=E.boardToll(s,0);assert.equal(r.amount,200);assert.deepEqual(r.pendingDeltas,[-200,200,0,0]);
  assert.equal(r.tiles[0].effect,0);assert.equal(r.players[0].chakra,1500);
  s.modeFlags=0x1000;s.players[0].team=s.players[1].team=1;
  assert.equal(E.boardToll(s,0).amount,0);
});
test('possession recovery shrinks range5,4,3,2; only1 clears; skip consumed once',()=>{
  let p={status:0x60,possessionAttempts:0,skipTurns:1};
  for(const n of [5,4,3,2,2]){const r=E.possessionRecoveryFaces(p);assert.equal(Math.max(...r.faces),n);p=r.player;}
  assert.equal(E.finishPossessionRecovery(p,2).status,0x60);assert.equal(E.finishPossessionRecovery(p,1).status,0x40);
  p=E.consumeSkippedTurn(p).player;assert.equal(p.skipTurns,0);assert.equal(E.consumeSkippedTurn(p).skipped,false);
});
test('scroll passing requires20; protection21 consumes both even without arrived-step flag',()=>{
  const s=fresh();s.players[1].flags=0x200;s.players[1].inventory=[21,10,255];
  assert.equal(E.attemptScrollTheft(s,0,{remaining:2}).result,'none');
  s.players[0].inventory=[20,11,255];const r=E.attemptScrollTheft(s,0,{remaining:2});
  assert.equal(r.result,'protected');assert.deepEqual(r.players[0].inventory,[11,255,255]);
  assert.deepEqual(r.players[1].inventory,[10,255,255]);assert.ok(r.players[1].flags&0x200);
});
test('scroll theft needs arrived-step, honors inactive bit and ignores teams',()=>{
  const s=fresh();s.modeFlags=0x1000;s.players[0].team=s.players[1].team=1;s.players[1].flags=0x200;
  assert.equal(E.attemptScrollTheft(s,0).result,'none');
  let r=E.attemptScrollTheft(s,0,{arrivedStep:true});assert.equal(r.result,'stolen');
  assert.ok(r.players[0].flags&0x200);assert.equal(r.players[1].flags&0x200,0);
  s.players[1].actorStatus=1;assert.equal(E.attemptScrollTheft(s,0,{arrivedStep:true}).result,'none');
});
test('scroll award requires laps and no existing holder; battle path keeps explicit eligibility',()=>{
  const s=fresh();assert.equal(E.awardScrollAfterBonus(s,0).awarded,false);
  s.players[0].flags=2;const r=E.awardScrollAfterBonus(s,0);assert.equal(r.awarded,true);
  assert.equal(E.awardScrollAfterBonus(r,1,true).awarded,false);
  assert.throws(()=>E.resolveBattleScroll(r,{attacker:1,defender:0,defenderHp:0}));
  assert.equal(E.resolveBattleScroll(r,{attacker:1,defender:0,defenderHp:0,battleEligibilityWord:-1,everAwarded:true}).result,'none');
  assert.equal(E.resolveBattleScroll(r,{attacker:1,defender:0,defenderHp:0,battleEligibilityWord:0,everAwarded:true}).result,'stolen');
});
test('source requires crystals; updates seals before debt payment; repairs and awards capped skill',()=>{
  const s=fresh();s.players[0].flags=0x200;s.players[0].chakra=-100;s.tiles[0].repairCounter=1;
  s.tiles[0].hp=1;s.players[0].skillPoints=6;
  const opts={crystalCount:2,baseBonus:400,skillAward:4};
  assert.equal(E.completeSourceBonus(s,0,opts).completed,false);
  s.players[0].flags|=0x3000;const r=E.completeSourceBonus(s,0,opts);
  assert.equal(r.players[0].flags,0x201);assert.equal(r.players[0].chakra,350);
  assert.equal(r.players[0].scrollSeals,1);assert.equal(r.players[0].debtTurns,1);
  assert.equal(r.players[0].skillPoints,8);assert.equal(r.tiles[0].hp,2);assert.equal(r.repairs,1);
  assert.equal(r.players[1].chakra,1500);
});
test('team source clears ally crystals, shares wealth, and tutorial win occurs before payment',()=>{
  const s=fresh();s.modeFlags=0x1000;s.players[0].team=s.players[1].team=1;
  s.players[0].flags=s.players[1].flags=0xf000;
  let r=E.completeSourceBonus(s,0,{crystalCount:4,baseBonus:400,skillAward:4});
  assert.equal(r.players[1].flags,0);assert.equal(r.players[1].chakra,1950);
  s.modeFlags=0x2000;r=E.completeSourceBonus(s,0,{crystalCount:4,baseBonus:400,skillAward:4});
  assert.equal(r.victory.won,true);assert.equal(r.players[0].chakra,1500);assert.equal(r.players[0].flags,0xf001);
});
test('scenario victory runs only at source events and packed defeat counter is not crystals',()=>{
  const s=fresh();s.modeFlags=0x80;s.ruleParameters[7]=2;
  let r=E.recordScenarioDefeat(s,{attacker:0,defender:2,event:'barrier-captured',tileType:5});
  r=E.recordScenarioDefeat(r,{attacker:1,defender:3,event:'player-eliminated'});
  assert.equal(r.defeatCounters,0x11);assert.equal(E.scenarioVictory(r,{event:'turn-end',actor:0}).won,true);
  s.modeFlags=0x100;s.ruleParameters[8]=1;s.tiles[0].typeCode=7;
  assert.equal(E.scenarioVictory(s,{event:'barrier-destroyed',actor:0}).won,true);
  s.modeFlags=2;s.ruleParameters[1]=10;
  assert.equal(E.scenarioVictory(s,{event:'round-end',actor:0,round:10}).won,false);
  assert.equal(E.scenarioVictory(s,{event:'round-end',actor:3,round:10}).won,true);
});
test('scenario initialization retains rank/controller distinction; type8 loadHP4 level3 owner0',()=>{
  let p=E.scenarioInitialPlayers(rules.scenarios[1]);
  assert.equal(p[0].flags,0);assert.equal(p[1].flags,0x400);assert.equal(p[2].flags,0x900);
  assert.equal(p[0].team,255);assert.equal(p[0].persistentTeam,0);
  const t=E.initialBoardTiles([{typeCode:8},{typeCode:4}]);
  assert.deepEqual(t.map(x=>[x.owner,x.hp,x.level]),[[0,4,3],[15,2,1]]);
});
test('source result exchange ordering preserves original indirect tie reordering',()=>{
  const s=fresh();s.players[0].chakra=100;s.players[1].chakra=100;s.players[2].chakra=200;s.players[3].chakra=50;
  assert.deepEqual(E.sourceResultRanking(s).order,[2,1,0,3]);
  s.players[2].actorStatus=1;assert.deepEqual(E.sourceResultRanking(s).order,[0,1,3,2]);
  assert.equal(E.sourceResultRanking(s,{forcedWinner:3}).order[0],3);
  s.players[0].chakra=40000;s.players[2].chakra=1000;
  assert.equal(E.sourceBoardRanks(s.players).order.at(-1),0);
  s.modeFlags=0x1000;assert.throws(()=>E.sourceResultRanking(s),/outside valid/);
});
test('type8 only CPU attacks and defender is always0; possession alone is insufficient',()=>{
  const s=fresh();s.tiles[0].typeCode=8;s.players[1].status=0x20;
  assert.equal(E.type8Landing(s,1).action,'end-turn');s.players[1].flags|=0x100;
  assert.equal(E.type8Landing(s,1,{remaining:1}).action,'continue-moving');
  let r=E.type8Landing(s,1,{techniqueCosts:[40,80,120]});assert.equal(r.action,'attack');assert.equal(r.defender,0);
  s.players[1].chakra=0;assert.equal(E.type8Landing(s,1,{techniqueCosts:[40]}).action,'end-turn');
  s.players[1].chakra=-1;assert.equal(E.type8Landing(s,1,{techniqueCosts:[40],hasFifthTechnique:true}).action,'attack');
});
