// Transport adapter for the recovered rules. Never export the engine checkpoint to clients.
import * as E from './engine.js';
import * as B from './board-adapter.js';
import {cpuCombatCard} from './story1-cpu-combatcard.mjs';
import {partyResult} from './party-outcomes.mjs';
import data from './game-data.json' with {type:'json'};

export const policyVersion='local-party-v1';
const phaseNames={roll:'pre_move',move:'movement',chance:'tile_resolution',discard:'tile_resolution',cardTarget:'pre_move',land:'tile_resolution',upgrade:'tile_resolution',forcedSale:'tile_resolution',bonusUpgrade:'source_bonus',scrollTarget:'pre_move',scrollRoll:'roulette',attackCard:'combat',defenseCard:'combat',attack:'combat',defend:'combat',attackRoll:'combat',defenseRoll:'combat',end:'turn_end',won:'results'};
export function actor(s){
  if(['defenseCard','defend','defenseRoll'].includes(s.phase))return s.battle.defender;
  if(s.phase==='scrollRoll')return s.players.indexOf(E.scrollPlayer(s));
  return s.turn;
}
function wheel(s){return s.wheel??(['attackRoll','defenseRoll'].includes(s.phase)?s.battle.wheel:s.phase==='scrollRoll'?s.scroll.wheel:null);}
function step(s,ticks){
  if(s.phase==='roll')E.stepRoll(s,ticks);
  else if(s.phase==='scrollRoll')E.stepScrollRoll(s,data,ticks);
  else E.stepBattleRoll(s,data,ticks);
}
function stop(s,tick,cpu=false){
  const w=wheel(s);if(!w)return false;
  const phase=s.phase,seat=actor(s),serial=s.scroll?.rollSerial;
  // Server elapsed ticks determine the stop, never a client supplied face/result.
  if(cpu&&['attackRoll','defenseRoll'].includes(s.phase))E.prepareCpuBattleStop(s,data);
  const count=Math.max(10,Math.min(7200,tick-(s.wheelTick??tick)));
  for(let i=0;i<count&&wheel(s)&&s.phase===phase&&actor(s)===seat&&s.scroll?.rollSerial===serial;i++)step(s,1);
  if(!wheel(s)||s.phase!==phase||actor(s)!==seat||s.scroll?.rollSerial!==serial)return true;
  if(s.phase==='roll')E.requestRollStop(s);
  else if(s.phase==='scrollRoll')E.requestScrollStop(s);
  else E.requestBattleStop(s);
  for(let i=0;i<1500&&wheel(s)&&s.phase===phase&&actor(s)===seat&&s.scroll?.rollSerial===serial;i++)step(s,1);
  return true;
}
function cardLabel(id){return `Kartu ${id+1}: ${E.cardDescription(data.cards[id])}`;}
export function options(s){
  if(s.phase==='won')return [];
  const out=[], add=(id,label,enabled=true,extra={})=>out.push({id,label,enabled,...extra});
  if(s.surrender!==undefined){add('surrender:yes','Ya, menyerah dan akhiri pertandingan');add('surrender:no','Kembali bermain');return out;}
  if(wheel(s)){add('stop','Hentikan roulette');return out;}
  switch(s.phase){
    case 'roll':
      add('roll','Putar roulette');
      for(const c of E.usableCards(s,data))add(`card:${c.slot}`,cardLabel(c.id),true,{cardSlot:c.slot});
      for(const j of E.jutsuChoices(s,data).filter(j=>j.available))for(const t of j.targets)add(`jutsu:${j.id}:${t}`,`${j.label} → petak ${t+1}`,true,{tileId:t,skillPointCost:j.cost});
      for(const p of E.scrollChoices(s,data).filter(p=>p.enabled))add(`scroll:${p.id}`,`Gulungan: ${p.name??p.id}`);
      break;
    case 'move':for(const t of E.paths(s,data))add(`move:${t}`,`Langkah ke petak ${t+1}`,true,{tileId:t});break;
    case 'land':case 'bonusUpgrade':for(const a of E.actions(s,data))add(`act:${a.id}`,a.label,!a.disabled,a.cost!==undefined?{chakraCost:a.cost}:{});break;
    case 'upgrade':
      for(const t of E.owned(s))if(s.selectedTile===null||s.selectedTile===undefined||s.selectedTile===t)for(const c of E.upgradeChoices(s,data,t))add(`upgrade:${t}:${c.level}`,`Petak ${t+1} → Lv.${c.level}`,!c.disabled,{tileId:t,chakraCost:c.cost});
      add('cancelUpgrade','Selesai');break;
    case 'forcedSale':for(const c of E.saleChoices(s,data))add(`sell:${c.tile}`,`Jual petak ${c.tile+1} (+${c.saleDelta})`,true,{tileId:c.tile});break;
    case 'chance':E.chanceChoices(s,data).forEach((c,i)=>add(`chance:${i}`,cardLabel(c.id),true,{cardId:c.id}));break;
    case 'discard':for(let i=0;i<4;i++)add(`discard:${i}`,i===3?'Buang kartu baru':`Buang ${cardLabel(E.current(s).inventory[i])}`);break;
    case 'cardTarget':
      for(const t of E.cardTargets(s,data))add(`target:${t.id}`,t.label,true,t.kind==='tile'?{tileId:t.id}:{targetSeat:t.id});
      if(s.cardOrigin==='inventory')add('cancelCard','Batal memakai kartu');break;
    case 'scrollTarget':for(const t of E.scrollTargets(s,data))add(`scrollTarget:${t}`,`Penghalang petak ${t+1}`,true,{tileId:t});break;
    case 'attackCard':case 'defenseCard':
      for(const c of E.combatCards(s,data))add(`combatCard:${c.slot}`,cardLabel(c.id),true,{cardSlot:c.slot});
      add('combatCard:-1','Tanpa kartu');break;
    case 'attack':case 'defend':for(const t of E.techniqueChoices(s,data))add(`tech:${t.index}`,`${s.phase==='attack'?'Serang':'Bertahan'} ${t.index+1} · kekuatan ${t.power}`,!t.disabled,{techniqueIndex:t.index,chakraCost:t.cost});break;
    case 'end':add('end','Lanjut giliran');break;
  }
  if(s.phase==='roll'&&!wheel(s))add('surrender','Menyerah…');
  return out;
}
function apply(s,id,tick){
  const [kind,a,b]=id.split(':');let ok;
  switch(kind){
    case 'roll':ok=E.startRoll(s);break;
    case 'stop':ok=stop(s,tick);break;
    case 'move':ok=E.moveOne(s,data,+a);break;
    case 'act':ok=E.act(s,data,a);break;
    case 'upgrade':ok=E.act(s,data,'upgradeTile',+a,+b);break;
    case 'cancelUpgrade':ok=E.cancelUpgrade(s,data);break;
    case 'sell':ok=E.sellBarrier(s,data,+a);break;
    case 'chance':ok=E.chooseChance(s,data,+a);break;
    case 'discard':ok=E.discardCard(s,data,+a);break;
    case 'card':ok=E.useCard(s,data,+a);break;
    case 'target':ok=E.chooseCardTarget(s,data,+a);break;
    case 'cancelCard':ok=E.cancelCard(s);break;
    case 'jutsu':ok=E.useJutsu(s,data,+a,+b);break;
    case 'scroll':ok=E.useScroll(s,data,+a);break;
    case 'scrollTarget':ok=E.chooseScrollTarget(s,data,+a);break;
    case 'combatCard':ok=E.selectCombatCard(s,data,+a);break;
    case 'tech':ok=E.chooseTechnique(s,data,+a);break;
    case 'end':ok=E.endTurn(s,data);break;
    case 'surrender':
      if(a==='yes'){s.surrenderingSeat=s.surrender;s.winner=s.turn;s.phase='won';delete s.surrender;}
      else if(a==='no')delete s.surrender;
      else s.surrender=s.turn;
      ok=true;break;
  }
  if(ok===false)throw new Error('Rule rejected offered action '+id);
}
function cpu(s,tick){
  // Original decision functions where context is available. Unrecovered Party relationship
  // memory and target selection use this explicitly versioned LOCAL policy, never claimed 1:1.
  if(s.surrender!==undefined){delete s.surrender;return;}
  if(wheel(s)){stop(s,tick,true);return;}
  let id;
  switch(s.phase){
    case 'roll':E.startCpuRoll(s,data);return;
    case 'move':id=`move:${E.aiPath(s,data)}`;break;
    case 'land':case 'bonusUpgrade':id=`act:${E.aiAction(s,data)}`;break;
    case 'upgrade':{const u=E.aiUpgrade(s,data);id=u?`upgrade:${u.tile}:${u.level}`:'cancelUpgrade';break;}
    case 'forcedSale':id=`sell:${E.aiSale(s,data)}`;break;
    case 'chance':id=`chance:${E.aiChance(s,data)}`;break;
    case 'discard':id=`discard:${E.aiDiscard(s,data)}`;break;
    case 'attack':case 'defend':id=`tech:${E.aiTechnique(s,data)}`;break;
    case 'attackCard':case 'defenseCard':{
      const r=cpuCombatCard({inventory:E.battlePlayer(s).inventory,cards:data.cards,side:E.battleSide(s),rngState:s.seed});s.seed=r.rngState;id=`combatCard:${r.valid?r.slot:-1}`;break;
    }
    case 'end':id='end';break;
    default:id=options(s).find(o=>o.enabled)?.id;
  }
  if(!options(s).some(o=>o.id===id&&o.enabled))throw new Error('CPU has no legal action: '+s.phase);
  apply(s,id,tick);
}
function init(p){
  const s=E.newGame(data,{map:0,humans:4,seed:p.seed});
  const initial=s.players;
  s.players=p.roster.map((r,i)=>({...structuredClone(initial[r.characterId]),id:r.characterId,name:r.name,human:true,flags:i<<10,ninjutsu:[[10,1],[10,12],[0,1,2],[10,1]][r.characterId]}));
  s.target=p.target;s.skillAward=4;s.modeFlags=0;s.relationships=null;
  s.onlineNotes=['local-party-v1: pre-roll CPU skips optional card/jutsu/scroll; Party relationship-dependent branches use neutral hostility. Not certified PS1 behavior.'];
  return s;
}
export function execute(p){
  const previousSeed=p.state?.seed??p.seed;
  const s=p.state??init(p), oldWheel=wheel(s), oldPhase=s.phase,oldActor=actor(s),oldSerial=s.scroll?.rollSerial;
  if(p.mode==='command'){
    if(actor(s)!==p.seat||!options(s).some(o=>o.id===p.option&&o.enabled))throw new Error('Illegal action');
    apply(s,p.option,p.tick);
  }else if(p.mode==='cpu')cpu(s,p.tick);
  // Keep CPU fallback traces bounded and persistent for research/audit.
  if(s.unresolved)s.unresolved=[...new Set(s.unresolved)].slice(-20);
  if(wheel(s)&&(!oldWheel||s.phase!==oldPhase||actor(s)!==oldActor||s.scroll?.rollSerial!==oldSerial))s.wheelTick=p.tick;
  let seed=previousSeed>>>0,draws=0;
  while(seed!==s.seed&&draws<200000){seed=(Math.imul(seed,0x41c64e6d)+0x3039)>>>0;draws++;}
  if(seed!==s.seed)throw new Error('RNG progression cannot be audited');
  s.rngDrawCount=(s.rngDrawCount??0)+draws;
  const acting=actor(s),choiceId=p.choiceId,privateBySeat={},allowedBySeat={};
  s.players.forEach((player,i)=>{
    privateBySeat[i]={seat:i,cards:player.inventory.flatMap((id,slot)=>id===255?[]:[{slot,cardId:id}]),cardUsed:i===s.turn&&!!s.cardUsed,jutsuUsed:i===s.turn&&!!s.jutsuUsed};
    allowedBySeat[i]=i===acting&&s.phase!=='won'?[{type:'choice.select',choiceId,options:options(s),expiresAt:null}]:[];
  });
  let result=null;
  if(s.phase==='won'){
    const rank=partyResult({players:s.players.map(p=>({...p,actorStatus:p.actorStatus??0})),winnerSlot:s.surrenderingSeat===undefined?s.winner:255,surrenderingSlot:s.surrenderingSeat??null});
    result={reason:s.surrenderingSeat===undefined?'source_victory':'surrender',winnerSeat:s.surrenderingSeat===undefined?s.winner:null,entries:rank.order.map((seat,i)=>({seat,characterId:s.players[seat].id,chakra:s.players[seat].chakra,badgeId:rank.badgeIds[i]})),endedAt:p.now,description:s.surrenderingSeat===undefined?`${s.players[s.winner].name} menang di gerbang.`:`${s.players[s.surrenderingSeat].name} menyerah.`};
  }
  const w=wheel(s);
  return {engine:s,actor:acting,seed:s.seed,rngDrawCount:s.rngDrawCount,choiceId,privateBySeat,allowedBySeat,trace:{policy:policyVersion,unresolved:s.unresolved??[],notes:s.onlineNotes??[]},public:{
    phase:w?'roulette':phaseNames[s.phase],turnSeat:s.turn,round:s.round,targetChakra:s.target,
    players:s.players.map((p,i)=>({seat:i,characterId:p.id,position:p.pos,direction:p.direction>=0&&p.direction<4?p.direction:null,chakra:p.chakra,skillPoints:p.skill,eliminated:!!(p.actorStatus&1),possessed:!!(p.playerStatus&32),skipNextTurn:!!p.skipTurns,hasScroll:!!(p.flags&512),crystalTileIds:p.crystals,inventoryCount:p.inventory.filter(i=>i!==255).length})),
    tiles:data.maps[0].tiles.map((t,i)=>({id:t.id,typeCode:s.tileTypes[i],ownerSeat:s.estates[i]?.owner??null,level:s.estates[i]?.level??0,hp:s.estates[i]?.hp??0,effectId:s.tileEffects[i]?.effect??0,repairCounter:s.estates[i]?.repairCounter??0,x:t.x,y:t.y,neighbors:(t.neighborSlots??t.neighbors).map(n=>n===255?null:n),purchasePrice:t.buyCost,upgradeBase:t.upgradeCost,rents:t.rents})),
    roulette:w?{id:choiceId,actorSeat:acting,kind:s.phase==='roll'?'movement':s.phase==='scrollRoll'?'scroll':s.phase==='attackRoll'?'attack':'defense',phase:'spinning',faces:w.faces,angle:w.angle,startedAtTick:s.wheelTick??p.tick,stopRequestedAtTick:null,result:null}:null,
    result,presentation:{phase:s.phase,actorSeat:acting,remaining:s.remaining,lastRoll:s.lastRoll,message:s.lastEvent?`${s.lastEvent.title}: ${s.lastEvent.text??''}`:s.log[0]??'',log:s.log.slice(0,8)}
  }};
}
export function run(input){return JSON.stringify(execute(JSON.parse(input)));}
