/** Original scroll powers; BOARD800ea18c,800d8930,800db29c,800f3658,
 *800f9520. State uses board-effects shape. All commits return fresh state. */
import {barrierChains,barrierRent,ps1Random} from './faithful-rules.mjs';
const byte=n=>n&255,s16=n=>n<<16>>16,clamp=n=>Math.max(-9999,Math.min(99999,n));
const copy=s=>({...s,players:s.players.map(p=>({...p})),tiles:s.tiles.map(t=>({...t})),events:[]});
export const SCROLL_POWERS=Object.freeze([
 {id:0,name:'大革命の術',messageId:0x325},
 {id:1,name:'天変地異の術',messageId:0x329},
 {id:2,name:'結界ブン取りの術',messageId:0x32e},
 {id:3,name:'究極チャクラ大吸収の術',messageId:0x338},
]);
export function scrollPowerOptions(state,actor){
 const p=state.players[actor];if(!p)throw new RangeError('Player required');
 const targets=state.tiles.flatMap((t,i)=>t.typeCode===5&&t.owner!==actor&&
   (!(state.modeFlags&0x1000)||state.players[t.owner]?.team!==p.team)?[i]:[]);
 const gates=[byte(p.scrollNegativeBonusCount??0)>=2,byte(p.scrollBonusCount??0)!==0,targets.length>0,byte(p.scrollRollCount??0)>=8];
 return SCROLL_POWERS.map((v,i)=>({...v,enabled:!!(p.flags&0x200)&&gates[i],targets:i===2?targets:[]}));
}
/** On acquisition800e70c8, even when transferred from another player. */
export function resetScrollCounters(player){return {...player,scrollBonusCount:0,scrollNegativeBonusCount:0,scrollRollCount:0};}
/** Call before adding the source bonus, only after a full crystal circuit. */
export function recordScrollSourceBonus(player){
 if(!(player.flags&0x200))return {...player};
 return {...player,scrollBonusCount:byte((player.scrollBonusCount??0)+1),
  scrollNegativeBonusCount:byte((player.scrollNegativeBonusCount??0)+(player.chakra<0?1:0))};
}
/**800f3658: ordinary movement roulette completion only, NOT forced steps. */
export function recordScrollMovementRoll(player){return {...player,scrollRollCount:byte((player.scrollRollCount??0)+((player.flags&0x200)?1:0))};}
export function scrollPowerRouletteFaces(power,scenarioRoulette){
 if(power===0)return [];
 if(power===1||power===2)return Array.from({length:12},(_,i)=>i);
 if(power!==3||scenarioRoulette?.length!==12)throw new TypeError('Original twelve movement faces required');
 return scenarioRoulette.slice();
}
/**800bd82c (also800f3658 special return0xe). Deliberately excludes slot11
 * when computing range;8010be90 accepts only values occurring on thewheel. */
export function cpuScrollRouletteTarget(faces,rngState,{previousTarget}={}){
 if(faces?.length!==12)throw new TypeError('Twelve original roulette faces required');
 const minimum=Math.min(20,...faces.slice(0,11)),maximum=Math.max(0,...faces.slice(0,11));
 const r=ps1Random(rngState),requested=minimum+r.value%(maximum+1-minimum),accepted=faces.includes(requested);
 if(!accepted&&previousTarget===undefined)throw new Error('Original rejected target retains previous wheel target');
 return {target:accepted?requested:previousTarget,requested,accepted,rngState:r.state,draws:1};
}
/** Consumption precedes target selection/roulette; there is no cancellation
 * refund afterward. Skill points are untouched. */
export function consumeScrollPower(state,actor,power){
 if(state.scrollAction)throw new Error('Scroll action already in progress');
 if(!scrollPowerOptions(state,actor)[power]?.enabled)throw new RangeError('Unavailable scroll power');
 const s=copy(state),p=s.players[actor];p.flags&=0xfdff;p.scrollBonusCount=0;p.scrollNegativeBonusCount=0;
 s.scrollAction={actor,power};s.events.push({type:'scroll-used',actor,power,nativeCounter:'800150cc',category:power});return s;
}
/** Apply after roulette/effect commits. Power2 defender rolls FIRST; 11 ends
 * immediately (do not request attacker roll). Failure debits attacker only:
 *800dc2e0 cases0/16 do not credit the owner or double/consume tile effect5.
 * Power3 rolls are [{actor:opponentIndex,value}] in original player order. */
