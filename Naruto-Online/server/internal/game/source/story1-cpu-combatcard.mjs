/** BOARD800d6e7c attack cases9..13; defense14..18.
 * CPU accepts the use-card dialog (80103e40(1),80103e5c(0)), then random-slot
 * rejection samples up to50 attempts. Selection is independent of chakra/skill. */
import {ps1Random} from './faithful-rules.mjs';
export function cpuCombatCard({inventory,cards,side,rngState,mandatoryHalfCost=false}){
 if(side!==0&&side!==1)throw new RangeError('side0 attack or1 defense required');
 let draws=0;const originalSeed=rngState>>>0;rngState=originalSeed;
 const compatible=id=>cards[id]&&((side===0?[8,9]:[10,11]).includes(cards[id].type));
 const done=(slot,extra={})=>({slot,cardId:slot===255?255:inventory[slot],available:inventory.slice(0,3).some(compatible),valid:slot!==255&&compatible(inventory[slot]),rngState,draws,...extra});
 if(side===0&&mandatoryHalfCost){const slot=inventory.slice(0,3).indexOf(22);return done(slot<0?255:slot,{forced:true});}
 if(!inventory.slice(0,3).some(compatible))return done(255,{forced:false});
 let slot=255;
 for(let attempt=0;attempt<50;attempt++){const r=ps1Random(rngState);rngState=r.state;draws++;slot=r.value%3;if(compatible(inventory[slot]))break;}
 return done(slot,{forced:false});
}
