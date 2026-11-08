import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import * as R from './story1-cpu-roulette.mjs';
import {ps1Random} from './faithful-rules.mjs';
const maps=JSON.parse(fs.readFileSync(new URL('./maps.json',import.meta.url)));
const ai=JSON.parse(fs.readFileSync(new URL('./board-ai.json',import.meta.url)));
const faces=[1,2,3,4,5,6,1,2,3,4,5,6];
const fresh=()=>({rngState:1,modeFlags:0,players:[{position:0,direction:255,chakra:1500,flags:0},{position:0,direction:255,chakra:1500,flags:0x100}],tiles:maps[0].tiles.map(t=>({...t,neighbors:t.neighborSlots,owner:15,level:1,hp:2,effect:0,purchasePrice:t.buyCost}))});
const opts={faces,reserveByte:75,crystalCount:2};
test('stage0 map is nonjunction and original roulette skill uses raw byte0*25',()=>{
 assert.ok(fresh().tiles.every(t=>t.typeCode!==3));assert.equal(R.movementRouletteSkill(ai,10),ai.characterBoardBytes[10][0]*25&255);
});
test('direction255 loop retains mutated cursor/direction across all four passes',()=>{
 const r=R.cpuMovementLookahead(fresh(),1,opts);assert.equal(r.draws,0);assert.equal(r.trace.length,24);
 assert.deepEqual(r.trace.slice(0,7).map(x=>x.tile),[1,2,3,4,5,6,7]);assert.equal(r.trace[23].tile,2);
});
test('known direction scores current tile as minface before walking',()=>{
 const s=fresh();s.players[1].direction=0;const r=R.cpuMovementLookahead(s,1,opts);
 assert.deepEqual(r.trace.map(x=>x.tile),[0,1,2,3,4,5]);assert.equal(r.trace[0].score,0);
 assert.equal(r.trace[1].score,Math.trunc(60*76/180+1200));
});
test('lowwallet and one-short crystal branches take maximum-minus-random',()=>{
 let s=fresh();s.players[1].chakra=699;const r=R.cpuMovementLookahead(s,1,opts);
 assert.equal(r.target,6-ps1Random(1).value%3);assert.equal(r.draws,1);
 s=fresh();s.players[1].flags|=0x1000;assert.equal(R.cpuMovementLookahead(s,1,opts).draws,1);
});
test('skill failure adds fallback draw and excludes twelfthface from range',()=>{
 const r=R.cpuBoardRouletteTarget(fresh(),1,{...opts,faces:[1,2,3,4,5,6,1,2,3,4,5,99],skillByte:0});
 assert.equal(r.draws,2);assert.equal(r.desired,255);assert.ok(r.targetValue>=1&&r.targetValue<=6);
});
test('high skill retains target and consumes one gate draw before wheelstartup',()=>{
 const r=R.cpuBoardRouletteTarget(fresh(),1,{...opts,skillByte:255});assert.equal(r.draws,1);assert.equal(r.desired,r.lookahead.target);assert.equal(r.targetValue,r.desired);
});
test('special previousstates bypass lookahead and skill but still draw fallback',()=>{
 const s=fresh();s.tiles[0].typeCode=3;
 const r=R.cpuBoardRouletteTarget(s,1,{...opts,priorBoardState:14,skillByte:0});assert.equal(r.draws,1);assert.equal(r.lookahead,null);
});
test('junction paths remain explicit rather than guessed',()=>{
 const s=fresh();s.players[1].direction=0;s.tiles[0].typeCode=3;assert.throws(()=>R.cpuMovementLookahead(s,1,opts),/Junction800cadb8/);
});
