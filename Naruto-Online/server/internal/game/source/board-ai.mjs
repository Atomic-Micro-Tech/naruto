/** CPU policies translated from BOARD.c. See board-ai.md for required source
 * inputs and explicit limits; no browser engine dependencies or guessed BFS. */
import {ps1Random,barrierChains,barrierRent,upgradePrice} from './faithful-rules.mjs';
const s16=n=>n<<16>>16;
const byte=n=>n&255;
const draw=rng=>{const r=ps1Random(rng.state);rng.state=r.state;rng.draws++;return r.value;};
const rngFrom=state=>({state:state>>>0,draws:0});
const crystalCount=(flags,n)=>Array.from({length:n},(_,i)=>(flags>>>(12+i))&1).reduce((a,b)=>a+b,0);

export function characterCpuParameters(data,id){
 const b=data.characterBoardBytes[id],c=data.characterCombatBytes[id];
 if(!b||!c)throw new RangeError('Unknown character');
 return {reserveByte:byte(b[1]*25),cardPriority:b[2],discardPriority:b[3],
  jutsuPriority:b[5],jutsuFrequency:b[6],combatChoiceSkill:c[0],combatStopSkill:c[1]};
}
export function cpuReserveThreshold(reserveByte){
 if(!Number.isInteger(reserveByte))throw new TypeError('Original reserve byte required');
 return 300+((byte(reserveByte)+1)/180)*300;
}

/**800c7f7c. Return menu choice0=yes,1=no and original chosen upgrade tile.
 * candidateTiles must be original menu list order (+0x2fc), not arbitrary tiles. */
export function cpuPurchaseOrRemoteUpgrade(state,actor,{reserveByte,candidateTiles=[]}={}){
 const p=state.players[actor],tile=state.tiles[p.position];
 let choice=p.chakra>=cpuReserveThreshold(reserveByte)?0:1,upgradeTile=255;
 if(choice===0&&tile.typeCode!==4){
  const chains=barrierChains(state.tiles).chains;let best=-10000;
  for(const id of candidateTiles){const t=state.tiles[id];
   if(t.upgradeBase<=p.chakra){const score=barrierRent(t,chains[id])+(t.level-1)*30;
    if(best<score){best=score;upgradeTile=id;}}
  }
 }
 const defeats=((state.defeatCounters??0)&15)+((state.defeatCounters??0)>>>4);
 if((state.modeFlags&0x80)&&tile.typeCode===4&&actor>=2&&actor<4&&defeats>=5)choice=1;
 return {choice,upgradeTile};
}

/**800ce628. Original eight menu action IDs;0=upgrade,6=end. Always consumes one
 * random draw even if the persistent decision byte already hasbit0x80. */
export function cpuOwnedBarrierAction(state,actor,{reserveByte,menuActions,decisionByte=0}={}){
 if(!Array.isArray(menuActions)||menuActions.length!==8)throw new TypeError('Eight original menu action slots required');
 const rng=rngFrom(state.rngState),r=draw(rng),p=state.players[actor],t=state.tiles[p.position];
 decisionByte=(decisionByte&128)?128:(r%256-1<byte(reserveByte)?128:129);
 let best=0,slot=255,upgradeIndex=-1;
 for(let i=0;i<8;i++){
  if(menuActions[i]===0&&best<301){
   let selected=-1;
   for(let jump=1;jump<=5-t.level;jump++)if(p.chakra-upgradePrice(t.upgradeBase,t.level,t.level+jump)>=cpuReserveThreshold(reserveByte))selected=jump-1;
   if(selected>=0){upgradeIndex=selected;best=300;slot=i;}
  }else if(menuActions[i]===6&&best<251){slot=i;best=250;}
 }
 if(slot===255)return {slot,upgradeIndex,decisionByte,rngState:rng.state,draws:rng.draws,unresolved:'original reads menu slot255'};
 if(menuActions[slot]===6)decisionByte=0;
 return {slot,action:menuActions[slot],upgradeIndex,decisionByte,rngState:rng.state,draws:rng.draws};
}

