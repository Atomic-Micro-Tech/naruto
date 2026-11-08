import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as rules from './faithful-rules.mjs';
const data = JSON.parse(readFileSync(new URL('./full-rules.json',import.meta.url)));

test('binary table boundaries and known records', () => {
  assert.equal(data.cards.length,52);
  assert.deepEqual(data.cards[7],{id:7,type:3,useFlag:1,value:-50,messageId:246,immediate:true});
  assert.equal(data.decks[0].pools[0].length,51);
  assert.deepEqual(data.decks[8].pools[0],[45,46,46,46,47,47,47,48,48,49,50]);
  assert.deepEqual(data.boardNinjutsuCosts,[2,3,3,3,6,4,4,6,4,8,4,4,8,6]);
  assert.deepEqual(data.campaigns.map(c=>c.entries.length),[10,3,6]);
  assert.equal(data.scenarios.filter(s=>!s.reservedNoRoster).length,19);
});

test('PsyQ rand known sequence from seed1, including uint32 overflow', () => {
  let state=1;const got=[];
  for(let i=0;i<5;i++){const r=rules.ps1Random(state);state=r.state;got.push(r.value);}
  assert.deepEqual(got,[16838,5758,10113,17515,31051]);
  assert.deepEqual(rules.ps1Random(0xffffffff),{state:3191464396,value:15929});
});

test('deck lifecycle preserves immediate cards, removes inventory card, uses exact RNG count', () => {
  const start=Array.from({length:10},(_,i)=>i);
  const immediate=rules.drawChanceCard(start,1,data.cards,1);
  assert.equal(immediate.card,1); assert.equal(immediate.deck.length,10);
  assert.deepEqual(immediate.deck.slice().sort((a,b)=>a-b),start);
  const inventory=rules.drawChanceCard([13,14,15,16,17],2,data.cards,1);
  assert.equal(inventory.card,15); assert.equal(inventory.deck.length,4);
  assert.ok(!inventory.deck.includes(15));
  assert.deepEqual(start,Array.from({length:10},(_,i)=>i));
  let expectedState=1;
  // 9*4 selection swaps, one return draw, 10*4 final swaps.
  for(let i=0;i<77;i++)expectedState=rules.ps1Random(expectedState).state;
  assert.equal(immediate.state,expectedState);
  assert.equal(rules.insertCard([1,2],2,3).inserted,false);
});

test('chance context filters and three-slot inventory', () => {
  assert.equal(rules.canUseCard(data.cards[13],2),true);
  assert.equal(rules.canUseCard(data.cards[22],4),true);
  assert.equal(rules.canUseCard(data.cards[23],5),true);
  assert.equal(rules.canUseCard(data.cards[22],5),false);
  assert.deepEqual(rules.addInventoryCard([13,255,255],14),{inventory:[13,14,255],added:true});
  assert.equal(rules.addInventoryCard([13,14,15],16).added,false);
});

const barrier=(owner,neighbors,level=1)=>({typeCode:5,owner,neighbors,level,rents:[75,150,225,300,375],hp:1,repairCounter:0});
test('chains follow slot0 and skip table indices, ignoring branch connectivity', () => {
  const tiles=[barrier(0,[1,3]),barrier(0,[2]),{typeCode:3,neighbors:[3]},barrier(0,[2])];
  assert.deepEqual(rules.barrierChains(tiles).chains,[1,1,0,0]);
  assert.equal(rules.sourceBonus(tiles,0,300),427); // (90+90+75)/2 truncates127
  assert.equal(rules.barrierRent(barrier(0,[1]),3),135);
  assert.equal(rules.barrierRent(barrier(0,[1]),5),0);
});

test('barrier healing is per-owned-barrier every second completed bonus', () => {
  let tiles=[barrier(0,[1],2),barrier(1,[0],2)];
  tiles=rules.repairAtBonus(tiles,0);assert.equal(tiles[0].hp,1);assert.equal(tiles[0].repairCounter,1);
  tiles=rules.repairAtBonus(tiles,0);assert.equal(tiles[0].hp,2);assert.equal(tiles[1].hp,1);
  for(let i=0;i<8;i++)tiles=rules.repairAtBonus(tiles,0);
  assert.equal(tiles[0].hp,3);
});

