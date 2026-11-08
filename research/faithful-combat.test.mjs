import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ps1Random} from './faithful-rules.mjs';
import * as combat from './faithful-combat.mjs';
const data=JSON.parse(readFileSync(new URL('./full-rules.json',import.meta.url)));
const techniques=JSON.parse(readFileSync(new URL('./techniques.json',import.meta.url)));

test('all valid executable techniques have no reserved0x20 fallback',()=>{
  const all=techniques.flatMap(c=>[...c.attacks,...c.defenses]);
  assert.equal(all.length,92);assert.equal(all.filter(t=>t.flags&0x20).length,0);
  assert.equal(combat.combatChoices(techniques[0],0,1,1500).length,4);
  assert.equal(combat.combatChoices(techniques[6],1,0,1500).length,3);
  assert.deepEqual(combat.combatChoices(techniques[6],1,0,1500).map(t=>t.inputSlot),[0,1,3]);
  assert.equal(combat.combatChoices(techniques[9],0,0,1500).length,2);
  assert.equal(combat.combatChoices(techniques[9],0,8,1500).length,3);
  assert.equal(combat.combatChoices(techniques[12],0,11,1500).length,4);
  assert.equal(combat.combatChoices(techniques[12],0,3,1500).length,3);
});

test('CPU stopping uses source character skill and two draws',()=>{
  assert.deepEqual(data.combat.aiSkillByCharacter,[1,2,3,3,4,2,2,3,2,1,2,8,1]);
  const result=combat.cpuCombatStop(Array.from({length:12},(_,i)=>i),data.combat.aiSkillByCharacter[11],1);
  assert.equal(result.rank,11);assert.equal(result.value,11);
  assert.equal(result.state,ps1Random(ps1Random(1).state).state);
});

test('held combat cards alter both cost/power fields only on eligible side',()=>{
  const technique=techniques[1].attacks[0];
  assert.equal(combat.applyCombatCard(technique,0,data.cards[22]).cost,40);
  assert.equal(combat.applyCombatCard(technique,0,data.cards[22]).alternateCost,150);
  assert.equal(combat.applyCombatCard(technique,1,data.cards[22]).cost,80);
  assert.equal(combat.applyCombatCard(technique,0,data.cards[26]).power,5);
  assert.equal(combat.applyCombatCard(technique,0,data.cards[26]).alternatePower,3);
  assert.equal(combat.applyCombatCard(technique,1,data.cards[23]).cost,0);
  assert.equal(combat.combatChoices(techniques[0],0,1,25,data.cards[22])[0].disabled,false);
  assert.equal(combat.combatChoices(techniques[0],0,1,-10)[0].disabled,true);
});

test('roulette uses source mask and consumes12 random values including zero faces',()=>{
  const t=techniques[0].attacks[0];
  const far=combat.combatRoulette(t,1,12,data.combat,1);
  assert.equal(far.row,0);assert.deepEqual(far.faces.slice(0,11),Array(11).fill(0));
  assert.ok(far.faces[11]>=1&&far.faces[11]<=4);
  const near=combat.combatRoulette(t,0,0,data.combat,1);
  assert.deepEqual(near.faces.slice(0,5),[3,2,1,2,2]);
  assert.ok(near.faces.every(x=>x>=1&&x<=3));
  let state=1;for(let i=0;i<12;i++)state=ps1Random(state).state;
  assert.equal(near.state,state);assert.equal(far.state,state);
  assert.deepEqual(data.combat.rouletteMasks.map(row=>row.reduce((a,b)=>a+b)),[1,1,2,3,4,5,6,7,8,9,10,11,12]);
});

test('special roulette branch preserves offset and three additional zero masks',()=>{
  const result=combat.combatRoulette({flags:0x11,power:2,alternatePower:6},0,0,data.combat,1);
  assert.equal(result.row,9);assert.deepEqual(result.faces.slice(0,3),[2,2,2]);
  assert.ok(result.faces.slice(3).every(x=>x>=3&&x<=8));
});

test('resolution has exact counter polarity, capped hp damage and paid costs',()=>{
  const setup={attack:techniques[0].attacks[2],defense:techniques[0].defenses[2],attackRoll:3,defenseRoll:1,hp:2,attackerChakra:1000,defenderChakra:1000};
  const counter=combat.resolveCombat(setup);assert.equal(counter.counter,true);assert.equal(counter.damage,0);assert.equal(counter.attackerChakra,950);assert.equal(counter.defenderChakra,850);
  const normal=combat.resolveCombat({...setup,attack:techniques[0].attacks[0]});assert.equal(normal.counter,false);assert.equal(normal.damage,2);assert.equal(normal.captured,true);
  const failing=combat.resolveCombat({...setup,attack:techniques[0].attacks[0],attackRoll:0,defenseRoll:4});assert.equal(failing.damage,0);
});