/**800c7574: selection among three drawn chance cards. */
export function cpuChanceChoice(state,actor,{cards,priority,priorityTable,crystalTileIds,currentActor=actor}={}){
 if(cards.length!==3)throw new TypeError('Exactly three chance choices required');
 const rng=rngFrom(state.rngState);if(priority>=5)return {slot:draw(rng)%3,rngState:rng.state,draws:rng.draws};
 const row=priorityTable[priority],p=state.players[actor],missing=crystalCount(p.flags,crystalTileIds.length)<crystalTileIds.length;
 let best=1000,slot=0,teleportTarget;
 for(let i=0;i<3;i++)for(let j=0;j<60;j++)if(cards[i]===row[j]){
  let score=j;
  if(cards[i]===11&&missing)score-=200;
  if(cards[i]===36&&(state.modeFlags&8))for(let q=0;q<state.players.length;q++){
   const target=state.players[q];
   if(missing&&q!==currentActor&&(target.flags&0x100)&&!target.inventory.includes(21)){score-=100;teleportTarget=q;}
  }
  if(score<best){best=score;slot=i;}
 }
 return {slot,teleportTarget,rngState:rng.state,draws:rng.draws};
}
/**800c7870 chooses greatest matching position in16-byte discard preference. */
export function cpuDiscardChoice({cards,priority,priorityTable,rngState}){
 const rng=rngFrom(rngState);if(priority===3)return {slot:draw(rng)%4,rngState:rng.state,draws:rng.draws};
 let slot=0,best=0;
 for(let i=0;i<4;i++)if(cards[i]!==255)for(let j=0;j<16;j++)
  if(cards[i]===priorityTable[priority][j]&&best<j){best=j;slot=i;}
 return {slot,rngState:rng.state,draws:rng.draws};
}

/**800b94e8 sets persistent80089d9c, read by main8001a18c. Human ordinary
 * defenders retain previous choice; type8 always uses defender slot0. */
export function cpuDefenderChoice(state,defender,tileId,{previousChoice}={}){
 const t=state.tiles[tileId],p=state.players[t.typeCode===8?0:defender];
 if(t.typeCode===8){
  if((p.flags&0x100)||(p.status&0x20))return p.chakra<301?0:1;
 }else if(p.flags&0x100){
  if((state.modeFlags&1)||((state.modeFlags&8)&&(p.flags&0x200)))return 0;
  const chain=barrierChains(state.tiles).chains[tileId];
  return chain<2&&t.rents[t.level-1]<201?0:1;
 }
 if(!Number.isInteger(previousChoice))throw new TypeError('Original persistent defender choice required');
 return previousChoice;
}

/**8011e210/4a8 nested exchange sorting, followed by8011e744 counter promotion.
 * costs/powers are both signed16 fields, index1 only for ranged attacker.
 * technique.flags is original selection record+0x10 (counter bit4). */
export function cpuCombatOrder({side,techniques,ranged=false,defenderChoice,rngState}){
 if(![0,1].includes(side)||techniques.length<1||techniques.length>4)throw new RangeError('Invalid combat side or loadout');
 const rng=rngFrom(rngState),field=side===0&&ranged?1:0;
 const powerFirst=side===0?!!(draw(rng)&1):!!defenderChoice;
 const order=techniques.map((_,i)=>i);
 for(let i=0;i<order.length;i++)for(let j=i+1;j<order.length;j++){
  const a=techniques[order[i]],b=techniques[order[j]],ac=s16(a.costs[field]),bc=s16(b.costs[field]),ap=s16(a.powers[field]),bp=s16(b.powers[field]);
  if(powerFirst?(ap<bp||(ap===bp&&bc<ac)):(bc<ac||(ac===bc&&ap<bp)))
   [order[i],order[j]]=[order[j],order[i]];
 }
 const promote=(draw(rng)&7)===0;
 let policy=powerFirst?0:1;
 if(promote){promoteCounterOrder(order,techniques,true);policy|=128;}
 return {order,policy,selectedRank:-2,counterCount:techniques.filter(t=>t.flags&4).length,
  rngState:rng.state,draws:rng.draws};
}
/**The source inserts qualifying entries from the back, not stable partition. */
export function promoteCounterOrder(order,techniques,promote=true){
 let first=0;const selected=i=>!!(techniques[order[i]]?.flags&4)===promote;
 while(first<order.length&&selected(first))first++;
 if(first===order.length)throw new Error('Original counter partition scans beyond its technique list');
 let last=order.length-1;
 while(first<last){if(!selected(last)){last--;continue;}
  const value=order[last];for(let j=last;j>first;j--)order[j]=order[j-1];order[first++]=value;
 }
 return order;
}
/**8011e99c chooses a rank, then8011ee00 scans the availability bitmask.
 * side1 flagsbit4 excludes last technique during rank RNG rejection loop. */
