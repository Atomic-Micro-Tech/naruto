/** Enemy-barrier decision800f1290 case4; independent of turn menu800c88f0. */
import {barrierChains,barrierRent,ps1Random} from './faithful-rules.mjs';
const s16=x=>x<<16>>16;
/** Main800162a0 lbu at800162d0; scenario loader80012eac writes these bytes
 * through80016258. No character relation multiplier or signed-byte conversion. */
export function scenarioRelationships(scenario){return scenario.players.map(p=>{
 if(!p.unknownControlBytes||p.unknownControlBytes.length!==4)throw new TypeError('Original four scenario control bytes required');
 return p.unknownControlBytes.map(x=>x&255);
});}
/** All original attack records, before combat's four-slot pruning. Zero costs
 * excluded when finding minimum. A fifth technique is the original getter's
 * success result for index4, not inferred from first4 UI choices. */
export function enemyBarrierAttackEligibility(player,{techniqueCosts,hasFifthTechnique}={}){
 if(!Array.isArray(techniqueCosts)||typeof hasFifthTechnique!=='boolean')throw new TypeError('Original attack costs and fifth-getter result required');
 let minimumCost=10000;for(const value of techniqueCosts){const cost=s16(value);if(cost!==0&&cost<minimumCost)minimumCost=cost;}
 const hasHalfCostCard=player.inventory.includes(22),forceHalfCostCard=hasHalfCostCard&&player.chakra<minimumCost;
 if(hasHalfCostCard)minimumCost=Math.trunc(minimumCost/2);
 let eligibility=minimumCost<=player.chakra?1:0;
 if(player.chakra<0&&hasFifthTechnique)eligibility|=16;
 return {available:eligibility!==0,eligibility,minimumCost,forceHalfCostCard};
}
/** Call once when original attack/pay dialog is initialized. Result choice0
 * attacks,1 pays. relationship is actor's scenario byte indexed by owner.
 * This routine uses base chain rent; double-toll effect does not change AI rent.
 */
export function cpuEnemyBarrierChoice(state,actor,{relationship,reserveByte,techniqueCosts,hasFifthTechnique}={}){
 if(!Number.isInteger(relationship)||!Number.isInteger(reserveByte))throw new TypeError('Original relationship and reserveByte required');
 const p=state.players[actor],t=state.tiles[p.position];
 if(t.typeCode!==5||t.owner===actor)throw new RangeError('Ordinary enemy barrier required');
 const eligibility=enemyBarrierAttackEligibility(p,{techniqueCosts,hasFifthTechnique});
 let rngState=state.rngState>>>0,draws=0;
 const draw=()=>{const r=ps1Random(rngState);rngState=r.state;draws++;return r.value;};
 const done=(choice,reason)=>({...eligibility,choice,action:choice===0?'attack':'pay',reason,rngState,draws});
 if(!eligibility.available)return done(1,'unavailable');
 relationship=s16(relationship);
 if(relationship===255)return done(1,'relationship255');
 if(state.modeFlags&0x80)return done(state.players[t.owner].flags&0x100?1:0,'scenario80');
 if(state.modeFlags&1)return done(0,'elimination');
 if((state.modeFlags&8)&&(state.players[t.owner].flags&0x200)&&draw()%256<=relationship)return done(0,'scroll-roll');
 const rent=barrierRent(t,barrierChains(state.tiles).chains[p.position]);
 if((p.chakra-rent>=0&&rent<701)||relationship>179){
  let compareRelationship=t.hp===1||Math.trunc(p.chakra/3)<rent;
  if(!compareRelationship)compareRelationship=draw()%256<(reserveByte&255);
  if(compareRelationship&&draw()%256<=relationship)return done(0,'relationship-roll');
  if(rent<1001)return done(1,'affordable-rent');
 }
 return done(0,'high-rent-or-debt');
}
