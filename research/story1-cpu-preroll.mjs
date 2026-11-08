/** Original800c88f0 ordinary pre-roll policy. See story1-cpu-preroll.md. */
import {ps1Random} from './faithful-rules.mjs';
import {cpuBoardJutsu,characterCpuParameters} from './board-ai.mjs';
export const cardUsePriorities=[[26, 25, 24, 22, 20, 18, 17, 16, 15, 14, 13, 21, 23, 19, 28, 27, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255], [23, 18, 17, 16, 15, 14, 13, 19, 21, 22, 26, 25, 24, 20, 28, 27, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255], [28, 18, 17, 16, 15, 14, 13, 26, 25, 24, 23, 21, 22, 27, 20, 19, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255], [19, 27, 20, 26, 25, 24, 18, 17, 16, 15, 14, 13, 23, 21, 28, 22, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255], [26, 25, 24, 22, 20, 18, 17, 16, 15, 14, 13, 21, 23, 19, 28, 27, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]];
export const powerPriorities=[[0, 1, 3, 2, 255], [2, 1, 3, 0, 255], [1, 3, 2, 0, 255], [255, 255, 255, 255, 255]];
const s16=x=>x<<16>>16;
const RNG=seed=>({state:seed>>>0,draws:0});
const draw=r=>{const n=ps1Random(r.state);r.state=n.state;r.draws++;return n.value;};
const rel=(relationships,i)=>{if(!Number.isInteger(relationships?.[i]))throw new TypeError('Source relationship byte required');return s16(relationships[i]);};
export function preRollCpuParameters(data,id){const p=characterCpuParameters(data,id),b=data.characterBoardBytes[id];return {...p,cardFrequency:b[4],cardUsePriority:b[3],powerPriority:b[7],powerFrequency:b[8]};}
function targetScore(state,actor,id,crystalCount){const p=state.players[id];let score=(p.flags&0x200)+p.chakra+state.tiles.filter(t=>t.typeCode===5&&t.owner===id).length*100;
 for(let i=0;i<crystalCount;i++)if(p.flags&(0x1000<<i))score+=2000;
 if(!(state.modeFlags&0x1000)&&(p.flags&0x200))score+=10000;
 return score;
}
/**case5. priority>=5 follows undefined stack state in original; all extracted
 * character priorities are0..3, so that unsupported branch is explicit. */