export function cpuCombatChoice({side,order,aiSkill,selectionRanks,availabilityMask,combatFlags=0,rngState}){
 const rng=rngFrom(rngState),n=order.length;
 if(!n)throw new RangeError('Empty combat list');
 let skill=aiSkill,rank,attempts=0;
 do{
  const positive=(draw(rng)&1)===0,change=draw(rng)%5;
  skill=Math.max(0,Math.min(11,skill+(positive?change:-change)));
  rank=selectionRanks[skill]%4;
  if(++attempts>10000)throw new Error('Original defender rank rejection loop does not terminate');
 }while(side===1&&(combatFlags&4)&&rank===n-1);
 return {...scanCombatAvailability({side,order,rank,availabilityMask}),rngState:rng.state,draws:rng.draws};
}
export function scanCombatAvailability({side,order,rank,availabilityMask}){
 const n=order.length,code=index=>side===1&&index===n-1?8:[2,4,1,8][index];
 for(let i=0;i<n;i++){
  const r=(rank+i)%n,index=order[r],button=code(index);
  if(button&availabilityMask)return {rank:r,index,button};
 }
 throw new Error('Original availability scan has no selectable technique');
}
/**8011eb74 reactive selection, called by original combat update after initial
 * choice. divisor is characterCombatReactiveDivisors[characterId][side]. */
export function cpuCombatReaction({side,order,policy,techniques,selectedIndex,opponentCounter,
  chakra,combatFlags=0,divisor,availabilityMask,rngState}){
 if(!Number.isInteger(divisor))throw new TypeError('Original reactive divisor required');
 const rng=rngFrom(rngState),result={order:order.slice(),policy,changed:false};
 const done=extra=>({...result,...extra,rngState:rng.state,draws:rng.draws});
 if((combatFlags&0x40)||chakra>=1001||divisor<=0)return done({});
 if(divisor!==1&&draw(rng)%divisor!==divisor-1)return done({});
 const ownCounter=!!(techniques[selectedIndex].flags&4);
 if(opponentCounter&&(side===0?ownCounter:!ownCounter)){
  promoteCounterOrder(result.order,techniques,side===1);
  result.policy=side===1?policy|128:policy&127;
  return done({...scanCombatAvailability({side,order:result.order,rank:0,availabilityMask}),changed:true});
 }
 return done({});
}

/**800c88f0 case3 only. Does not compete against card/power/roll menu scores.
 * availableJutsu is original4 slots (255 disabled), targets in original order.
 * relationships are signed16 values read from player+0x2e, supplied explicitly. */
