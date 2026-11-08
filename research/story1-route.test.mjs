import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {story1DefenderRoute} from './story1-route.mjs';
const tiles=JSON.parse(fs.readFileSync(new URL('./maps.json',import.meta.url)))[0].tiles;
test('source map0 schema, all484 routes and source slot0 ties',()=>{
 for(let from=0;from<22;from++)for(let to=0;to<22;to++){
  const r=story1DefenderRoute(tiles,from,to),forward=(to-from+22)%22,backward=(from-to+22)%22;
  assert.equal(r.distance,Math.min(forward,backward));assert.equal(r.path[0],from);assert.equal(r.path.at(-1),to);
  if(from!==to)assert.equal(r.direction,forward<=backward?0:1);
 }
});
test('20-step source scoring horizon and wrapped adjacent tile',()=>{
 const r=story1DefenderRoute(tiles,0,21);assert.equal(r.direction,1);assert.equal(r.distance,1);
 assert.equal(r.candidates[0].reached,false);assert.equal(r.candidates[1].score,-10000);
});
test('no silent generic route substitution',()=>{
 const other=structuredClone(tiles);other[1].typeCode=3;
 assert.throws(()=>story1DefenderRoute(other,0,3),/map0/);
 assert.throws(()=>story1DefenderRoute(tiles,22,0),/tile IDs/);
});

import {story1DirectionMenu,story1MovementPreview,story1CpuInitialRoute} from './story1-route.mjs';
const state=()=>({modeFlags:0,rngState:1,tiles:tiles.map(t=>({...t,purchasePrice:t.buyCost,upgradeBase:t.upgradeCost,owner:15,level:1,hp:2,effect:0})),players:[
 {position:0,chakra:1500,flags:0,status:0},{position:0,chakra:1500,flags:256,status:0}]});
test('source arrow menu is compact screen order, not graph slot order',()=>{
 assert.deepEqual(story1DirectionMenu(tiles,0).slice(0,2),[{direction:1,choiceCode:1,next:21},{direction:0,choiceCode:3,next:1}]);
 assert.deepEqual(story1DirectionMenu(tiles,11).slice(0,2),[{direction:1,choiceCode:0,next:10},{direction:0,choiceCode:2,next:12}]);
});
test('map0 previews retain source graph order and ignore remaining bit7',()=>{
 for(let p=0;p<22;p++)for(let n=0;n<=12;n++){
  const expected=[{tile:(p+n)%22,direction:0},{tile:(p-n+22)%22,direction:1}];
  assert.deepEqual(story1MovementPreview(tiles,p,n),expected);
  assert.deepEqual(story1MovementPreview(tiles,p,n|128),expected);
 }
});
test('original initial CPU source scoring can choose away from nearest crystal',()=>{
 const s=state();const results=Array.from({length:6},(_,i)=>story1CpuInitialRoute(s,1,{remaining:i+1}));
 assert.deepEqual(results.map(r=>r.direction),[1,1,1,0,0,1]);
 assert.deepEqual(results[3].scores,[51000,51905,null,null]);
 assert.deepEqual(results[4].scores,[50500,50785,null,null]);
 assert.ok(results.every(r=>r.draws===0&&r.rngState===1));assert.equal(s.players[1].direction,undefined);
});
test('incoming s2 first negative pointer then prior returned tile alters cheap-enemy preview',()=>{
 const s=state();for(const id of [21,1])Object.assign(s.tiles[id],{typeCode:5,owner:0,level:1,rents:[10,10,10,10,10]});
 const r=story1CpuInitialRoute(s,1,{remaining:1});
 assert.deepEqual(r.routes.slice(0,2).map(r=>r.landingTile),[255,1]);
});
test('all-crystal source invalid candidate memory remains explicit, never guessed',()=>{
 const s=state();s.players[1].flags|=0x3000;
 Object.assign(s.tiles[21],{typeCode:5,owner:0,level:1,rents:[10,10,10,10,10]});
 assert.throws(()=>story1CpuInitialRoute(s,1,{remaining:1}),/invalid landing tile/);
});
test('possessed direction keeps original rejection sampling and skips geometry',()=>{
 const s=state();s.players[1].status=32;
 const r=story1CpuInitialRoute(s,1,{remaining:1});assert.ok([0,1].includes(r.direction));assert.ok(r.draws>=1);assert.equal(r.candidates.length,0);
});
test('seed7 round14: dominated invalid RAM cannot affect native route winner',()=>{
 const s=state();Object.assign(s.players[1],{position:20,chakra:2,flags:0x3100});
 Object.assign(s.tiles[14],{typeCode:5,owner:0,level:5,hp:6});
 const r=story1CpuInitialRoute(s,1,{remaining:6});
 assert.equal(r.next,21);assert.equal(r.direction,0);assert.equal(r.scores[0],-36);
 assert.deepEqual(r.dominatedMemoryReads,[{slot:1,address:0x8014daf4,scoreUpperBound:-108}]);
 s.tiles[4].effect=2;
 assert.throws(()=>story1CpuInitialRoute(s,1,{remaining:6}),/unknown RAM can change winner/);
});
test('seed9: two invalid candidates share one RAM penalty and retain exact geometry ranking',()=>{
 const s=state();Object.assign(s.players[1],{position:9,chakra:580,flags:0x3100});
 Object.assign(s.tiles[4],{typeCode:5,owner:0,level:1,rents:[10,10,10,10,10]});
 Object.assign(s.tiles[14],{typeCode:5,owner:0,level:5,hp:6});
 const r=story1CpuInitialRoute(s,1,{remaining:5});
 // Both cheap/expensive enemy landing paths return255 for source preview.
 assert.equal(r.next,8);assert.equal(r.direction,1);
 assert.deepEqual(r.memoryIndependentChoice.possibleWinners,[0,0,0,0]);
 assert.equal(r.sharedMemoryReads.length,2);
});