export function cpuPreRollCard(state,actor,{cards,priority,frequency,relationships,crystalCount,
 alreadyAttempted=false,competingScore=0,direction255TileByte}={}){
 const r=RNG(state.rngState),p=state.players[actor];
 const out=extra=>({attempted:alreadyAttempted,cardSlot:255,target:255,actionPriority:0,...extra,rngState:r.state,draws:r.draws});
 if(alreadyAttempted)return out({});
 if(frequency<=draw(r)%10+1)return out({attempted:true});
 if(priority>=5)throw new Error('Original random card-priority branch reads uninitialized local4c');
 let slot=255,best=1000;
 for(let i=0;i<3;i++){const id=p.inventory[i],card=cards[id];if(!card||![5,7,13,14,15].includes(card.type))continue;
  let rank=cardUsePriorities[priority].indexOf(id);if(rank<0)continue;if(card.type===15)rank-=1000;
  if(rank<best){best=rank;slot=i;}
 }
 if(competingScore>350||slot===255)return out({attempted:true,cardSlot:slot});
 const id=p.inventory[slot],base={attempted:true,cardSlot:slot,cardId:id};
 if(id===28||id===30)return out({...base,target:actor,actionPriority:350});
 if([19,27,29].includes(id)){
  let target=255,scoreBest=0;
  for(let i=0;i<state.players.length;i++){
   const q=state.players[i];if(i===actor||q.actorStatus!==0)continue;
   let score=targetScore(state,actor,i,crystalCount);
   if(draw(r)%256<=rel(relationships,i))score=0;
   if((state.modeFlags&0x1000)&&p.team===q.team)score=0;
   // Source mode80 special bonus condition owner==0&&owner==1 is impossible.
   if(scoreBest<score){scoreBest=score;target=i;}
  }
  return out({...base,target,actionPriority:target!==255?350:0});
 }
 if(id<13||id>18){
  let target=255;
  for(let i=0;i<50;i++){target=draw(r)%state.players.length;if(!(state.players[target].actorStatus&1))break;}
  return out({...base,target,actionPriority:350});
 }
 let cursor=p.position,remaining=cards[id].value-1,steps=0;
 if(cards[id].value!==0&&state.tiles[cursor].typeCode!==3){
  do {const next=p.direction===255?direction255TileByte:state.tiles[cursor]?.neighbors?.[p.direction];
   if(next===undefined||next===255||!state.tiles[next])throw new Error('Original forced-card lookahead reads invalid directional neighbor');
   cursor=next;remaining--;steps++;if(remaining===-1)break;
  }while(state.tiles[cursor].typeCode!==3);
 }
 const targetOthers=(draw(r)&1)===0;
 if(!steps||remaining>=0)return out(base);
 const tile=state.tiles[cursor];
 if(targetOthers){
  let target=255,best=0;
  for(let i=0;i<state.players.length;i++){
   const q=state.players[i];if(i===actor||(q.actorStatus&1))continue;
   let score=targetScore(state,actor,i,crystalCount);
   if(draw(r)%256<=rel(relationships,i))score=0;
   if((state.modeFlags&0x1000)&&p.team===q.team)score=0;
   if(best<score){best=score;target=i;}
  }
  const useful=(tile.typeCode===5&&tile.owner!==target)||tile.effect!==0;
  return out({...base,target:useful?target:255,actionPriority:useful&&target!==255?350:0});
 }
 let useful=false;
 switch(tile.typeCode){
  case 0:case 1:useful=state.tiles.some(t=>t.typeCode===5&&t.owner===actor)&&p.chakra>800;break;
  case 2:useful=true;break;
  case 4:useful=tile.purchasePrice>150&&p.chakra>800;break;
  case 5:useful=tile.owner===actor&&tile.level<5&&p.chakra>800;break;
  case 8:useful=actor>=2&&actor<4;
 }
 if([2,8,9].includes(tile.effect))useful=false;
 return out({...base,target:useful?actor:255,actionPriority:useful?350:0});
}
/**case4. enabledPowerIds follows original bdeac availability, supplied by scroll
 * runtime. Retains source's power lookup bytes[3,1,2,3], first-playerCount tile
 * loop in candidate1 priority, and candidate priority adjustments. */
export function cpuPreRollPower(state,actor,{enabledPowerIds,priority,frequency,reserveByte,
 relationships,alreadyAttempted=false}={}){
 const r=RNG(state.rngState),p=state.players[actor];
 const out=extra=>({attempted:alreadyAttempted,powerId:255,target:255,actionPriority:0,...extra,rngState:r.state,draws:r.draws});
 if(alreadyAttempted)return out({});
 if((state.modeFlags&8)&&(p.flags&0x200))return out({attempted:true});
 let selected=255,best=100,forced=false;
 if(enabledPowerIds.length){
  if(priority<4){
   for(let id=0;id<4;id++)if(enabledPowerIds.includes(id)){
    let score=powerPriorities[priority].indexOf([3,1,2,3][id]);if(score<0)continue;
    if(id===1){
     const owned=state.tiles.slice(0,state.players.length).filter(t=>t.typeCode===5&&t.owner===actor),low=owned.filter(t=>t.level<3).length,high=owned.filter(t=>t.level>3).length;
     if(owned.length>4&&high<low&&high<3){score-=1000;forced=true;}
     if(p.chakra<0)score=1000;
    }else if(id===0){if(p.chakra<0){score-=16000;forced=true;}}
    else if(id===2){score+=(draw(r)%2)*100;if(((p.flags>>>10)&3)===state.players.length-1&&p.chakra>4000)score-=10;if(p.chakra<0)score=1000;}
    else if(p.chakra>=-999){score-=5000;forced=true;}
    if(score<best){best=score;selected=id;}
   }
  }else for(let i=0;i<50;i++){const id=draw(r)%4;if(enabledPowerIds.includes(id)){selected=id;break;}}
 }
 if(draw(r)%10+1>frequency&&!forced)return out({attempted:true,powerId:selected});
 const base={attempted:true,powerId:selected};
 if(selected===3)return out({...base,actionPriority:1000});
 if(selected===0){const threshold=100-((reserveByte&255)+1)/180*500;
  return out({...base,actionPriority:p.chakra<threshold&&((p.flags>>>10)&3)===3&&!(state.modeFlags&1)?1000:0});
 }
 if(selected===1){const owned=state.tiles.filter(t=>t.typeCode===5&&t.owner===actor),low=owned.filter(t=>t.level<3).length,high=owned.filter(t=>t.level>3).length;
  return out({...base,actionPriority:low<high&&state.tiles.filter(t=>t.typeCode===4).length<5&&p.chakra<800?1000:0});
 }
 if(selected===2){let target=255,best=0;
  for(let i=0;i<state.tiles.length;i++){const t=state.tiles[i];if(t.typeCode!==5||t.owner===actor)continue;
   let score=t.rents[t.level-1];if((state.modeFlags&0x1000)&&p.team===state.players[t.owner].team)score=0;
   if(draw(r)%256<=rel(relationships,t.owner))score=0;
   if(best<score){best=score;target=i;}
  }
  return out({...base,target,actionPriority:target!==255?1000:0});
 }
 return out(base);
}
/** Full source menu order for ordinary pre-roll; build after actual availability
 * state transitions. Persistent attempts reset only when roll/forcedmove wins. */
