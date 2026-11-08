/** Native CARD-RACE rules port. Source addresses and limits: race-rules.md.
 * Pure JSON state; no emulator/CPU execution. Inputs preserve original tile IDs.
 */
import {ps1Random, shuffleDeck, returnCard, drawChanceCard} from './faithful-rules.mjs';
export const RACE_DECK = Object.freeze([45,46,46,46,47,47,47,48,48,49,50]);
export const RACE_ROULETTE = Object.freeze([1,1,1,2,2,2,3,3,3,4,4,4]);
export const RACE_EFFECTS = Object.freeze({
  9:{kind:'draw',messageId:0x313,limit:2},
  10:{kind:'move',steps:2,target:'self',messageId:0x30f,limit:2},
  11:{kind:'move',steps:3,target:'self',messageId:0x310,limit:1},
  12:{kind:'move',steps:-2,target:'self',messageId:0x311,limit:2},
  13:{kind:'move',steps:-3,target:'self',messageId:0x312,limit:2},
  14:{kind:'move',steps:1,target:'other',messageId:0x314,limit:2},
  15:{kind:'move',steps:2,target:'other',messageId:0x315,limit:1},
  16:{kind:'move',steps:-1,target:'other',messageId:0x316,limit:1},
  17:{kind:'move',steps:-2,target:'other',messageId:0x317,limit:2},
  18:{kind:'chakra',amount:-100,messageId:0x30c,limit:1},
  19:{kind:'chakra',amount:-200,messageId:0x30d,limit:1},
  20:{kind:'chakra',amount:100,messageId:0x30e,limit:2},
});
export const RACE_DRAW_PRIORITY = [[26,25,24,22,34,33,32,31,37,38,10,20,39,40,4,18,17,16,15,14,13,43,2,41,0,21,23,19,36,35,12,30,11,27,8,7,9,51,50,49,48,47,46,45,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255],[23,10,37,38,18,17,16,15,14,13,39,40,4,19,21,22,11,26,25,24,20,34,33,32,31,30,43,2,41,0,27,36,35,12,8,7,9,51,50,49,48,47,46,45,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255],[10,37,38,30,39,40,4,18,17,16,15,14,13,26,25,24,11,34,33,32,31,23,21,43,2,41,0,36,35,12,22,27,20,19,8,7,9,51,50,49,48,47,46,45,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255],[10,34,33,32,31,37,38,19,27,20,26,25,24,39,40,4,11,36,35,12,18,17,16,15,14,13,23,21,30,22,43,2,41,0,8,7,9,51,50,49,48,47,46,45,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255],[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,255,255,255,255,255,255,255,255]];
const DEFINITIONS=Array.from({length:52},(_,id)=>({id,useFlag:2,type:5,value:id-44}));
const copy=s=>JSON.parse(JSON.stringify(s));
function assert(condition,message){if(!condition)throw new RangeError(message);}
function random(s){const r=ps1Random(s.seed);s.seed=r.state;return r.value;}
function nextTile(tiles,id,slot){const t=tiles[id];return (t.neighborSlots??t.neighbors)[slot];}
export function racePath(tiles,start,steps){
  assert(Number.isInteger(steps),'Movement must be integer');
  const slot=steps<0?1:0,terminal=steps<0?22:0;let tile=start;const path=[];
  for(let i=0;i<Math.abs(steps);i++){
    if(tiles[tile].typeCode===terminal)break;
    const next=nextTile(tiles,tile,slot);assert(tiles[next],`Invalid lane edge ${tile}/${slot}`);
    path.push(next);tile=next;
  }
  return {tile,path,steps:path.length,directionSlot:slot};
}
export function raceDistance(tiles,start,direction=1){
  const end=direction>0?0:22,slot=direction>0?0:1;let tile=start,n=0;
  while(tiles[tile].typeCode!==end){tile=nextTile(tiles,tile,slot);assert(tiles[tile]&&++n<=tiles.length,'Lane must reach endpoint');}
  return n;
}
export function createRaceState(map,{seed=1,characterIds=[0,1],firstPlayer=0,deck=null,initialChakra=600}={}){
  assert(map.id===16||map.id===17,'CARD-RACE uses source map16 or17');
  const tiles=copy(map.tiles),starts=tiles.filter(t=>t.typeCode===22).map(t=>t.id).sort((a,b)=>b-a);
  assert(starts.length===2,'Two separate start lanes required');assert(firstPlayer===0||firstPlayer===1,'Invalid first player');
  // When resuming or reproducing an original trace, pass its already shuffled
  // pool0 and RNG state. Default only initializes the gameplay pool, not intro RNG.
  const shuffled=deck?{deck:deck.slice(),state:seed>>>0}:shuffleDeck(RACE_DECK,seed);
  return {version:1,modeFlags:0x6000,mapId:map.id,tiles,seed:shuffled.state,deck:shuffled.deck,
    players:starts.map((tile,id)=>({id,characterId:characterIds[id],tile,chakra:initialChakra,
      hand:[46,47,48],openingDone:false,turnCount:0,effectCounts:Array(12).fill(0)})),
    actor:firstPlayer,phase:'opening-roll',turn:0,pending:null,winner:null,winReason:null,events:[]};
}
export function raceActions(s){
  if(s.phase==='complete')return [];
  if(s.phase==='opening-roll')return [{type:'roll',values:[1,2,3,4]}];
  if(s.phase==='choose-card')return s.deck.slice(0,3).map((card,index)=>({type:'choose-card',index,card,replaceRequired:s.players[s.pending.player].hand.length===3}));
  const p=s.players[s.actor],out=[];
  if(p.hand.length)out.push({type:'play-card',slots:p.hand.map((card,slot)=>({card,slot,value:card-44})),targets:[s.actor,s.actor^1]});
  if(p.chakra>=200&&p.hand.length<3)out.push({type:'draw',cost:100});
  out.push({type:'rest',gain:100});return out;
}
function win(s,player,reason){s.winner=player;s.winReason=reason;s.phase='complete';s.pending=null;s.events.push({type:'win',player,reason});}
function checkChakra(s){
  // FUN800e9220 tests original actor first; simultaneous <=0 awards the other.
  if(s.players[s.actor].chakra<=0)win(s,s.actor^1,'chakra');
  else if(s.players[s.actor^1].chakra<=0)win(s,s.actor,'chakra');
  return s.phase==='complete';
}
function finishTurn(s){
  if(checkChakra(s))return;
  s.players[s.actor].turnCount++;s.actor^=1;s.turn++;s.pending=null;
  s.phase=s.players[s.actor].openingDone?'menu':'opening-roll';
  s.events.push({type:'turn',player:s.actor,phase:s.phase});
}
function move(s,player,steps){
  const p=s.players[player],from=p.tile,result=racePath(s.tiles,from,steps);p.tile=result.tile;
  s.events.push({type:'move',player,from,to:p.tile,path:result.path,requested:steps,animation:steps<0?3:'walk_direction'});
  if(s.tiles[p.tile].typeCode===0)win(s,player,'goal');
  return result;
}
function requestDraw(s,player,free){
  assert(s.deck.length>=3,'Original choice UI requires three deck cards');
  s.pending={player,free};s.phase='choose-card';s.events.push({type:'draw-choice',player,free,choices:s.deck.slice(0,3)});
}
function landing(s,player){
  if(s.phase==='complete')return;
  const p=s.players[player],tile=s.tiles[p.tile];let type=tile.typeCode;
  if(type===21){
    assert(Object.entries(RACE_EFFECTS).some(([id,e])=>p.effectCounts[id-9]<e.limit),'Original per-lane effect pool exhausted');
    do{type=9+random(s)%12;}while(p.effectCounts[type-9]>=RACE_EFFECTS[type].limit);
    p.effectCounts[type-9]++;tile.typeCode=type;tile.type='race_effect';
    s.events.push({type:'reveal',player,tile:tile.id,effect:type});
  }
  const effect=RACE_EFFECTS[type];
  if(!effect){finishTurn(s);return;}
  s.events.push({type:'tile-effect',player,tile:tile.id,effect:type,messageId:effect.messageId});
  if(effect.kind==='draw'){requestDraw(s,player,true);return;}
  if(effect.kind==='chakra'){
    p.chakra+=effect.amount;s.events.push({type:'chakra',player,amount:effect.amount,value:p.chakra});
  }else if(effect.kind==='move')move(s,effect.target==='other'?player^1:player,effect.steps);
  // FUN800e9220 +0x55d blocks secondary landing effects this turn.
  if(s.phase!=='complete')finishTurn(s);
}
export function stepRace(state,action){
  const s=copy(state);s.events=[];
  assert(s.phase!=='complete','Race already completed');
  const p=s.players[s.actor];
  if(s.phase==='opening-roll'){
    assert(action.type==='roll'&&Number.isInteger(action.value)&&action.value>=1&&action.value<=4,'Opening roulette requires1..4');
    p.openingDone=true;s.phase='resolving';move(s,s.actor,action.value);landing(s,s.actor);return s;
  }
  if(s.phase==='choose-card'){
    assert(action.type==='choose-card','Choose one of the three drawn cards');
    assert(Number.isInteger(action.index)&&action.index>=0&&action.index<3,'Invalid chance choice');
    const {player,free}=s.pending,hand=s.players[player].hand;
    if(hand.length===3)assert(action.discard===true||(Number.isInteger(action.replaceSlot)&&action.replaceSlot>=0&&action.replaceSlot<3),'Full hand: replace slot0..2 or discard new card');
    const drawn=drawChanceCard(s.deck,action.index,DEFINITIONS,s.seed);s.deck=drawn.deck;s.seed=drawn.state;
    if(hand.length===3){
      // FUN800ec574 discards the newly drawn card without reinserting it when slot3 is selected.
      if(!action.discard){const returned=returnCard(s.deck,hand[action.replaceSlot],s.seed);s.deck=returned.deck;s.seed=returned.state;hand.splice(action.replaceSlot,1);hand.push(drawn.card);}
    }else hand.push(drawn.card);
    s.events.push({type:'card-drawn',player,card:drawn.card,discarded:!!action.discard});s.pending=null;
    if(free)finishTurn(s);else s.phase='menu';return s;
  }
  assert(s.phase==='menu','Not accepting menu actions');
  if(action.type==='rest'){
    p.chakra+=100;s.events.push({type:'chakra',player:s.actor,amount:100,value:p.chakra,messageId:0x30e});finishTurn(s);return s;
  }
  if(action.type==='draw'){
    assert(p.chakra>=200&&p.hand.length<3,'Draw requires at least200 chakra and an empty slot');
    p.chakra-=100;s.events.push({type:'chakra',player:s.actor,amount:-100,value:p.chakra});requestDraw(s,s.actor,false);return s;
  }
  assert(action.type==='play-card','Unknown race action');
  assert(Number.isInteger(action.slot)&&action.slot>=0&&action.slot<p.hand.length,'Invalid hand slot');
  assert(action.target===s.actor||action.target===(s.actor^1),'Invalid card target');
  const card=p.hand[action.slot];assert(card>=45&&card<=51,'Only movement cards45..51 are part of CARD-RACE');
  p.hand.splice(action.slot,1);const returned=returnCard(s.deck,card,s.seed);s.deck=returned.deck;s.seed=returned.state;
  s.events.push({type:'card-used',player:s.actor,target:action.target,card});s.phase='resolving';
  move(s,action.target,(card-44)*(action.target===s.actor?1:-1));landing(s,action.target);return s;
}
/** Source policy FUN800c82c4, with explicit RNG result. Set state's seed to the
 * returned seed before applying action. Opening roulette timing is external.
 */
