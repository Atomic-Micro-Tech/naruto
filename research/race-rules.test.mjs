import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRaceState,stepRace,racePath,raceActions,chooseRaceAction,RACE_EFFECTS} from './race-rules.mjs';
const data=JSON.parse(fs.readFileSync(new URL('./race-data.json',import.meta.url)));
function menu(map=data.maps[0]){const s=createRaceState(map,{seed:42});s.phase='menu';s.players.forEach(p=>p.openingDone=true);return s;}
function land(effect,{target=0,chakra=600}={}){const s=menu();s.players[0].hand=[45];s.players[target].chakra=chakra;
 if(target===0){s.players[0].tile=20;s.tiles[21].typeCode=effect;}
 else{s.players[1].tile=4;s.tiles[3].typeCode=effect;}
 return stepRace(s,{type:'play-card',slot:0,target});}
test('source starts, initial hand and mandatory first roulette',()=>{
 for(const [m,start] of [[data.maps[0],18],[data.maps[1],20]]){
  const s=createRaceState(m);assert.deepEqual(s.players.map(p=>p.tile),[start,0]);assert.deepEqual(s.players[0].hand,[46,47,48]);assert.equal(s.players[0].chakra,600);assert.equal(s.phase,'opening-roll');
  s.tiles[start+2].typeCode=20;const n=stepRace(s,{type:'roll',value:2});assert.equal(n.players[0].tile,start+2);assert.equal(n.players[0].chakra,700);assert.equal(n.actor,1);assert.equal(n.phase,'opening-roll');assert.equal(s.players[0].tile,start);
 }
});
test('movement follows original slots and clamps both endpoints',()=>{
 const t=data.maps[0].tiles;assert.deepEqual(racePath(t,33,6).path,[34,35]);assert.deepEqual(racePath(t,2,-6).path,[1,0]);assert.deepEqual(racePath(t,0,-6).path,[]);assert.equal(racePath(t,18,100).tile,35);
});
test('self card advances; opponent card retreats; used card returns to deck',()=>{
 const s=menu();s.players[1].tile=5;s.players[0].hand=[48];s.tiles[1].typeCode=22;
 const n=stepRace(s,{type:'play-card',slot:0,target:1});assert.equal(n.players[1].tile,1);assert.equal(n.players[0].hand.length,0);assert.equal(n.deck.length,s.deck.length+1);assert.equal(n.actor,1);
});
test('goal wins immediately on crossing, even when chakra is zero',()=>{
 const s=menu();s.players[0].tile=34;s.players[0].chakra=0;const n=stepRace(s,{type:'play-card',slot:2,target:0});assert.equal(n.winner,0);assert.equal(n.winReason,'goal');assert.equal(n.players[0].tile,35);
});
test('all movement tile effects and no secondary landing effects',()=>{
 const expected={10:[23,0],11:[24,0],12:[19,0],13:[18,0],14:[21,1],15:[21,2],16:[21,0],17:[21,0]};
 for(const [effect,positions] of Object.entries(expected)){const n=land(+effect);assert.deepEqual(n.players.map(p=>p.tile),positions);assert.equal(n.events.filter(e=>e.type==='tile-effect').length,1);assert.equal(n.actor,1);}
});
test('chakra effects apply to moved player; <=0 loses',()=>{
 assert.equal(land(18).players[0].chakra,500);assert.equal(land(19).players[0].chakra,400);assert.equal(land(20).players[0].chakra,700);
 const loss=land(19,{chakra:200});assert.equal(loss.winner,1);assert.equal(loss.winReason,'chakra');
 const rival=land(18,{target:1,chakra:100});assert.equal(rival.winner,0);assert.equal(rival.players[1].chakra,0);
});
test('draw costs100 with >=200 guard, fills one slot, preserves current turn',()=>{
 const s=menu();s.players[0].hand=[46];s.players[0].chakra=199;assert.throws(()=>stepRace(s,{type:'draw'}));s.players[0].chakra=200;
 const choice=stepRace(s,{type:'draw'});assert.equal(choice.players[0].chakra,100);assert.equal(choice.phase,'choose-card');assert.equal(choice.actor,0);
 const n=stepRace(choice,{type:'choose-card',index:1});assert.equal(n.players[0].hand.length,2);assert.equal(n.actor,0);assert.equal(n.phase,'menu');assert.equal(n.deck.length,s.deck.length-1);
});
test('rest +100 consumes turn; free-card tile draws without chakra cost',()=>{
 const s=menu();const rest=stepRace(s,{type:'rest'});assert.equal(rest.players[0].chakra,700);assert.equal(rest.actor,1);
 const choice=land(9);assert.equal(choice.phase,'choose-card');assert.equal(choice.pending.free,true);assert.equal(choice.players[0].chakra,600);
 const n=stepRace(choice,{type:'choose-card',index:0});assert.equal(n.actor,1);assert.equal(n.players[0].hand.length,1);
});
test('full hand free draw replacement shifts inventory; discard new removes it',()=>{
 let s=land(9);s.players[0].hand=[46,47,48];const oldDeck=s.deck.length;
 const n=stepRace(s,{type:'choose-card',index:0,replaceSlot:1});assert.deepEqual(n.players[0].hand.slice(0,2),[46,48]);assert.equal(n.deck.length,oldDeck);
 const d=stepRace(s,{type:'choose-card',index:0,discard:true});assert.deepEqual(d.players[0].hand,[46,47,48]);assert.equal(d.deck.length,oldDeck-1);
});
test('type21 reveals persistently, respects per-player effect caps and replay',()=>{
 const s=menu();s.players[0].hand=[45];s.players[0].tile=20;
 for(const [id,e] of Object.entries(RACE_EFFECTS))s.players[0].effectCounts[id-9]=e.limit;
 s.players[0].effectCounts[20-9]=1;
 const a={type:'play-card',slot:0,target:0};const n=stepRace(s,a);assert.equal(n.tiles[21].typeCode,20);assert.equal(n.players[0].effectCounts[11],2);assert.equal(n.players[0].chakra,700);assert.deepEqual(stepRace(JSON.parse(JSON.stringify(s)),a),n);
});
test('source AI selects reachable goal; complete races terminate with valid state',()=>{
 let s=menu();s.players[0].tile=34;const ai=chooseRaceAction(s);assert.equal(ai.action.type,'play-card');assert.equal(ai.action.target,0);
 for(const map of data.maps)for(let seed=1;seed<=15;seed++){
  let n=createRaceState(map,{seed});let steps=0;
  while(n.phase!=='complete'&&steps++<500){const choice=chooseRaceAction(n);n.seed=choice.seed;n=stepRace(n,choice.action);assert.ok(n.players.every(p=>p.hand.length<=3));}
  assert.equal(n.phase,'complete',`map${map.id} seed${seed}`);assert.ok(n.winner===0||n.winner===1);
 }
});