export function cpuBoardJutsu(state,actor,{availableJutsu,priority,frequency,priorityTable,
  targets=[],relationships,alreadyAttempted=false,competingScore=0}={}){
 if(!Array.isArray(availableJutsu)||availableJutsu.length!==4)throw new TypeError('Original four jutsu slots required');
 const rng=rngFrom(state.rngState),p=state.players[actor],tile=state.tiles[p.position];
 const type8Exists=state.tiles.some(t=>t.typeCode===8);
 const result=extra=>({jutsuSlot:255,target:255,actionPriority:0,attempted:alreadyAttempted,
  ...extra,rngState:rng.state,draws:rng.draws});
 if(alreadyAttempted||(competingScore>255&&!type8Exists)||availableJutsu.every(id=>id===255))return result({});
 if(frequency<=draw(rng)%10+1&&!type8Exists)return result({attempted:true});
 let selected=255,best=232;
 if(priority<4){
  for(let i=0;i<4;i++){
   const id=availableJutsu[i];if(id===255)continue;
   const rank=priorityTable[priority].indexOf(id);if(rank<0)continue;
   const multiplier=id>=10&&id<14&&(state.modeFlags&0x100)?Number(!type8Exists):1;
   let score=rank;
   if([0,4,5].includes(id)){
    if(tile.typeCode===5&&tile.owner===actor)score-={0:50,4:70,5:60}[id];
   }else score=rank+10-draw(rng)%21;
   score*=multiplier;
   // uint local38 is explicitly narrowed tobyte AFTER choosing a signedscore.
   if(score<best){selected=i;best=byte(score);}
  }
 }else for(let i=0;i<50;i++){const pick=draw(rng)%4;if(availableJutsu[pick]!==255){selected=pick;break;}}
 if(selected===255)return result({attempted:true,unresolved:'original dereferences selectedslot255'});
 const id=availableJutsu[selected];let target=255;
 if(id>=10&&id<14){
  if(!relationships||targets.some(t=>!Number.isInteger(relationships[state.tiles[t].owner])))throw new TypeError('Original signed16 relationship values required');
  let scoreBest=-10000;
  for(const candidate of targets){const t=state.tiles[candidate];let score=t.upgradeBase-(t.level-1)*100;
   if((state.modeFlags&0x1000)&&state.players[t.owner]?.team===p.team)score=-20000;
   if(draw(rng)%256<=s16(relationships[t.owner]))score=-20000;
   if(t.typeCode===8&&draw(rng)%100<90)score+=1000;
   if((state.modeFlags&0x80)&&actor>=2&&actor<4){if(t.owner<2)score+=10000;else if(t.owner<4)score=-20000;}
   if(scoreBest<score){scoreBest=score;target=candidate;}
  }
  return result({jutsuSlot:selected,jutsuId:id,target,actionPriority:target!==255?255:0,attempted:true});
 }
 const permitted=tile.typeCode===1?[1,2,3,7,8].includes(id):
  tile.typeCode===2?[1,2,7,8].includes(id):tile.typeCode===3?[1,2,7].includes(id):
  tile.typeCode===4?[1,2,3,7,8].includes(id):tile.typeCode===5?tile.owner===actor:
  tile.typeCode===8?[0,2].includes(actor):false;
 return result({jutsuSlot:selected,jutsuId:id,target:p.position,actionPriority:permitted?255:0,attempted:true});
}

/**800ce440 directed probe. Stops on goal or junction, ignores connector steps.
 * A successful junction result is NOT proof that the target itself was reached. */
export function cpuRouteProbe(state,actor,{goalType,start=state.players[actor].position,
  direction,rejectJunction=false,crystalTileIds}={}){
 const p=state.players[actor];let cursor=start,dir=direction,first=true,steps=0;
 const seen=new Set();
 for(;;){
  const key=cursor+':'+dir+':'+first;
  if(seen.has(key))throw new Error('Original route probe loops without reaching its100 counted steps');seen.add(key);
  const next=state.tiles[cursor]?.neighbors?.[dir];
  if(next===undefined||next===255||!state.tiles[next])throw new Error('Original route probe reads outside valid tiles');
  if(first){dir=p.direction;first=false;
   if(dir===255||dir===undefined)throw new Error('Original route probe uses unresolved direction255');
   if(state.tiles[next].neighbors[dir]===cursor)dir^=1;
  }
  const t=state.tiles[next];
  if(t.typeCode!==6){
   steps++;
   if(t.typeCode===goalType){
    if(goalType===1){const crystal=crystalTileIds.indexOf(next);if(crystal>=0&&(p.flags&(0x1000<<crystal)))return {found:false,steps};}
    return {found:true,tile:next,steps,packed:(next|steps<<16)>>>0};
   }
   if(t.typeCode===3)return rejectJunction?{found:false,steps}:{found:true,tile:next,steps,packed:(next|steps<<16)>>>0};
  }
  cursor=next;if(steps>99)return {found:false,steps};
 }
}

/**800cca18 scores already-generated reachable landing candidates for one
 * direction. Candidate generation belongs to original movement preview.
 * Cheap enemy barrier/default paths retain register s2: caller must supply its
 * incoming value if no earlier candidate in this call establishes a score. */
export function cpuLandingCandidate(state,actor,{candidates,direction,crystalTileIds,initialScore}={}){
 const p=state.players[actor],all=crystalCount(p.flags,crystalTileIds.length)===crystalTileIds.length;
 const chains=barrierChains(state.tiles).chains;let score=initialScore,best=-10000,tile=255;
 for(const c of candidates){if(c.tile===255||c.direction!==direction)continue;const t=state.tiles[c.tile];
  switch(t.typeCode){
   case 0:score=all?2400:400;break;case 1:score=400;break;case 2:score=300;break;
   case 3:case 7:score=100;break;
   case 4:score=p.chakra>699&&t.purchasePrice>49?t.purchasePrice+500:0;break;
   case 5:if(t.owner===actor)score=500;else if(Math.trunc(p.chakra/4)<=barrierRent(t,chains[c.tile]))score=-10000;break;
   case 8:score=actor>=2&&actor<4?1000:100;break;
  }
  if(score===undefined)throw new Error('Original landing score reads incoming s2 register');
  if(best<score){best=score;tile=c.tile;}
 }
 return {tile,score:best,carriedScore:score};
}