export function cpuPreRoll(state,actor,{params,cards,availableJutsu,jutsuPriorityTable,
 relationships,crystalCount,enabledPowerIds=[],jutsuUsed=false,cardUsed=false,
 policyState={},direction255TileByte}={}){
 const p=state.players[actor],r=RNG(state.rngState),policy={decisionByte:0,cardAttempted:false,powerAttempted:false,jutsuAttempted:false,...policyState};
 const first=draw(r);policy.decisionByte=policy.decisionByte&128?128:first%256-1<(params.reserveByte&255)?128:129;
 const menu=[p.forcedMove?1:0];if(!jutsuUsed)menu.push(3);if(p.flags&0x200)menu.push(4);if(!cardUsed&&p.inventory.some(id=>id!==255))menu.push(5);
 let selected=menu[0],priority=250,payload={};const trace=[];
 const adopt=result=>{r.state=result.rngState;r.draws+=result.draws;};
 for(const action of menu.slice(1)){
  let result;
  if(action===3){const targets=state.tiles.flatMap((t,i)=>(t.typeCode===5&&t.owner!==actor)||(t.typeCode===8&&(p.flags&0x100))?[i]:[]);
   result=cpuBoardJutsu({...state,rngState:r.state},actor,{availableJutsu,priority:params.jutsuPriority,frequency:params.jutsuFrequency,priorityTable:jutsuPriorityTable,targets,relationships,alreadyAttempted:policy.jutsuAttempted,competingScore:priority});policy.jutsuAttempted=result.attempted;
  }else if(action===4){result=cpuPreRollPower({...state,rngState:r.state},actor,{enabledPowerIds,priority:params.powerPriority,frequency:params.powerFrequency,reserveByte:params.reserveByte,relationships,alreadyAttempted:policy.powerAttempted});policy.powerAttempted=result.attempted;
  }else {result=cpuPreRollCard({...state,rngState:r.state},actor,{cards,priority:params.cardUsePriority,frequency:params.cardFrequency,relationships,crystalCount,alreadyAttempted:policy.cardAttempted,competingScore:priority,direction255TileByte});policy.cardAttempted=result.attempted;}
  adopt(result);trace.push({action,...result});if(result.actionPriority>0){selected=action;priority=result.actionPriority;payload=result;}
 }
 if(selected<2)Object.assign(policy,{decisionByte:0,cardAttempted:false,powerAttempted:false,jutsuAttempted:false});
 return {action:selected,kind:({0:'roll',1:'forced-move',3:'jutsu',4:'scroll-power',5:'card'})[selected],menuSlot:menu.indexOf(selected),menu,
  priority,payload,policyState:policy,rngState:r.state,draws:r.draws,trace};
}