export function resolveScrollPower(state,{value,target,defenderRoll,attackerRoll,rolls}={}){
 if(!state.scrollAction)throw new Error('Consume a scroll first');
 const s=copy(state),{actor,power}=s.scrollAction,p=s.players[actor];
 const roll=(v,max=11)=>{if(!Number.isInteger(v)||v<0||v>max)throw new RangeError('Original roulette value required');return v;};
 let outcome={actor,power,endTurn:true};
 if(power===0){
  for(const q of s.players)q.chakra=Math.max(-9999,-q.chakra); //800f9520; direct, not queued
 }else if(power===1){
  const success=roll(value)>=6;outcome.success=success;
  if(success)for(const t of s.tiles)if(t.typeCode===5){t.level=6-t.level;t.hp=t.level+1;}
 }else if(power===2){
  const t=s.tiles[target];
  if(!t||t.typeCode!==5||t.owner===actor||((s.modeFlags&0x1000)&&s.players[t.owner]?.team===p.team))throw new RangeError('Enemy ordinary barrier required');
  const defend=roll(defenderRoll),success=defend!==11&&roll(attackerRoll)>defend;
  outcome={...outcome,target,defender:t.owner,success,defenderRoll:defend,attackerRoll:defend===11?null:attackerRoll};
  if(success){t.owner=actor;t.repairCounter=0;outcome.recalculateChains=true;
   s.events.push({type:'barrier-challenge-won',actor,opponent:outcome.defender,nativeCounter:'80014818'});
  }else{
   const amount=barrierRent(t,barrierChains(s.tiles).chains[target]),delta=s16(-amount);
   p.chakra=clamp(p.chakra+delta);outcome.amount=amount;outcome.delta=delta;
  }
 }else{
  // This module's multi-opponent order is source normal free-for-all only.
  if(s.modeFlags&0x1000)throw new RangeError('Team absorption target state is outside story1');
  const targets=[];for(let j=1;j<s.players.length;j++){const id=(actor+j)%s.players.length;if(!((s.players[id].actorStatus??0)&1))targets.push(id);}
  if(!Array.isArray(rolls)||rolls.length!==targets.length||rolls.some((r,i)=>r.actor!==targets[i]))throw new RangeError('One original opponent roulette result per target required');
  let total=0;outcome.payments=[];
  for(const r of rolls){const amount=roll(r.value,12)*500;total+=amount;const delta=s16(-amount);s.players[r.actor].chakra=clamp(s.players[r.actor].chakra+delta);outcome.payments.push({actor:r.actor,amount,delta});}
  p.chakra=clamp(p.chakra+s16(total));outcome.total=total;
 }
 s.events.push({type:'scroll-resolved',...outcome});s.scrollAction=null;return {...s,scrollOutcome:outcome};
}

// Integration alias: call BEFORE startBoardRoulette, using actual current faces.
export const selectScrollCpuTarget=cpuScrollRouletteTarget;

/**800bd114 debt-notice branch only. notice is GLOBAL DAT8013ea96, not per
 * player. Call only at original notice checkpoints for the scroll holder.
 * Preserve the high-bit latch across turns; source bonus clears it, pickup
 * resets the whole byte. Other scroll-charge notices are separate globals. */
export function scrollDebtNotice(player,notice=0){
 if(!Number.isInteger(notice)||notice<0||notice>255)throw new RangeError('Original debt notice byte required');
 const p={...player},debt=byte(p.scrollNegativeBonusCount??0),low=notice&127;
 const result={player:p,notice,messageId:null,remainingBonuses:null,reset:false};
 if(notice&128)return result;
 if(p.chakra>=0&&low!==0){
  p.scrollNegativeBonusCount=0;
  return {...result,notice:128,messageId:0x324,reset:true,nativeCounter:'80014098'};
 }
 if(low===127)return result;
 if(debt>=2)return {...result,notice:255,messageId:0x323};
 if(p.chakra<0)return {...result,notice:byte((notice+1)|128),messageId:0x322,remainingBonuses:2-debt};
 return result;
}
/**800edd68 case1, before source-bonus award/notice evaluation. */
export const clearScrollDebtNoticeLatch=notice=>byte(notice)&127;