/**Score/combine800ccd3c after its geometry and preview steps. Each route has
 * {direction,choiceCode,distance,landingTile,probeFound,missingBeforeJunction,
 *  defenderDistance?}. distance must be original geometry (map7 vertical,
 * others sqrt truncated), not shortest graph distance. */
export function cpuChooseRoute(state,actor,{routes,allCrystals,barrierCount}={}){
 if(typeof allCrystals!=='boolean'||!Number.isInteger(barrierCount))throw new TypeError('Original crystal completion and barrier count required');
 const p=state.players[actor],rng=rngFrom(state.rngState),valid=routes.map(r=>r&&r.direction!==255);
 if(routes.length!==4)throw new TypeError('Original four route slots required');
 if(p.status&0x20){
  let chosen=0;
  for(let attempt=0;attempt<100;attempt++){const i=draw(rng)%4;if(valid[i]){chosen=i;break;}}
  return {slot:chosen,choiceCode:routes[chosen]?.choiceCode,rngState:rng.state,draws:rng.draws};
 }
 const chains=barrierChains(state.tiles).chains;let selected=0,best=-1000000;const scores=[];
 for(let i=0;i<4;i++){
  const r=routes[i];if(!valid[i]){scores[i]=null;continue;}
  if(!Number.isFinite(r.distance))throw new TypeError('Source route geometry is required');
  let score=-r.distance;if((state.modeFlags&0x80)&&actor>=2&&actor<4)score*=2;
  const t=state.tiles[r.landingTile];
  if(!t&&allCrystals)throw new Error('Original all-crystal route reads invalid landing tile');
  if(t){
   if([2,8,9].includes(t.effect))score-=20000;
   const rent=t.typeCode===5?barrierRent(t,chains[r.landingTile]):0;
   if(allCrystals){if(t.typeCode===5&&t.owner!==actor&&Math.trunc(p.chakra/4)<=rent)score-=10000;}
   else switch(t.typeCode){
    case 1:if(r.probeFound)score+=barrierCount?20500:500;break;
    case 2:if(r.probeFound)score+=1000;break;
    case 3:case 7:if(r.probeFound)score+=barrierCount?10500:500;break;
    case 4:
     if(!r.probeFound){if(!(p.chakra>699&&t.purchasePrice>99))score-=2000;}
     else score+=p.chakra<t.purchasePrice+500?500:2000+t.purchasePrice;break;
    case 5:{
     const owned=t.owner===actor;if(owned)score+=800;
     if(!(rent<800&&(rent+700<=p.chakra||!(state.modeFlags&1)||owned))){score=-10000;break;}
     if(!r.probeFound){if(!owned)score-=1000+rent;}
     else if(owned){if(t.level<5&&t.upgradeBase*(5-t.level)+200<=p.chakra)score+=rent;}
     else {
      if(!Number.isInteger(r.defenderDistance))throw new TypeError('Original directed defenderDistance required');
      if(state.players[t.owner].chakra<200||(r.defenderDistance>10&&p.chakra>1400))score+=r.defenderDistance+rent;
      else if(p.chakra<=t.rents[t.level-1]*6)score-=1000+rent;
     }
     if(!owned&&(state.modeFlags&8)&&(state.players[t.owner].flags&0x200))score+=10000;
     const defeats=((state.defeatCounters??0)&15)+((state.defeatCounters??0)>>>4);
     if((state.modeFlags&0x80)&&actor>=2&&actor<4&&defeats>2&&t.owner<2)score+=10000;
     break;
    }
    case 8:score+=10000;break;
   }
  }
  if(!allCrystals&&r.missingBeforeJunction)score+=50000;
  scores[i]=score;if(best<score){best=score;selected=i;}
 }
 return {slot:selected,choiceCode:routes[selected]?.choiceCode,scores,rngState:rng.state,draws:rng.draws};
}