test('chance property tax sums levels and all-player card transfers per opponent', () => {
  assert.equal(rules.chanceEffect(data.cards[9],{player:0,tiles:[barrier(0,[],3),barrier(0,[],2),barrier(1,[],5)]}).delta,-250);
  assert.deepEqual(rules.chanceEffect(data.cards[7],{player:0,playerCount:4}).deltas,[-150,50,50,50]);
  assert.deepEqual(rules.chanceEffect(data.cards[7],{player:0,playerCount:4,teamMode:true,teams:[0,0,1,1]}).deltas,[-100,-100,100,100]);
});

test('source victory requires the mode-specific seal/flag and team clearing preserves other flags', () => {
  const ruleParameters=[];ruleParameters[2]=3;
  assert.equal(rules.sourceVictory({modeFlags:4,chakra:100,targetChakra:3000,sealCount:3,playerFlags:0x200,ruleParameters}).won,true);
  assert.equal(rules.sourceVictory({modeFlags:8,chakra:4000,targetChakra:3000,playerFlags:0}).won,false);
  const players=[{team:0,flags:0xf200},{team:0,flags:0x3200},{team:1,flags:0xf100}];
  assert.deepEqual(rules.clearCrystalsAfterBonus(players,0,true).map(p=>p.flags),[0x200,0x200,0xf100]);
});

test('seal scroll first award, reaward and ownership transfer', () => {
  assert.equal(rules.shouldAwardScroll([{flags:1},{flags:0}],0,false),false);
  assert.equal(rules.shouldAwardScroll([{flags:1},{flags:1}],1,false),true);
  assert.equal(rules.shouldAwardScroll([{flags:2},{flags:0}],0,false),true);
  assert.equal(rules.shouldAwardScroll([{flags:1},{flags:0}],0,true),true);
  assert.equal(rules.shouldAwardScroll([{flags:0x201},{flags:2}],1,true),false);
  const got=rules.transferScroll([{flags:0x201,scrollCounter:3},{flags:1,scrollCounter:6}],1,0);
  assert.deepEqual(got.map(p=>p.flags),[1,0x201]);assert.equal(got[1].scrollCounter,0);
});

test('direct multi-level upgrades use nonlinear source costs', () => {
  assert.deepEqual([2,3,4,5].map(level=>rules.upgradePrice(100,1,level)),[100,400,800,1600]);
});

test('held movement cards and two-roll roulette bias retain exact source values',()=>{
  let players=[{},{}];
  players=rules.useBoardCard(data.cards[13],0,1,players).players;assert.equal(players[1].forcedMove,2);
  players=rules.useBoardCard(data.cards[19],0,1,players).players;assert.equal(players[1].skipTurns,1);
  players=rules.useBoardCard(data.cards[30],0,1,players).players;assert.equal(players[1].rouletteStatus,0x32);
  assert.deepEqual(rules.rouletteForStatus([1,2],0x32),[10,11,12,10,11,12,10,11,12,10,11,12]);
  assert.deepEqual(rules.rouletteForStatus([1,2],0x30),[1,2]);
});

test('teleport cards move one actor or summon eligible rivals without swapping',()=>{
  const players=[{tile:4,status:0},{tile:7,status:0},{tile:9,status:1}], tiles=[{typeCode:0},{typeCode:1},{typeCode:3}];
  assert.deepEqual(rules.teleportPlan(data.cards[11],0,players,tiles).destinations,[1]);
  assert.deepEqual(rules.teleportPlan(data.cards[36],0,players,tiles,1).moves,[{player:0,tile:7}]);
  assert.deepEqual(rules.teleportPlan(data.cards[35],0,players,tiles).moves,[{player:1,tile:4}]);
  assert.equal(rules.teleportPlan(data.cards[10],0,players,tiles).grantAllCrystals,true);
});
