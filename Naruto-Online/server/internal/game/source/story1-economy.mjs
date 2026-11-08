/** Story1 economy from BOARD: sale800d15a8/e0298/e03b0, queue800be5d8.
 * Uses board-effects state shape. Scope/transition contract: story1-economy.md. */
import {barrierChains,barrierRent} from './faithful-rules.mjs';
const s16=x=>x<<16>>16;
const clamp=x=>Math.min(99999,Math.max(-9999,x));
const copy=s=>({...s,players:s.players.map(p=>({...p})),tiles:s.tiles.map(t=>({...t})),events:[]});
export function saleValue(tile){
 const increment=tile.saleIncrement??tile.unknownValues?.[0],base=tile.saleBase??tile.unknownValues?.[1];
 if(![increment,base,tile.level].every(Number.isInteger))throw new TypeError('Original sale base/increment/level required');
 return s16((base&65535)+(tile.level-1)*(increment&65535));
}
export function forcedSaleCandidates(state,actor){
 return state.tiles.flatMap((t,i)=>t.typeCode===5&&t.owner===actor?[{tile:i,value:saleValue(t)}]:[]);
}
/** Call specifically at800dc2e0 case7 after toll, not for every negative wallet.
 * projectedChakra is original +4f0 captured before the queued toll completes. */
export function forcedSaleRequired(state,actor,{projectedChakra}={}){
 if(!Number.isInteger(projectedChakra))throw new TypeError('Original post-toll projectedChakra required');
 return !(state.modeFlags&1)&&projectedChakra<0&&state.tiles.some(t=>t.typeCode===5&&t.owner===actor);
}
/**800e0298 first strict minimum rent + chain extra*2000; no RNG. */
export function cpuForcedSale(state,actor){
 const chains=barrierChains(state.tiles).chains;let score=100000,tile;
 for(let i=0;i<state.tiles.length;i++){const t=state.tiles[i];if(t.typeCode!==5||t.owner!==actor)continue;
  const n=barrierRent(t,chains[i])+chains[i]*2000;if(n<score){score=n;tile=i;}
 }
 if(tile===undefined)throw new Error('Original sale chooser retains incoming s4 without a candidate');
 return {tile,score,value:saleValue(state.tiles[tile])};
}
/** Logical commit after sale confirmation and payment animation. Tile packed
 * word becomesf020. Source does NOT reset tile+6 repair counter here. */
export function commitBarrierSale(state,actor,tileId){
 const s=copy(state),t=s.tiles[tileId];
 if(!t||t.typeCode!==5||t.owner!==actor)throw new RangeError('Sale requires an owned ordinary barrier');
 const delta=saleValue(t),projectedChakra=s.players[actor].chakra+delta;
 s.players[actor].chakra=clamp(projectedChakra);
 Object.assign(t,{typeCode:4,owner:15,level:1,hp:2,effect:0});
 const candidates=forcedSaleCandidates(s,actor);
 s.events.push({type:'barrier-sold',actor,tile:tileId,delta});
 return {...s,saleDelta:delta,projectedChakra,needsAnotherSale:projectedChakra<0&&candidates.length>0,candidates};
}
/** Remote crystal/source upgrade is exactly +1 for basecost; local own-barrier
 * multi-level upgrades use faithful-rules.upgradePrice instead. */
export function remoteUpgradeChoices(state,actor){
 return state.tiles.flatMap((t,i)=>t.typeCode===5&&t.owner===actor&&t.level<5?
  [{tile:i,level:t.level+1,cost:t.upgradeBase,disabled:state.players[actor].chakra<t.upgradeBase}]:[]);
}
export function commitRemoteUpgrade(state,actor,tileId){
 const choice=remoteUpgradeChoices(state,actor).find(c=>c.tile===tileId&&!c.disabled);
 if(!choice)throw new RangeError('Unavailable remote upgrade');
 const s=copy(state),t=s.tiles[tileId];t.level++;t.hp++;
 const delta=s16(-t.upgradeBase);s.players[actor].chakra=clamp(s.players[actor].chakra+delta);
 s.events.push({type:'remote-upgrade',actor,tile:tileId,delta});return s;
}
/** Original non-team queued chakra animation: first call initializes decimal
 * counters; following calls consume one unit of the smallest remaining place.
 * -32768 is explicit unresolved signed-negation overflow, outside story1 data. */
export function startChakraPayment(chakra,delta){
 delta=s16(delta);if(delta===-32768)throw new RangeError('Original negative32768 queue overflows its short magnitude');
 const magnitude=Math.abs(delta),digits=Array.from({length:5},(_,i)=>Math.trunc(magnitude/10**i)%10);
 return {chakra,originalChakra:chakra,delta,digits,initialized:false,done:delta===0,ticks:0,crossedIntoDebt:false};
}
export function tickChakraPayment(payment){
 const q={...payment,digits:payment.digits.slice()};if(q.done)return q;q.ticks++;
 if(!q.initialized){q.initialized=true;return q;}
 const place=q.digits.findIndex(n=>n!==0);
 if(place>=0){q.digits[place]--;q.chakra=clamp(q.chakra+(q.delta<0?-1:1)*10**place);}
 if(q.chakra===99999||q.chakra===-9999)q.digits.fill(0);
 if(q.digits.every(n=>n===0)){q.done=true;q.crossedIntoDebt=q.originalChakra>=0&&q.chakra<0;}
 return q;
}
