import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as C from './story1-cpu.mjs';
const rules=JSON.parse(fs.readFileSync(new URL('./full-rules.json',import.meta.url)));
const fresh=()=>({rngState:1,modeFlags:0,players:[{position:0,chakra:1500,flags:0x100,inventory:[]},{position:1,chakra:1500,flags:0,inventory:[]}],tiles:[{typeCode:5,owner:1,level:1,hp:2,effect:0,neighbors:[255,255,255,255],rents:[100,200,300,400,500]},{typeCode:4,neighbors:[255,255,255,255]}]});
const opts={relationship:1,reserveByte:75,techniqueCosts:[0,50,150,50],hasFifthTechnique:false};
test('scenario0 relationships are zero-extended raw bytes',()=>{
 assert.deepEqual(C.scenarioRelationships(rules.scenarios[0]),[[0,0,0,0],[1,0,0,0]]);
 assert.deepEqual(C.scenarioRelationships({players:[{unknownControlBytes:[255,128,0,1]}]}),[[255,128,0,1]]);
});
test('zero-cost techniques alone do not enable attack and half-cost22 marks forced use',()=>{
 const p={chakra:0,inventory:[]};assert.equal(C.enemyBarrierAttackEligibility(p,{techniqueCosts:[0,50],hasFifthTechnique:false}).available,false);
 p.chakra=25;p.inventory=[22];assert.deepEqual(C.enemyBarrierAttackEligibility(p,{techniqueCosts:[0,50],hasFifthTechnique:false}),{available:true,eligibility:1,minimumCost:25,forceHalfCostCard:true});
 p.chakra=-1;assert.equal(C.enemyBarrierAttackEligibility(p,{techniqueCosts:[50],hasFifthTechnique:true}).eligibility,16);
});
test('ordinary affordable low toll generally pays with source RNG, regardless old heuristic',()=>{
 const r=C.cpuEnemyBarrierChoice(fresh(),0,opts);assert.equal(r.action,'pay');assert.equal(r.draws,1);
});
test('low HP immediately uses relationship comparison; weak relation still pays',()=>{
 const s=fresh();s.tiles[0].hp=1;
 let r=C.cpuEnemyBarrierChoice(s,0,opts);assert.equal(r.action,'pay');assert.equal(r.draws,1);
 r=C.cpuEnemyBarrierChoice(s,0,{...opts,relationship:200});assert.equal(r.action,'attack');assert.equal(r.draws,1);
});
test('high toll or unaffordable toll attacks without RNG; exact701 boundary',()=>{
 const s=fresh();s.tiles[0].rents[0]=701;
 let r=C.cpuEnemyBarrierChoice(s,0,opts);assert.equal(r.action,'attack');assert.equal(r.draws,0);
 s.tiles[0].rents[0]=100;s.players[0].chakra=99;r=C.cpuEnemyBarrierChoice(s,0,opts);assert.equal(r.action,'attack');assert.equal(r.draws,0);
});
test('relationship255 pays and mode1 attacks without random draws',()=>{
 const s=fresh();s.modeFlags=1;
 assert.equal(C.cpuEnemyBarrierChoice(s,0,{...opts,relationship:255}).action,'pay');
 const r=C.cpuEnemyBarrierChoice(s,0,opts);assert.equal(r.action,'attack');assert.equal(r.draws,0);
});
test('unavailable attack pays before any policy RNG; double effect ignored in policy',()=>{
 const s=fresh();s.players[0].chakra=49;
 let r=C.cpuEnemyBarrierChoice(s,0,opts);assert.equal(r.reason,'unavailable');assert.equal(r.draws,0);
 s.players[0].chakra=1500;s.tiles[0].effect=5;
 assert.equal(C.cpuEnemyBarrierChoice(s,0,opts).action,'pay');
});
