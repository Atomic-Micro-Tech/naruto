/** Source800cb4b4/800cad18/800f3658 case5. Complete ordinary nonjunction
 * lookahead used by story0. Junction800cadb8 deliberately requires native context. */
import {ps1Random,barrierChains,barrierRent} from './faithful-rules.mjs';
const trapped=t=>[2,8,9].includes(t.effect);
export const movementRouletteSkill=(data,characterId)=>(data.characterBoardBytes[characterId][0]*25)&255;
/** Desired value BEFORE skill failure. Original loops retain direction/cursor
 * between the four iterations when starting direction255; do not reset them. */
export function cpuMovementLookahead(state,actor,{faces,reserveByte,crystalCount}={}){
 if(faces.length!==12)throw new RangeError('Twelve original faces required');
 const p=state.players[actor],eleven=faces.slice(0,11),min=Math.min(20,...eleven),max=Math.max(0,...eleven);
 let rngState=state.rngState>>>0,draws=0;
 const draw=()=>{const r=ps1Random(rngState);rngState=r.state;draws++;return r.value;};
 let crystals=0;for(let i=0;i<crystalCount;i++)crystals+=(p.flags>>>(12+i))&1;
 if(p.chakra<700||crystals===crystalCount-1||crystals===crystalCount)return {target:(max-draw()%3)&255,rngState,draws,trace:[],reason:'maximum-minus-random'};
 let cursor=p.position,direction=p.direction,target=255,best=-10000;
 if(!Number.isInteger(direction))throw new TypeError('Original direction byte required');
 const outerCount=direction===255?4:1,trace=[],chains=barrierChains(state.tiles).chains;
 const owned=state.tiles.filter(t=>t.typeCode===5&&t.owner===actor).length;
 const next=(tile,dir)=>{const n=state.tiles[tile]?.neighbors?.[dir];if(n===undefined||n===255||!state.tiles[n])throw new Error('Movement lookahead needs original runtime directional byte');return n;};
 for(let outer=0;outer<outerCount;outer++){
  if(direction===255){direction=outer;const neighbor=state.tiles[cursor]?.neighbors?.[direction];if(neighbor===255)continue;
   const before=cursor;cursor=next(cursor,direction);if(direction>1)direction=Number(state.tiles[cursor].neighbors[0]===before);
  }
  for(let value=min;value<=max;value++){
   const t=state.tiles[cursor];let score=null;
   switch(t.typeCode){
    case 0:case 1:score=owned?value*100+500:0;break;
    case 2:score=value*100+400;break;
    case 3:throw new Error('Junction800cadb8 requires original carried register context; absent from story0');
    case 4:
     score=Math.trunc(t.purchasePrice*(((reserveByte&255)+1)/180)+1000+value*100);
     if((state.modeFlags&0x80)&&actor>=2&&actor<4&&state.tiles.filter(x=>x.typeCode===5&&(x.owner===2||x.owner===3)).length>=6)score=0;
     if(p.chakra<t.purchasePrice)score=0;
     break;
    case 5:
     if(t.owner===actor){if(t.level<5)score=value*100+barrierRent(t,chains[cursor])+2000;}
     else {score=value*10-barrierRent(t,chains[cursor]);if((state.modeFlags&8)&&(state.players[t.owner].flags&0x200))score+=10000;}
     break;
    case 7:score=value*100;break;
    case 8:score=value*100+100000;break;
   }
   if(score!==null&&t.typeCode!==7&&trapped(t))score=0;
   if(score!==null&&score>best){best=score;target=value&255;}
   trace.push({outer,tile:cursor,value,score,target});
   const before=cursor;cursor=next(cursor,direction);if(direction>1)direction=Number(state.tiles[cursor].neighbors[0]===before);
  }
 }
 return {target,score:best,rngState,draws,trace,reason:'lookahead'};
}
/** Run BEFORE startBoardRoulette (and its65 RNG draws). Returns targetValue
 * for the existing widget's native CPU stop path. previousTarget is only needed
 * when source setter cannot find a selected value in all12 faces. */
export function cpuBoardRouletteTarget(state,actor,{faces,reserveByte,crystalCount,skillByte,priorBoardState=2,previousTarget=null}={}){
 if(!Number.isInteger(skillByte))throw new TypeError('Original runtime +29 byte required');
 let rngState=state.rngState>>>0,draws=0,desired=255,lookahead=null;
 const draw=()=>{const r=ps1Random(rngState);rngState=r.state;draws++;return r.value;};
 if(priorBoardState!==1&&priorBoardState!==14){
  lookahead=cpuMovementLookahead(state,actor,{faces,reserveByte,crystalCount});
  desired=lookahead.target;rngState=lookahead.rngState;draws+=lookahead.draws;
  if((skillByte&255)<=draw()%250)desired=255;
 }
 const first=faces.slice(0,11);let targetValue;
 if(desired===255){const min=Math.min(20,...first),max=Math.max(0,...first);targetValue=min+draw()%(max+1-min);}
 else targetValue=first.includes(desired)?desired:first[10];
 const setterSucceeded=faces.includes(targetValue);
 return {targetValue:setterSucceeded?targetValue:previousTarget,requestedTarget:targetValue,desired,lookahead,setterSucceeded,rngState,draws};
}
