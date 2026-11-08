import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {cpuCombatCard} from './story1-cpu-combatcard.mjs';import {ps1Random} from './faithful-rules.mjs';
const cards=JSON.parse(fs.readFileSync(new URL('./full-rules.json',import.meta.url))).cards;
cards[60]={id:60,type:11}; // branch exists in source; no shipped type11 record.
const type=n=>cards.find(c=>c?.type===n).id;
test('CPU always accepts offered attackcard and samples original3slots',()=>{
 const inventory=[255,type(8),255];const r=cpuCombatCard({inventory,cards,side:0,rngState:1});assert.equal(r.cardId,type(8));assert.equal(r.valid,true);
 let seed=1,n=0,slot;do{const v=ps1Random(seed);seed=v.state;slot=v.value%3;n++;}while(slot!==1&&n<50);assert.equal(r.draws,n);assert.equal(r.rngState,seed);
});
test('attack side permits types8/9; defense permits10/11',()=>{
 for(const side of[0,1])for(const t of[8,9,10,11]){const r=cpuCombatCard({inventory:[type(t),type(t),type(t)],cards,side,rngState:1});assert.equal(r.valid,(side===0?[8,9]:[10,11]).includes(t));assert.equal(r.draws,r.valid?1:0);}
});
test('mandatoryhalf cost card22 selects firstslot without acceptance RNG',()=>{
 const r=cpuCombatCard({inventory:[type(9),22,22],cards,side:0,rngState:123,mandatoryHalfCost:true});assert.equal(r.slot,1);assert.equal(r.cardId,22);assert.equal(r.rngState,123);assert.equal(r.draws,0);assert.equal(r.forced,true);
});
test('mandatory missing22 selects nothing; defense does not use attacker forcedflag',()=>{
 const r=cpuCombatCard({inventory:[type(9),255,255],cards,side:0,rngState:1,mandatoryHalfCost:true});assert.equal(r.slot,255);assert.equal(r.draws,0);
 const d=cpuCombatCard({inventory:[type(10),type(10),type(10)],cards,side:1,rngState:1,mandatoryHalfCost:true});assert.equal(d.valid,true);assert.equal(d.draws,1);
});