/**Geometry prepass800ccd3c. Uses directional slot order and the original
 * lookahead quirk for slot2/3. Invalid memory is reported, not replaced by BFS. */
export function cpuRouteGeometry(state,actor,{directions,crystalTileIds,mapId}={}){
 const p=state.players[actor],all=crystalCount(p.flags,crystalTileIds.length)===crystalTileIds.length;
 const tile=id=>{const t=state.tiles[id];if(!t)throw new Error('Original route geometry reads outside valid tiles');return t;};
 const next=(id,dir)=>{const n=tile(id).neighbors[dir];if(n===255||n===undefined)throw new Error('Original route geometry reads invalid neighbor');return n;};
 const metric=(a,b)=>mapId===7?Math.abs(tile(a).y-tile(b).y):Math.trunc(Math.sqrt((tile(a).x-tile(b).x)**2+(tile(a).y-tile(b).y)**2));
 let nearest,minimum=10000;
 if(!all)for(let i=0;i<crystalTileIds.length;i++)if(!(p.flags&(0x1000<<i))){const id=crystalTileIds[i],d=metric(id,p.position);if(d<minimum){minimum=d;nearest=id;}}
 if(!all&&nearest===undefined)throw new Error('Original route nearest-crystal register is undefined');
 return directions.map(dir=>{
  if(dir===255)return null;
  const first=next(p.position,dir),goal=all?0:nearest;
  if(all||mapId===7)return metric(goal,first);
  let cursor=first,follow=dir;
  if(dir>1)follow=Number(tile(next(cursor,dir)).neighbors[0]===cursor);
  for(let n=0;n<4;n++){cursor=next(cursor,follow);if(tile(cursor).typeCode===3||cursor===goal)break;}
  return metric(goal,cursor);
 });
}

/**800e0b3c logical bankruptcy commit. Called only after queued money finishes.
 * Mode1 enables elimination. In team mode the first pass only starts with the
 * current actor's negative wallet, then handles other negative players. */
export function resolveBankruptcy(state,{currentActor,queuesSettled=false,previousWinner}={}){
 const s={...state,players:state.players.map(p=>({...p,inventory:p.inventory?.slice()})),tiles:state.tiles.map(t=>({...t})),events:[]};
 if(!(s.modeFlags&1)||!queuesSettled)return {...s,eliminated:[],victory:{won:false}};
 const isNegative=p=>p.chakra<0&&!(p.actorStatus&1),team=!!(s.modeFlags&0x1000);
 const eliminated=[];
 if(team&&!isNegative(s.players[currentActor]))return {...s,eliminated,victory:{won:false}};
 const order=team?[currentActor,...s.players.map((_,i)=>i).filter(i=>i!==currentActor)]:s.players.map((_,i)=>i);
 for(const id of order)if(isNegative(s.players[id])){
  const p=s.players[id];p.flags=0;p.actorStatus|=1;eliminated.push(id);
  for(const t of s.tiles)if(t.typeCode===5&&t.owner===id)Object.assign(t,{typeCode:4,owner:15,level:1,hp:2,effect:0,repairCounter:0});
  s.events.push({type:'player-eliminated',actor:id});
 }
 if(team){
  for(let a=0;a<s.players.length;a++)for(let b=0;b<s.players.length;b++){
   if(a!==b&&s.players[a].team===s.players[b].team&&(s.players[a].actorStatus&1)&&(s.players[b].actorStatus&1)){
    const winner=s.players.findIndex((_,i)=>i!==a&&i!==b);
    return {...s,eliminated,victory:{won:true,reason:0x1000,winner}};
   }
  }
 }else{
  const alive=s.players.flatMap((p,i)=>p.actorStatus&1?[]:[i]),humans=alive.filter(i=>!(s.players[i].flags&0x100));
  if(alive.length===1||humans.length===0){
   if(humans.length===0&&alive.length>1)return {...s,eliminated,victory:{won:true,reason:0,winner:255,noHumans:true}};
   let best=0,winner=previousWinner;for(const i of alive)if(best<s.players[i].chakra){best=s.players[i].chakra;winner=i;}
   if(winner===undefined)throw new Error('Original bankruptcy winner retains prior byte when no positive wallet remains');
   return {...s,eliminated,victory:{won:true,reason:0,winner,noHumans:humans.length===0}};
  }
 }
 return {...s,eliminated,victory:{won:false}};
}
