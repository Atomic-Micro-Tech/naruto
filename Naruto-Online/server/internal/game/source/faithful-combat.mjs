import {ps1Random} from './faithful-rules.mjs';

/** COMBAT_SETUP8011c680 and main80015d24/15e84. `character` is one entry
 * from techniques.json; scenario board ninjutsu loadout is unrelated.
 */
export function combatChoices(character, side, opponentId, chakra, card) {
  const entries=(side===0?character.attacks:character.defenses).slice().sort((a,b)=>a.tableSlot-b.tableSlot);
  const fallback=entries.find(t=>(t.flags&0x20)!==0);
  // Original indexed search stops when it encounters a reserved fallback.
  const stop=fallback?entries.indexOf(fallback):entries.length;
  let choices=entries.slice(0,Math.min(4,stop));
  if(side===0 && [9,12].includes(character.characterId) && ![11,8].includes(opponentId))
    choices=choices.slice(0,-1);
  return choices.map((t,index)=>({...applyCombatCard(t,side,card),index,
    inputSlot:side===1 && index===choices.length-1 ? 3 : index,
    disabled:applyCombatCard(t,side,card).cost>Math.max(0,chakra)}));
}

export function applyCombatCard(technique, side, card) {
  const t={...technique};
  if(side===0 && card?.type===8) {
    t.cost=Math.trunc(t.cost/2);t.alternateCost=Math.trunc(t.alternateCost/2);
  } else if(side===1 && card?.type===10) { t.cost=0;t.alternateCost=0; }
  if(side===0 && card?.type===9 && [1,2,3].includes(card.value)) {
    t.power+=card.value;t.alternatePower+=card.value;
  }
  return t;
}

/** FUN_8011f2fc. Produces actual12 slots, not a random selected result.
 * distanceSteps is original board-route count (battle packet+16 divided10).
 * Human stopping index/timing and CPU policy remain separate decisions.
 */
export function combatRoulette(technique, side, distanceSteps, combatData, state) {
  if(![0,1].includes(side)||!Number.isInteger(distanceSteps)||distanceSteps<0)
    throw new RangeError('Invalid combat roulette inputs');
  const special=!!(technique.flags&0x10);
  const row=Math.max(0,12-distanceSteps-(special?3:0));
  const range=special?technique.alternatePower:combatData.rouletteRanges[side];
  if(range===0)throw new RangeError('Original roulette traps on zero range');
  const offset=special?technique.power:0,faces=[];
  for(const mask of combatData.rouletteMasks[row]) {
    const r=ps1Random(state);state=r.state;faces.push(mask*(r.value%range+1)+offset);
  }
  return {faces,state,row};
}

/** AI stop policy8011ef10: one discarded rand then rand()%5, select sorted
 * face at clamp(aiSkill+draw,0,11). Initial skill comes from
 * full-rules.json combat.aiSkillByCharacter (80064d01, stride2).
 */
export function cpuCombatStop(faces, aiSkill, state) {
  state=ps1Random(state).state;
  const r=ps1Random(state);state=r.state;
  const rank=Math.max(0,Math.min(11,aiSkill+r.value%5));
  return {value:faces.slice().sort((a,b)=>a-b)[rank],rank,state};
}

/** Arithmetic8011f4d8. Inputs are techniques after card modifiers and the
 * explicit roulette results. Tolls/capture transfers happen in board code.
 */
export function resolveCombat({attack,defense,attackRoll,defenseRoll,hp,attackerChakra,defenderChakra}) {
  const signed16=x=>(x<<16)>>16;
  let attackTotal=signed16(attack.power+attackRoll);
  const defenseTotal=signed16(defense.power+defenseRoll);
  let difference=signed16(attackTotal-defenseTotal);
  const counter=!!(defense.flags&4) && ((!!(defense.flags&8))===(!!(attack.flags&4)));
  if(counter){difference=0;attackTotal=0;}
  const damage=Math.min(hp,Math.max(0,difference));
  return {attackTotal,defenseTotal,counter,damage,hp:hp-damage,captured:hp-damage===0,
    attackerChakra:Math.max(-9999,attackerChakra-attack.cost),
    defenderChakra:Math.max(-9999,defenderChakra-defense.cost)};
}