export function chooseRaceAction(state){
  const s=copy(state),p=s.players[s.actor];
  if(s.phase==='opening-roll')return {action:{type:'roll',value:1+random(s)%4},seed:s.seed};
  if(s.phase==='choose-card'){
    const owner=s.players[s.pending.player],policy=owner.drawPolicy??0;let index=0,best=1000;
    if(policy>=5)index=random(s)%3;else s.deck.slice(0,3).forEach((id,i)=>{const rank=RACE_DRAW_PRIORITY[policy].indexOf(id);if(rank>=0&&rank<best){index=i;best=rank;}});
    // FUN800c7870 priority rows contain no race cards45..51, hence default0.
    const discardSlot=owner.discardPolicy===3?random(s)%4:0;
    return {action:{type:'choose-card',index,...(owner.hand.length===3?(discardSlot===3?{discard:true}:{replaceSlot:discardSlot}):{})},seed:s.seed};
  }
  assert(s.phase==='menu','AI requires interactive phase');
  const available=[];if(p.hand.length)available.push(0);if(p.chakra>=200&&p.hand.length<3)available.push(1);available.push(2,3);
  let score=0,choice=0,slot=0,target=s.actor,drawChoice=null;
  for(let j=0;j<3;j++){
    const a=available[j];
    if(a===0){
      for(let k=0;k<p.hand.length;k++){
        const value=p.hand[k]-44,selfDistance=raceDistance(s.tiles,p.tile),otherDistance=raceDistance(s.tiles,s.players[s.actor^1].tile);
        if(selfDistance<=value){score=100000;choice=j;slot=k;target=s.actor;break;}
        const useOther=otherDistance<selfDistance-value&&selfDistance-otherDistance>9;
        // Source inspects forward neighbor0 even for an opponent-target card.
        let t=s.players[useOther?s.actor^1:s.actor].tile;
        for(let n=0;n<value;n++)t=nextTile(s.tiles,t,0);
        const type=s.tiles[t].typeCode,avoid=useOther?[10,11,16,17]:[12,13,14,15,18,19];
        if(!avoid.includes(type)&&score<value*100+300){score=value*100+300;choice=j;slot=k;target=useOther?s.actor^1:s.actor;}
      }
    }else if(a===1){
      const max=Math.max(0,...p.hand.map(id=>id-44)),distance=raceDistance(s.tiles,p.tile);
      if(max<distance&&distance<7)score=0;
      if(score<200){score=200;choice=j;drawChoice=random(s)%3;}
    }else if(a===2&&score<100&&p.chakra<200){score=100;choice=j;}
  }
  const selected=available[choice];
  return {action:selected===0?{type:'play-card',slot,target}:selected===1?{type:'draw'}:{type:'rest'},seed:s.seed,drawChoice};
}
