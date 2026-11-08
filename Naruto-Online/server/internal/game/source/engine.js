// Browser reconstruction. Map/economy tables are extracted; battle/AI/card subset is adapted.
import * as R from './faithful-rules.mjs';
import * as C from './faithful-combat.mjs';
import * as W from './faithful-roulette.mjs';
import * as B from './board-adapter.js';
import * as AI from './board-ai.mjs';
import * as Economy from './story1-economy.mjs';
import * as StoryCPU from './story1-cpu.mjs';
import {story1DefenderRoute,story1CpuInitialRoute,story1DirectionMenu} from './story1-route.mjs';
import * as Scroll from './story1-scroll.mjs';
import * as PreRoll from './story1-cpu-preroll.mjs';
import * as CpuWheel from './story1-cpu-roulette.mjs';
import {cpuCombatCard} from './story1-cpu-combatcard.mjs';
import {possessionRecoveryFaces,finishPossessionRecovery,scenarioInitialPlayers,sourceResultRanking,type8Landing} from './board-effects.mjs';
export {jutsuChoices,useJutsu} from './board-adapter.js';
export const VERSION = 2;
export function randomInt(s) {const r=R.ps1Random(s.seed);s.seed=r.state;return r.value;}
export function rng(s) {return randomInt(s)/32768;}
export function pick(s,arr){return arr[randomInt(s)%arr.length];}
export function newGame(data,{character=0,map=0,humans=1,seed=Date.now(),scenarioId=null,campaign=null}={}){
 const scenario=scenarioId===null?(data.scenarios.find(x=>x.mapId===map)||data.scenarios[0]):data.allScenarios.find(x=>x.id===scenarioId);
 if(!scenario)throw new RangeError('Unknown scenario');if(scenarioId!==null)map=scenario.mapId;
 const roster=scenarioId!==null?scenario.players.map(p=>p.characterId):[character,...[0,1,2,3].filter(x=>x!==character)].slice(0,4);
 const state={version:VERSION,seed:(seed>>>0)||1,mapId:map,round:1,turn:0,phase:'roll',target:scenario.targetChakra,baseBonus:scenario.baseBonus,roulette:scenario.roulette,remaining:0,lastRoll:0,winner:null,selectedTile:null,
 scenarioId,campaign,relationships:scenarioId===null?null:StoryCPU.scenarioRelationships(scenario),skillAward:scenarioId===null?1:scenario.unknownSetting17,modeFlags:scenarioId===null?0:scenario.modeFlags,ruleParameters:scenario.ruleParameters??[],
 players:roster.map((id,i)=>({id,name:data.characters[id].name,human:i<humans,chakra:scenario.initialChakra,skill:scenario.initialSkillPoints,pos:0,prev:-1,crystals:[],laps:0})),
 deckId:scenario.deckId,decks:[],pendingCard:null,
 estates:data.maps[map].tiles.map(()=>null),log:['Misi dimulai. Kumpulkan semua kristal, lalu kembali ke gerbang.'],lastEvent:null};
 for(const pool of data.decks[scenario.deckId].pools){const shuffled=R.shuffleDeck(pool,state.seed);state.decks.push(shuffled.deck);state.seed=shuffled.state;}
 const initial=scenarioId===null?null:scenarioInitialPlayers(scenario);
 for(const [i,p] of state.players.entries()){if(initial){p.human=!(initial[i].flags&0x100);p.flags=initial[i].flags;}p.ninjutsu=(scenarioId===null?(data.allScenarios.flatMap(s=>s.players).find(r=>r.characterId===p.id)?.techniqueIds??[]):scenario.players[i].techniqueIds).filter(id=>id<14);p.flags=(i<<10)|(p.human?0:0x100);p.team=255;p.persistentTeam=0;p.inventory=[255,255,255];p.forcedRoll=0;p.skipTurns=0;p.rouletteStatus=0;p.protection=0;}
 state.tileEffects=state.estates.map(()=>({effect:0}));state.tileTypes=data.maps[map].tiles.map(t=>t.typeCode);
 for(const t of data.maps[map].tiles)if(t.typeCode===8)state.estates[t.id]={owner:0,level:3,hp:4,repairCounter:0};
 return state;
}
export function log(s,text){s.log.unshift(text);s.log=s.log.slice(0,30);}
export function board(s,data){return data.maps[s.mapId];}
export function current(s){return s.players[s.turn];}
export function owned(s,who=s.turn){return s.estates.flatMap((e,i)=>e?.owner===who?[i]:[]);}
export function ruleTiles(s,data){return board(s,data).tiles.map((t,i)=>({...t,neighbors:t.neighborSlots||t.neighbors,...s.estates[i],typeCode:s.estates[i]?5:t.typeCode}));}
export function rent(s,data,id){
 if(!s.estates[id])return 0;const tiles=ruleTiles(s,data);
 return R.barrierRent(tiles[id],R.barrierChains(tiles).chains[id]);
}
export function bonus(s,data,who=s.turn){return R.sourceBonus(ruleTiles(s,data),who,s.baseBonus);}
export function startRoll(s,useForcedMove=false){
 if(s.phase!=='roll')return false;if(s.wheel)return true;B.checkScrollDebt(s);s.lastEvent=null;const p=current(s);
 if(p.skipTurns){p.skipTurns--;s.phase='end';s.lastEvent={kind:'card',title:'Istirahat',text:`${p.name} melewati giliran ini.`};return true;}
 if(p.playerStatus&0x20){const recovery=possessionRecoveryFaces({...p,status:p.playerStatus});p.possessionAttempts=recovery.player.possessionAttempts;s.possessionRoll=true;s.wheel=W.startBoardRoulette(recovery.faces,s.seed,{targetValue:s.nextRollTarget??null});delete s.nextRollTarget;s.seed=s.wheel.rngState;return true;}
 // BOARD800cf7.. replaces the roulette action with the assigned movement card.
 // It is not an optional second roll, and consumes no roulette RNG.
 if(p.forcedRoll){s.lastRoll=p.forcedRoll;p.forcedRoll=0;s.remaining=s.lastRoll;s.phase='move';return true;}
 if(useForcedMove)return false;
 const faces=R.rouletteForStatus(s.rouletteSlots??s.roulette,p.rouletteStatus,p.playerStatus??0);
 s.wheel=W.startBoardRoulette(faces,s.seed,{targetValue:s.nextRollTarget??null});delete s.nextRollTarget;s.rouletteSlots=s.wheel.faces.slice();s.seed=s.wheel.rngState;return true;
}
export function rollFace(s){return s.wheel?W.rouletteValue(s.wheel):s.lastRoll;}
export function stepRoll(s,ticks=1){
 if(s.phase!=='roll'||!s.wheel)return false;s.wheel=W.advanceBoardRoulette(s.wheel,ticks);s.seed=s.wheel.rngState;
 if(s.wheel.phase===6&&s.possessionRoll){const p=current(s),value=W.rouletteValue(s.wheel);p.playerStatus=finishPossessionRecovery({status:p.playerStatus},value).status;s.possessionRoll=false;delete s.wheel;if(p.playerStatus&0x20){s.phase='end';s.lastEvent={kind:'status',title:'Kerasukan',text:'Roulette pemulihan belum menghasilkan 1.'};}else{s.lastEvent={kind:'status',title:'Pulih',text:'Status kerasukan hilang. Putar roulette untuk melangkah.'};}return true;}
 if(s.wheel.phase===6){const p=current(s),restore=!!((p.rouletteStatus&240)||(p.playerStatus&2)),result=W.finishBoardRoll(s.wheel,p);p.rouletteStatus=result.player.rouletteStatus;p.playerStatus=result.player.playerStatus;if(restore)s.rouletteSlots=s.roulette.slice();if(p.flags&0x200)p.scrollCounter=((p.scrollCounter??0)+1)&255;s.lastRoll=result.movement;s.remaining=s.lastRoll;s.phase='move';delete s.wheel;}
 return true;
}
export function requestRollStop(s){if(s.phase!=='roll'||s.wheel?.phase!==2)return false;s.wheel=W.stopBoardRoulette(s.wheel);s.seed=s.wheel.rngState;return true;}
export function roll(s,useForcedMove=false){
 if(!startRoll(s,useForcedMove))return null;
 if(s.wheel){stepRoll(s,10);if(s.wheel?.targetValue===null)requestRollStop(s);for(let i=0;s.wheel&&i<1000;i++)stepRoll(s,1);}
 return s.lastRoll;
}
export function paths(s,data){const p=current(s),t=board(s,data).tiles[p.pos];if(s.mapId===0&&p.prev<0)return story1DirectionMenu(board(s,data).tiles,p.pos).filter(r=>r.next!==255).map(r=>r.next);const next=t.neighbors.filter(x=>x!==p.prev);return next.length?next:t.neighbors;}
export function moveOne(s,data,next){
 if(s.phase!=='move'||!paths(s,data).includes(next))return false;
 const p=current(s);p.direction=(board(s,data).tiles[p.pos].neighborSlots??board(s,data).tiles[p.pos].neighbors).indexOf(next);p.prev=p.pos;p.pos=next;s.remaining--;return enterTile(s,data);
}
function enterTile(s,data){
 const effect=B.tileEffect(s,data);if(effect.warped)return enterTile(s,data);
 const p=current(s),next=p.pos,tile=board(s,data).tiles[next];
 if(tile.type==='crystal'&&!p.crystals.includes(next)){p.crystals.push(next);log(s,`${p.name} mengambil kristal air.`);s.lastEvent={kind:'crystal',title:'Kristal air didapat',text:'Satu langkah lebih dekat ke bonus chakra.'};}
 if(tile.type==='chance'){s.phase='chance';return true;}
 const all=board(s,data).tiles.filter(t=>t.type==='crystal').every(t=>p.crystals.includes(t.id));
 if(tile.type==='source'&&all){
  const result=B.sourceBonus(s,data,{deferScroll:true}),gain=result.bonus;
  log(s,`${p.name} kembali ke gerbang: +${gain} chakra!`);s.lastEvent={kind:'bonus',title:'Putaran lengkap!',text:`+${gain} chakra · +${s.skillAward??1} poin ninjutsu`};
  if(result.victory.won){s.winner=s.turn;s.phase='won';s.remaining=0;log(s,`${p.name} memenangkan perebutan wilayah!`);return true;}
  // 800edd68 case8 interrupts even a passing visit, then case10 awards scroll.
  if(!s.remaining){p.prev=-1;p.direction=255;p.facing=255;}
  if(owned(s).some(i=>canUpgrade(s,data,i))){s.phase='bonusUpgrade';s.upgradeOrigin='sourceBonus';return true;}
  B.awardSourceScroll(s,data);
 }
 if(!s.remaining){s.phase='land';if(tile.type==='source'){p.prev=-1;p.direction=255;p.facing=255;}if((s.tileTypes?.[p.pos]??tile.typeCode)===8){const r=type8Landing(B.toRules(s,data),s.turn,{techniqueCosts:data.techniques[p.id].attacks.map(t=>t.cost),hasFifthTechnique:data.techniques[p.id].attacks.length>4});if(r.action==='attack'){s.phase='attack';s.battle={tile:p.pos,defender:0,attackIndex:null,battleHp:r.hp,specialBarrier:true};}else s.phase='end';}}return true;
}
export function upgradeCost(s,data,id,level){return R.upgradePrice(board(s,data).tiles[id].upgradeCost,s.estates[id].level,level);}
export function canUpgrade(s,data,id,level=s.estates[id]?.level+1){const e=s.estates[id];return e?.owner===s.turn&&Number.isInteger(level)&&level>e.level&&level<=5&&(!(s.phase==='upgrade'&&s.upgradeMode==='remote')||level===e.level+1)&&current(s).chakra>=upgradeCost(s,data,id,level);}
export function upgradeChoices(s,data,id){const e=s.estates[id];return e?Array.from({length:s.upgradeMode==='remote'?Math.min(1,5-e.level):5-e.level},(_,i)=>e.level+i+1).map(level=>({level,cost:upgradeCost(s,data,id,level),disabled:!canUpgrade(s,data,id,level)})):[];}

export function actions(s,data){
 if(s.phase==='bonusUpgrade')return [{id:'selectUpgrade',label:'Tingkatkan wilayah satu level'},{id:'end',label:s.remaining?'Lanjutkan langkah':'Akhiri giliran'}];
 if(s.phase!=='land')return [];const p=current(s),t=board(s,data).tiles[p.pos],e=s.estates[p.pos];
 if(t.type==='estate'&&!e)return [{id:'claim',label:'Pasang penghalang',cost:t.buyCost,disabled:p.chakra<t.buyCost},{id:'end',label:'Lewati'}];
 if(e?.owner===s.turn)return [{id:'upgrade',label:'Tingkatkan penghalang',cost:t.upgradeCost,disabled:!canUpgrade(s,data,p.pos)},{id:'end',label:'Akhiri giliran'}];
 if(e&&s.modeFlags&0x1000&&s.players[e.owner].team===p.team)return [{id:'end',label:'Wilayah rekan satu tim'}];
 if(e&&s.suppressLanding)return [{id:'pay',label:'Bayar chakra',cost:rent(s,data,p.pos)}];
 if(e)return [{id:'pay',label:'Bayar chakra',cost:rent(s,data,p.pos)},{id:'attack',label:'Tantang pemilik wilayah',disabled:!attackEligibility(s,data).available}];
 if(['crystal','source'].includes(t.type)&&owned(s).some(i=>canUpgrade(s,data,i)))return [{id:'selectUpgrade',label:'Tingkatkan wilayah',hint:'Pilih petak milikmu di papan'},{id:'end',label:'Akhiri giliran'}];
 return [{id:'end',label:'Akhiri giliran'}];
}
export function act(s,data,id,tileId,newLevel){
 if(id==='upgradeTile'){
  if(s.phase!=='upgrade'||!canUpgrade(s,data,tileId,newLevel))return false;
  upgrade(s,data,tileId,newLevel);finishUpgrade(s,data);return true;
 }
 if(!actions(s,data).some(a=>a.id===id&&!a.disabled))return false;
 const p=current(s),t=board(s,data).tiles[p.pos],e=s.estates[p.pos];s.lastEvent=null;
 if(id==='end'){if(s.phase==='bonusUpgrade')finishUpgrade(s,data);else s.phase='end';return true;}
 if(id==='selectUpgrade'){s.phase='upgrade';s.upgradeMode='remote';s.selectedTile=null;return true;}
 if(id==='claim'){p.chakra-=t.buyCost;s.tileTypes??=board(s,data).tiles.map(t=>t.typeCode);s.tileTypes[p.pos]=5;s.estates[p.pos]={owner:s.turn,level:1,hp:2,repairCounter:0};log(s,`${p.name} memasang penghalang di petak ${p.pos+1}.`);}
 if(id==='upgrade'){s.phase='upgrade';s.upgradeMode='local';s.selectedTile=p.pos;return true;}
 if(id==='pay'){const amount=B.payToll(s,data);log(s,`${p.name} membayar ${amount} chakra ke ${s.players[e.owner].name}.`);}
 if(id==='attack'){s.phase='attack';const defense=B.barrierDefense(s,data,p.pos),eligibility=attackEligibility(s,data);s.battle={tile:p.pos,defender:e.owner,attackIndex:null,battleHp:defense.battleHp,forceHalfCostCard:eligibility.forceHalfCostCard,nextCardSide:0};advanceCombatCards(s,data);return true;}

 s.phase='end';if(id==='pay')beginForcedSale(s,data);return true;
}
function finishUpgrade(s,data){if(s.upgradeOrigin==='sourceBonus'){B.awardSourceScroll(s,data);s.phase=s.remaining?'move':'end';}else s.phase='end';delete s.upgradeOrigin;delete s.upgradeMode;}
export function cancelUpgrade(s,data){if(s.phase!=='upgrade')return false;finishUpgrade(s,data);return true;}
function beginForcedSale(s,data){if(Economy.forcedSaleRequired(B.toRules(s,data),s.turn,{projectedChakra:current(s).chakra}))s.phase='forcedSale';}
export function saleChoices(s,data){return s.phase==='forcedSale'?Economy.forcedSaleCandidates(B.toRules(s,data),s.turn):[];}
export function sellBarrier(s,data,tile){if(!saleChoices(s,data).some(c=>c.tile===tile))return false;const r=Economy.commitBarrierSale(B.toRules(s,data),s.turn,tile);B.applyRules(s,r,data);s.phase=r.needsAnotherSale?'forcedSale':'end';s.lastEvent={kind:'sale',title:'Penghalang dijual',text:`Petak ${tile+1} · +${r.saleDelta} chakra`};log(s,`${current(s).name} menjual penghalang ${tile+1}: +${r.saleDelta} chakra.`);return true;}
export function aiSale(s,data){return Economy.cpuForcedSale(B.toRules(s,data),s.turn).tile;}
function scrollRules(s,data){const r=B.toRules(s,data);for(const p of r.players){p.scrollBonusCount=p.scrollSeals??0;p.scrollNegativeBonusCount=p.debtTurns??0;p.scrollRollCount=p.scrollCounter??0;}return r;}
function applyScroll(s,r,data){for(const p of r.players){p.scrollSeals=p.scrollBonusCount;p.debtTurns=p.scrollNegativeBonusCount;p.scrollCounter=p.scrollRollCount;}B.applyRules(s,r,data);s.scrollAction=r.scrollAction;}
export function scrollChoices(s,data){return s.phase==='roll'?Scroll.scrollPowerOptions(scrollRules(s,data),s.turn).map(p=>({...p,enabled:p.enabled&&!(p.id===3&&(s.modeFlags&0x1000))})):[];}
export function useScroll(s,data,power){if(s.phase!=='roll'||s.wheel||!scrollChoices(s,data).some(p=>p.id===power&&p.enabled))return false;const r=Scroll.consumeScrollPower(scrollRules(s,data),s.turn,power);applyScroll(s,r,data);s.scroll={power,actor:s.turn,rollSerial:0,rolls:[]};if(power===0)finishScroll(s,data,{});else if(power===2)s.phase='scrollTarget';else startScrollWheel(s,power===3?'absorb':'level');return true;}
export function scrollTargets(s,data){return s.phase==='scrollTarget'?B.toRules(s,data).tiles.flatMap((t,i)=>t.typeCode===5&&t.owner!==s.turn&&(!(s.modeFlags&0x1000)||s.players[t.owner]?.team!==current(s).team)?[i]:[]):[];}
export function chooseScrollTarget(s,data,tile){if(!scrollTargets(s,data).includes(tile))return false;s.scroll.target=tile;s.scroll.defender=s.estates[tile].owner;startScrollWheel(s,'defender');return true;}
function startScrollWheel(s,stage){const q=s.scroll;q.stage=stage;q.rollSerial++;const faces=stage==='attacker'||q.power===3?(s.rouletteSlots??s.roulette):Scroll.scrollPowerRouletteFaces(q.power,s.roulette);let targetValue=null;if(!scrollPlayer(s).human||(scrollPlayer(s).playerStatus&32)){const r=Scroll.cpuScrollRouletteTarget(faces,s.seed);targetValue=r.target;s.seed=r.rngState;}q.wheel=W.startBoardRoulette(faces,s.seed,{targetValue});s.rouletteSlots=q.wheel.faces.slice();s.seed=q.wheel.rngState;s.phase='scrollRoll';}
export function scrollPlayer(s){const q=s.scroll;if(q.stage==='absorb'){const targets=scrollAbsorptionTargets(s);return s.players[targets[q.rolls.length]];}return s.players[q.stage==='defender'?q.defender:q.actor];}
function scrollAbsorptionTargets(s){const actor=s.scroll.actor;return Array.from({length:s.players.length-1},(_,i)=>(actor+i+1)%s.players.length).filter(i=>!(s.players[i].actorStatus&1));}
export function scrollRollFace(s){return W.rouletteValue(s.scroll.wheel);}
export function requestScrollStop(s){if(s.phase!=='scrollRoll'||s.scroll.wheel.phase!==2)return false;s.scroll.wheel=W.stopBoardRoulette(s.scroll.wheel);s.seed=s.scroll.wheel.rngState;return true;}
export function stepScrollRoll(s,data,ticks=1){if(s.phase!=='scrollRoll')return false;s.scroll.wheel=W.advanceBoardRoulette(s.scroll.wheel,ticks);s.seed=s.scroll.wheel.rngState;if(s.scroll.wheel.phase===6)stopScrollRoulette(s,data,s.scroll.wheel.faces.indexOf(scrollRollFace(s)));return true;}
export function stopScrollRoulette(s,data,index){if(s.phase!=='scrollRoll'||!Number.isInteger(index)||index<0||index>11)return false;const q=s.scroll,value=q.wheel.faces[index];
 if(q.power===1)finishScroll(s,data,{value});
 else if(q.power===2){if(q.stage==='defender'){q.defenderRoll=value;if(value===11)finishScroll(s,data,{target:q.target,defenderRoll:11});else startScrollWheel(s,'attacker');}else finishScroll(s,data,{target:q.target,defenderRoll:q.defenderRoll,attackerRoll:value});}
 else {const targets=scrollAbsorptionTargets(s);q.rolls.push({actor:targets[q.rolls.length],value});if(q.rolls.length===targets.length)finishScroll(s,data,{rolls:q.rolls});else startScrollWheel(s,'absorb');}return true;
}
function finishScroll(s,data,values){const r=Scroll.resolveScrollPower(scrollRules(s,data),values);applyScroll(s,r,data);if([1,2].includes(r.scrollOutcome.power))s.rouletteSlots=s.roulette.slice();s.lastEvent={kind:'scroll-power',title:Scroll.SCROLL_POWERS[r.scrollOutcome.power].name,text:r.scrollOutcome.success===false?'Teknik tidak berhasil.':r.scrollOutcome.power===3?`${r.scrollOutcome.total} chakra diserap.`:'Kekuatan gulungan selesai.',outcome:r.scrollOutcome};log(s,`${current(s).name}: ${s.lastEvent.title}.`);s.scroll=null;s.phase='end';}
function upgrade(s,data,id,level=s.estates[id].level+1){s.treasureCheck=true;const e=s.estates[id];current(s).chakra-=upgradeCost(s,data,id,level);e.hp+=level-e.level;e.level=level;log(s,`${current(s).name}: penghalang petak ${id+1} naik ke Lv.${e.level}.`);}
export function endTurn(s,data){if(s.phase!=='end')return false;B.checkScrollDebt(s);B.refreshRanks(s);if(data){const result=B.victory(s,data,'turn-end'),limit=B.victory(s,data,'round-end');if(result.won||limit.won){s.winner=result.won?(result.winner??s.turn):sourceResultRanking(B.toRules(s,data)).order[0];s.phase='won';return true;}}s.jutsuUsed=false;s.cardUsed=false;delete s.upgradeMode;s.warpAlreadyUsed=false;s.suppressLanding=false;s.turn=(s.turn+1)%s.players.length;if(s.turn===0)s.round++;s.phase='roll';s.lastEvent=null;s.selectedTile=null;B.checkScrollDebt(s);return true;}
const chakra=(p,delta)=>{p.chakra=Math.max(-9999,Math.min(99999,p.chakra+delta));};
function resumeMovement(s){s.pendingCard=null;s.phase=s.remaining?'move':'land';}
export function cardDescription(card){
 const {type,value}=card;
 if(type===0)return `${value>0?'+':''}${value} chakra`;
 if(type===1)return `${value} chakra × total level penghalang`;
 if(type===3)return `Bayar ${-value} chakra ke setiap lawan`;
 if(type===4)return `+${value} poin ninjutsu`;
 if(type===5)return `Tentukan ${value} langkah berikutnya`;
 if(type===7)return `Lewati ${value} giliran lawan`;
 if(type===13)return 'Roulette 1–3 selama 2 giliran';
 if(type===14)return 'Roulette 4–6 selama 2 giliran';
 if(type===15)return 'Roulette 10–12 selama 2 giliran';
 if(type===6)return ({0:'Kumpulkan kristal dan kembali ke gerbang',1:'Pindah ke kristal pilihan',2:'Pindah ke persimpangan pilihan',4:'Pindah ke pemain pilihan',5:'Panggil pemain lain ke petakmu'})[value];
 return `Kartu ${card.id+1} · disimpan untuk pertempuran atau pertemuan`;
}
export function chanceChoices(s,data){return s.decks[0].slice(0,3).map(id=>data.cards[id]);}
export function chooseChance(s,data,index){
 if(s.phase!=='chance'||!Number.isInteger(index)||index<0||index>=Math.min(3,s.decks[0].length))return false;
 const result=R.drawChanceCard(s.decks[0],index,data.cards,s.seed);s.decks[0]=result.deck;s.seed=result.state;
 const card=data.cards[result.card],p=current(s);s.pendingCard=card.id;
 s.lastEvent={kind:'card',title:`Kartu ${card.id+1}`,text:cardDescription(card),cardId:card.id};log(s,`${p.name}: ${cardDescription(card)}.`);
 if(!card.immediate){
  const added=R.addInventoryCard(p.inventory,card.id);
  if(!added.added){s.phase='discard';return true;}
  p.inventory=added.inventory;resumeMovement(s);return true;
 }
 const effect=R.chanceEffect(card,{player:s.turn,tiles:ruleTiles(s,data),playerCount:s.players.length,state:s.seed});s.seed=effect.state;
 if(effect.kind==='chakra')chakra(p,effect.delta);
 else if(effect.kind==='allPlayerTransfer')effect.deltas.forEach((delta,i)=>chakra(s.players[i],delta));
 else if(effect.kind==='transfer'){chakra(p,effect.delta);chakra(s.players[effect.target],effect.targetDelta);}
 else if(effect.kind==='skillPoints')p.skill=Math.max(0,Math.min(8,p.skill+effect.delta));
 else if(effect.kind==='teleport'){
  if(card.value===0){p.crystals=board(s,data).tiles.filter(t=>t.type==='crystal').map(t=>t.id);p.protection=0;return warp(s,data,0);}
  if(card.value===5){for(const other of s.players)if(other!==p&&!(other.protection&1)){other.pos=p.pos;other.prev=-1;other.direction=255;other.facing=255;}s.remaining=0;s.phase='end';s.pendingCard=null;return true;}
  s.phase='cardTarget';s.cardOrigin='chance';return true;
 }
 resumeMovement(s);return true;
}
function returnToDeck(s,id){const returned=R.returnCard(s.decks[0],id,s.seed);s.decks[0]=returned.deck;s.seed=returned.state;}
export function discardCard(s,data,slot){
 if(s.phase!=='discard'||!Number.isInteger(slot)||slot<0||slot>3)return false;
 if(slot===3)returnToDeck(s,s.pendingCard);
 else {returnToDeck(s,current(s).inventory[slot]);current(s).inventory.splice(slot,1);current(s).inventory.push(s.pendingCard);}
 resumeMovement(s);return true;
}
export function usableCards(s,data){return s.cardUsed?[]:current(s).inventory.flatMap((id,slot)=>id<52&&R.canUseCard(data.cards[id],2)?[{...data.cards[id],slot}]:[]);}
export function useCard(s,data,slot){
 if(s.phase!=='roll'||!usableCards(s,data).some(c=>c.slot===slot))return false;
 s.pendingCard=current(s).inventory[slot];s.cardSlot=slot;s.cardOrigin='inventory';s.phase='cardTarget';return true;
}
export function cardTargets(s,data){
 if(s.phase!=='cardTarget')return [];const c=data.cards[s.pendingCard];
 if(c.type===6&&(c.value===1||c.value===2))return board(s,data).tiles.filter(t=>t.type===(c.value===1?'crystal':'junction')).map(t=>({id:t.id,kind:'tile',label:`Petak ${t.id+1}`}));
 return s.players.flatMap((p,i)=>(c.type===7||c.type===6)&&i===s.turn?[]:(p.protection&1)&&i!==s.turn?[]:[{id:i,kind:'player',label:p.name}]);
}
export function chooseCardTarget(s,data,target){
 if(!cardTargets(s,data).some(t=>t.id===target))return false;
 const c=data.cards[s.pendingCard];
 if(c.type===6){if(s.cardOrigin==='inventory'){returnToDeck(s,c.id);current(s).inventory.splice(s.cardSlot,1);current(s).inventory.push(255);s.cardUsed=true;}return warp(s,data,c.value===4?s.players[target].pos:target);}
 const p=s.players[target];
 if(c.type===5)p.forcedRoll=c.value;
 else if(c.type===7)p.skipTurns=c.value;
 else if(c.type===13)p.rouletteStatus=0x10|c.value;
 else if(c.type===14)p.rouletteStatus=0x20|c.value;
 else if(c.type===15)p.rouletteStatus=0x32;
 else return false;
 returnToDeck(s,c.id);current(s).inventory.splice(s.cardSlot,1);current(s).inventory.push(255);s.pendingCard=null;s.cardUsed=true;s.phase='roll';
 log(s,`${current(s).name} memakai kartu ${c.id+1}: ${p.name}.`);return true;
}
function warp(s,data,tile){current(s).protection=0;current(s).pos=tile;current(s).prev=-1;current(s).direction=255;current(s).facing=255;current(s).actorStatus=0;s.remaining=0;s.pendingCard=null;return enterTile(s,data);}
export function cancelCard(s){if(s.phase!=='cardTarget'||s.cardOrigin!=='inventory')return false;s.pendingCard=null;s.phase='roll';return true;}
export function aiPath(s,data){
 if(s.mapId===0&&s.modeFlags===0&&paths(s,data).length>1){try{const r=story1CpuInitialRoute(B.toRules(s,data),s.turn,{remaining:s.remaining});s.seed=r.rngState;return r.next;}catch(error){if(error.code!=='UNKNOWN_ROUTE_RAM')throw error;
  // Original out-of-bounds tile255 RAM is unavailable. Keep a legal turn
  // using the least geometric distance among possible native winners and
  // record the fidelity gap; never invent a RAM value or hang the UI.
  s.unresolved??=[];if(!s.unresolved.includes(error.message))s.unresolved.push(error.message);
  const candidates=[...new Set(error.possibleWinners)].map(i=>error.routes[i]);return candidates.reduce((a,b)=>b.distance<a.distance?b:a).next;
 }}
 const p=current(s),tiles=board(s,data).tiles,options=paths(s,data);const targets=tiles.filter(t=>t.type==='crystal'&&!p.crystals.includes(t.id)).map(t=>t.id);if(!targets.length)targets.push(0);
 const distance=start=>{const queue=[[start,0]],seen=new Set([p.pos,start]);while(queue.length){const [i,d]=queue.shift();if(targets.includes(i))return d;for(const n of tiles[i].neighbors)if(!seen.has(n)){seen.add(n);queue.push([n,d+1]);}}return 999;};
 return options.reduce((a,b)=>distance(b)<distance(a)?b:a,options[0]);
}
export function aiParameters(s,data,who=s.turn){return AI.characterCpuParameters(data.boardAi,s.players[who].id);}
export function aiPreRoll(s,data){
 if(s.phase!=='roll')return null;B.checkScrollDebt(s);B.refreshRanks(s);const r=B.toRules(s,data),p=current(s);r.players.forEach((q,i)=>q.forcedMove=s.players[i].forcedRoll);
 const available=B.jutsuChoices(s,data),slots=Array.from({length:4},(_,i)=>available.find(j=>j.id===p.ninjutsu[i]&&j.available)?p.ninjutsu[i]:255);
 try{const result=PreRoll.cpuPreRoll(r,s.turn,{params:PreRoll.preRollCpuParameters(data.boardAi,p.id),cards:data.cards,availableJutsu:slots,jutsuPriorityTable:data.boardAi.jutsuPriorities,relationships:s.relationships?.[s.turn]??[0,0,0,0],crystalCount:board(s,data).tiles.filter(t=>t.type==='crystal').length,enabledPowerIds:scrollChoices(s,data).filter(x=>x.enabled).map(x=>x.id),jutsuUsed:!!s.jutsuUsed,cardUsed:!!s.cardUsed,policyState:s.cpuPreRoll,direction255TileByte:s.mapId===0?0:undefined});s.seed=result.rngState;s.cpuPreRoll=result.policyState;
  if(result.kind==='jutsu')B.useJutsu(s,data,result.payload.jutsuId,result.payload.target);
  else if(result.kind==='card'){if(useCard(s,data,result.payload.cardSlot))chooseCardTarget(s,data,result.payload.target);}
  else if(result.kind==='scroll-power'){if(useScroll(s,data,result.payload.powerId)&&s.phase==='scrollTarget')chooseScrollTarget(s,data,result.payload.target);}
  return result.kind;
 }catch(error){s.unresolved??=[];if(!s.unresolved.includes(error.message))s.unresolved.push(error.message);s.cpuPreRoll={};return 'roll';}
}
export function startCpuRoll(s,data){
 if(s.phase!=='roll')return false;if(s.wheel)return true;const p=current(s);if(p.skipTurns||p.forcedRoll)return startRoll(s);
 const faces=p.playerStatus&32?possessionRecoveryFaces({...p,status:p.playerStatus}).faces:R.rouletteForStatus(s.rouletteSlots??s.roulette,p.rouletteStatus,p.playerStatus??0);
 if(p.playerStatus&32){const r=Scroll.cpuScrollRouletteTarget(faces,s.seed);s.seed=r.rngState;s.nextRollTarget=r.target;}
 else if(s.mapId===0){const params=aiParameters(s,data),r=CpuWheel.cpuBoardRouletteTarget(B.toRules(s,data),s.turn,{faces,reserveByte:params.reserveByte,crystalCount:board(s,data).tiles.filter(t=>t.type==='crystal').length,skillByte:CpuWheel.movementRouletteSkill(data.boardAi,p.id)});s.seed=r.rngState;s.nextRollTarget=r.targetValue;}
 else{const r=Scroll.cpuScrollRouletteTarget(faces,s.seed);s.seed=r.rngState;s.nextRollTarget=r.target;}
 return startRoll(s);
}
export function attackEligibility(s,data){const p=current(s),attacks=data.techniques[p.id].attacks;return StoryCPU.enemyBarrierAttackEligibility(p,{techniqueCosts:attacks.map(t=>t.cost),hasFifthTechnique:attacks.some(t=>t.flags&0x20)});}
export function aiAction(s,data){
 const p=current(s),as=actions(s,data),available=as.filter(a=>!a.disabled).map(a=>a.id),r=B.toRules(s,data),params=aiParameters(s,data);
 if(available.includes('claim')||available.includes('selectUpgrade')){const pick=AI.cpuPurchaseOrRemoteUpgrade(r,s.turn,{reserveByte:params.reserveByte,candidateTiles:owned(s).filter(i=>canUpgrade(s,data,i))});if(pick.choice===0){s.aiUpgradeTile=pick.upgradeTile;delete s.aiUpgradeLevel;return available.includes('claim')?'claim':'selectUpgrade';}return 'end';}
 if(available.includes('upgrade')){const pick=AI.cpuOwnedBarrierAction(r,s.turn,{reserveByte:params.reserveByte,menuActions:[0,6,255,255,255,255,255,255],decisionByte:p.cpuDecision??0});s.seed=pick.rngState;p.cpuDecision=pick.decisionByte;s.aiUpgradeTile=p.pos;s.aiUpgradeLevel=s.estates[p.pos].level+pick.upgradeIndex+1;return pick.action===0?'upgrade':'end';}
 if(available.includes('pay')){if(!available.includes('attack'))return 'pay';const r=StoryCPU.cpuEnemyBarrierChoice(B.toRules(s,data),s.turn,{relationship:s.relationships?.[s.turn]?.[s.estates[p.pos].owner]??0,reserveByte:params.reserveByte,techniqueCosts:data.techniques[p.id].attacks.map(t=>t.cost),hasFifthTechnique:data.techniques[p.id].attacks.some(t=>t.flags&0x20)});s.seed=r.rngState;return r.action;}
 return 'end';
}
export function aiChance(s,data){const params=aiParameters(s,data),r=AI.cpuChanceChoice(B.toRules(s,data),s.turn,{cards:s.decks[0].slice(0,3),priority:params.cardPriority,priorityTable:data.boardAi.cardPriorities,crystalTileIds:board(s,data).tiles.filter(t=>t.type==='crystal').map(t=>t.id)});s.seed=r.rngState;return r.slot;}
export function aiDiscard(s,data){const params=aiParameters(s,data),r=AI.cpuDiscardChoice({cards:[...current(s).inventory,s.pendingCard],priority:params.discardPriority,priorityTable:data.boardAi.discardPriorities,rngState:s.seed});s.seed=r.rngState;return r.slot;}
export function aiUpgrade(s,data){const tile=s.selectedTile??s.aiUpgradeTile;if(Number.isInteger(s.aiUpgradeLevel)&&canUpgrade(s,data,tile,s.aiUpgradeLevel))return {tile,level:s.aiUpgradeLevel};if(canUpgrade(s,data,tile))return {tile,level:s.estates[tile].level+1};return null;}

export function validSave(s,data){
 try{
  const phases=['roll','move','chance','cardTarget','discard','land','bonusUpgrade','upgrade','forcedSale','scrollTarget','scrollRoll','attackCard','defenseCard','attack','defend','attackRoll','defenseRoll','end','won'];
  const integer=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
  if(!s||s.version!==VERSION||!integer(s.mapId,0,15)||!data.maps[s.mapId]||!phases.includes(s.phase)||!Array.isArray(s.players)||(s.players.length<2||s.players.length>4)||!integer(s.turn,0,s.players.length-1))return false;
  const n=data.maps[s.mapId].tiles.length;
  if(!s.players.every(p=>p&&integer(p.id,0,data.characters.length-1)&&typeof p.name==='string'&&typeof p.human==='boolean'&&integer(p.pos,0,n-1)&&integer(p.prev,-1,n-1)&&integer(p.chakra,-9999,99999)&&integer(p.skill,0,8)&&integer(p.laps,0,65535)&&Array.isArray(p.crystals)&&p.crystals.every(i=>integer(i,0,n-1)&&data.maps[s.mapId].tiles[i].type==='crystal')&&Array.isArray(p.inventory)&&p.inventory.length===3&&p.inventory.every(id=>integer(id,0,51)||id===255)&&integer(p.forcedRoll,0,12)&&integer(p.skipTurns,0,255)&&integer(p.rouletteStatus,0,255)&&integer(p.protection,0,255)))return false;
  if(!Array.isArray(s.estates)||s.estates.length!==n||!s.estates.every(e=>e===null||(integer(e.owner,0,s.players.length-1)&&integer(e.level,1,5)&&integer(e.hp,1,e.level+1)&&integer(e.repairCounter??0,0,1))))return false;
  if(!Array.isArray(s.decks)||s.decks.length!==2||!s.decks.every(d=>Array.isArray(d)&&d.length>=2&&d.length<=64&&d.every(id=>integer(id,0,51))))return false;
  if(['cardTarget','discard'].includes(s.phase)&&!integer(s.pendingCard,0,51))return false;
  if(s.phase==='cardTarget'&&!['chance','inventory'].includes(s.cardOrigin))return false;
  if(['scrollTarget','scrollRoll'].includes(s.phase)&&(!s.scroll||!s.scrollAction||!integer(s.scroll.power,1,3)||s.scroll.actor!==s.turn||s.scrollAction.actor!==s.turn))return false;
  if(s.phase==='scrollRoll'&&(!s.scroll.wheel||!Array.isArray(s.scroll.wheel.faces)||s.scroll.wheel.faces.length!==12))return false;
  if(['attackCard','defenseCard','attack','defend','attackRoll','defenseRoll'].includes(s.phase)){
   const b=s.battle;if(!b||!integer(b.defender,0,s.players.length-1)||b.defender===s.turn||!integer(b.tile,0,n-1)||s.estates[b.tile]?.owner!==b.defender)return false;
   if(['defend','attackRoll','defenseRoll'].includes(s.phase)&&(!integer(b.attackIndex,0,3)||!b.attackTechnique))return false;
   if(['attackRoll','defenseRoll'].includes(s.phase)&&(!b.defenseTechnique||!Array.isArray(b.faces)||b.faces.length!==12||!b.faces.every(x=>integer(x,0,99))))return false;
  }
  return (s.phase==='won')===(s.winner!==null)&&(s.winner===null||integer(s.winner,0,s.players.length-1))&&Array.isArray(s.roulette)&&s.roulette.length===12&&s.roulette.every(x=>integer(x,1,12))&&integer(s.remaining,0,12)&&integer(s.target,1,99999)&&integer(s.baseBonus,0,99999)&&integer(s.seed,0,0xffffffff)&&integer(s.round,1,1000000)&&Array.isArray(s.log)&&s.log.every(x=>typeof x==='string');
 }catch{return false;}
}

export function battleSide(s){return ['defenseCard','defend','defenseRoll'].includes(s.phase)?1:0;}
export function battlePlayer(s){return battleSide(s)?s.players[s.battle.defender]:current(s);}
export function combatCards(s,data){const side=battleSide(s);return battlePlayer(s).inventory.flatMap((id,slot)=>id<52&&R.canUseCard(data.cards[id],side?5:4)?[{...data.cards[id],slot}]:[]);}
export function selectCombatCard(s,data,slot){if(['attackCard','defenseCard'].includes(s.phase)){if(!(slot===-1||combatCards(s,data).some(c=>c.slot===slot)))return false;commitCombatCard(s,data,battleSide(s),slot);s.battle.nextCardSide++;advanceCombatCards(s,data);return true;}if(s.battle.cardsLocked||!['attack','defend'].includes(s.phase)||!(slot===-1||combatCards(s,data).some(c=>c.slot===slot)))return false;if(s.phase==='attack'&&s.battle.forceHalfCostCard&&current(s).inventory[slot]!==22)return false;s.battle[battleSide(s)?'defenseCardSlot':'attackCardSlot']=slot;return true;}
function commitCombatCard(s,data,side,slot){const p=side?s.players[s.battle.defender]:current(s);s.battle[side?'defenseCardSlot':'attackCardSlot']=slot;s.battle[side?'defenseCard':'attackCard']=slot<0?null:p.inventory[slot];if(slot>=0){returnToDeck(s,p.inventory[slot]);p.inventory.splice(slot,1);p.inventory.push(255);}}
function advanceCombatCards(s,data){const b=s.battle;for(;b.nextCardSide<2;b.nextCardSide++){const side=b.nextCardSide,p=side?s.players[b.defender]:current(s);s.phase=side?'defenseCard':'attackCard';const cards=combatCards(s,data);if(!cards.length){commitCombatCard(s,data,side,-1);continue;}if(side===0&&b.forceHalfCostCard){commitCombatCard(s,data,side,p.inventory.indexOf(22));continue;}if(p.human)return;const r=cpuCombatCard({inventory:p.inventory,cards:data.cards,side,rngState:s.seed});s.seed=r.rngState;commitCombatCard(s,data,side,r.valid?r.slot:-1);}b.cardsLocked=true;s.phase='attack';}
export function techniqueChoices(s,data){
 const side=battleSide(s),p=battlePlayer(s),other=side?current(s):s.players[s.battle.defender],slot=s.battle[side?'defenseCardSlot':'attackCardSlot'];
 return C.combatChoices(data.techniques[p.id],side,other.id,p.chakra,data.cards[s.battle.cardsLocked?s.battle[side?'defenseCard':'attackCard']:p.inventory[slot]]);
}
export function graphDistance(s,data,from,to){
 const queue=[[from,0]],seen=new Set([from]);while(queue.length){const [i,d]=queue.shift();if(i===to)return d;for(const n of board(s,data).tiles[i].neighbors)if(!seen.has(n)){seen.add(n);queue.push([n,d+1]);}}return 12;
}
export function chooseTechnique(s,data,index){
 if(!['attack','defend'].includes(s.phase))return false;
 const t=techniqueChoices(s,data).find(t=>t.index===index&&!t.disabled);if(!t)return false;
 const side=battleSide(s),p=battlePlayer(s),slot=s.battle[side?'defenseCardSlot':'attackCardSlot'];
 if(!s.battle.cardsLocked&&Number.isInteger(slot)&&slot>=0){returnToDeck(s,p.inventory[slot]);p.inventory.splice(slot,1);p.inventory.push(255);}
 if(s.phase==='attack'){s.battle.attackIndex=index;s.battle.attackTechnique=t;s.phase='defend';return true;}
 s.battle.defenseEligibilityWord=index===techniqueChoices(s,data).length-1?-1:t.id;s.battle.defenseIndex=index;s.battle.defenseTechnique=t;beginBattleRoulette(s,data,0);return true;
}
function beginBattleRoulette(s,data,side){
 // Map0's two directed routes are fully recovered; other maps retain BFS.
 const from=s.players[s.battle.defender].pos,to=s.battle.tile;
 const distance=side?(s.mapId===0?story1DefenderRoute(board(s,data).tiles,from,to).distance:graphDistance(s,data,from,to)):0;
 const r=C.combatRoulette(s.battle[side?'defenseTechnique':'attackTechnique'],side,distance,data.combat,s.seed);
 s.battle.wheel=W.startBoardRoulette(r.faces,r.state);s.seed=s.battle.wheel.rngState;s.battle.faces=s.battle.wheel.faces;s.battle.cpuStopChosen=false;s.phase=side?'defenseRoll':'attackRoll';
}
export function battleRollFace(s){return s.battle.wheel?W.rouletteValue(s.battle.wheel):s.battle.faces[0];}
export function requestBattleStop(s){if(!['attackRoll','defenseRoll'].includes(s.phase)||s.battle.wheel?.phase!==2)return false;s.battle.wheel=W.stopBoardRoulette(s.battle.wheel);s.seed=s.battle.wheel.rngState;return true;}
export function prepareCpuBattleStop(s,data){if(!['attackRoll','defenseRoll'].includes(s.phase))return;if(!s.battle.wheel){s.battle.wheel=W.startBoardRoulette(s.battle.faces,s.seed);s.seed=s.battle.wheel.rngState;s.battle.faces=s.battle.wheel.faces;s.battle.cpuStopChosen=false;}if(s.battle.cpuStopChosen)return;const r=C.cpuCombatStop(s.battle.faces,data.combat.aiSkillByCharacter[battlePlayer(s).id],s.seed);s.seed=r.state;s.battle.wheel={...s.battle.wheel,targetValue:r.value,rngState:r.state};s.battle.cpuStopChosen=true;}
export function stepBattleRoll(s,data,ticks=1){if(!['attackRoll','defenseRoll'].includes(s.phase))return false;if(!s.battle.wheel){s.battle.wheel=W.startBoardRoulette(s.battle.faces,s.seed);s.seed=s.battle.wheel.rngState;s.battle.faces=s.battle.wheel.faces;}s.battle.wheel=W.advanceBoardRoulette(s.battle.wheel,ticks);s.seed=s.battle.wheel.rngState;if(s.battle.wheel.phase===6)stopBattleRoulette(s,data,s.battle.faces.indexOf(W.rouletteValue(s.battle.wheel)));return true;}
export function stopBattleRoulette(s,data,index){
 if(!['attackRoll','defenseRoll'].includes(s.phase)||!Number.isInteger(index)||index<0||index>11)return false;
 const side=battleSide(s),value=s.battle.faces[index];
 delete s.battle.wheel;
 if(side===0){s.battle.attackRoll=value;beginBattleRoulette(s,data,1);return true;}
 s.battle.defenseRoll=value;finishBattle(s,data);return true;
}
export function stopCpuBattleRoulette(s,data){
 if(!['attackRoll','defenseRoll'].includes(s.phase))return false;
 // Original character AI skill, main80016a60 / initializer80012eac.
 const r=C.cpuCombatStop(s.battle.faces,data.combat.aiSkillByCharacter[battlePlayer(s).id],s.seed);s.seed=r.state;
 return stopBattleRoulette(s,data,s.battle.faces.indexOf(r.value));
}
function finishBattle(s,data){
 const p=current(s),op=s.players[s.battle.defender],e=s.estates[s.battle.tile],b=s.battle;
 const r=C.resolveCombat({attack:b.attackTechnique,defense:b.defenseTechnique,attackRoll:b.attackRoll,defenseRoll:b.defenseRoll,hp:b.battleHp??e.hp,attackerChakra:p.chakra,defenderChakra:op.chakra});
 p.chakra=r.attackerChakra;op.chakra=r.defenderChakra;e.hp=r.hp;
 if(r.captured&&b.specialBarrier){s.estates[b.tile]=null;s.tileTypes[b.tile]=7;const result=B.victory(s,data,'barrier-destroyed');s.lastEvent={kind:'barrier',title:'Penghalang pertahanan hancur',text:`Petak ${b.tile+1}`};if(result.won){s.winner=s.turn;s.phase='won';}else s.phase='end';return;}
 if(r.captured){e.owner=s.turn;e.hp=e.level+1;e.repairCounter=0;B.captureRecorded(s,data,b.defender);const eligibility=b.defenseEligibilityWord??(b.defenseIndex===data.techniques[op.id].defenses.length-1?-1:b.defenseTechnique.id);b.scrollResult=B.resolveCapturedScroll(s,data,{defenderHp:r.hp,battleEligibilityWord:eligibility});}else{e.hp=Math.min(e.level+1,e.hp);const toll=B.payToll(s,data);log(s,`${p.name} membayar ${toll} chakra karena serangan gagal merebut wilayah.`);}
 B.refreshRanks(s);s.lastEvent={kind:'battle',scrollResult:b.scrollResult??'none',title:r.captured?'Wilayah direbut!':r.counter?'Teknik ditangkal!':r.damage?'Penghalang melemah':'Serangan tertahan',text:r.captured?`${p.name} merebut wilayah ${op.name}.`:`Durabilitas tersisa: ${e.hp}`,attack:r.attackTotal,defense:r.defenseTotal,a:b.attackRoll,d:b.defenseRoll,power:b.attackTechnique.power,damage:r.damage,captured:r.captured,counter:r.counter};
 log(s,`${p.name} menyerang ${op.name}: ${r.attackTotal} vs ${r.defenseTotal}. ${r.captured?'Wilayah direbut.':`Kerusakan ${r.damage}.`}`);s.phase='end';if(!r.captured)beginForcedSale(s,data);
}
export function aiTechnique(s,data){
 prepareCpuCombatCard(s,data);
 const side=battleSide(s),who=side?s.battle.defender:s.turn,p=s.players[who],choices=techniqueChoices(s,data),params=aiParameters(s,data,who),techniques=choices.map(t=>({costs:[t.cost,t.alternateCost??t.cost],powers:[t.power,t.alternatePower??t.power],flags:t.flags}));
 try{
  const defenderChoice=side?AI.cpuDefenderChoice(B.toRules(s,data),who,s.battle.tile,{previousChoice:s.cpuDefenderChoice??0}):undefined;
  if(side)s.cpuDefenderChoice=defenderChoice.choice??defenderChoice;
  const order=AI.cpuCombatOrder({side,techniques,defenderChoice:side?s.cpuDefenderChoice:undefined,rngState:s.seed});s.seed=order.rngState;
  const mask=choices.reduce((bits,t,i)=>bits|(t.disabled?0:side&&i===choices.length-1?8:[2,4,1,8][i]),0);
  const result=AI.cpuCombatChoice({side,order:order.order,aiSkill:params.combatChoiceSkill,selectionRanks:data.boardAi.combatSelectionRanks,availabilityMask:mask,combatFlags:side&&data.cards[s.battle.cardsLocked?s.battle.defenseCard:p.inventory[s.battle.defenseCardSlot]]?.type===10?4:0,rngState:s.seed});s.seed=result.rngState;return choices[result.index].index;
 }catch(error){s.unresolved??=[];if(!s.unresolved.includes(error.message))s.unresolved.push(error.message);return choices.find(t=>!t.disabled)?.index??0;}
}
export function prepareCpuCombatCard(s,data){if(s.battle.cardsLocked||!['attack','defend'].includes(s.phase)||battlePlayer(s).human)return;const side=battleSide(s);s.battle.cpuCardsChosen??=[false,false];if(s.battle.cpuCardsChosen[side])return;const r=cpuCombatCard({inventory:battlePlayer(s).inventory,cards:data.cards,side,rngState:s.seed,mandatoryHalfCost:side===0&&s.battle.forceHalfCostCard});s.seed=r.rngState;s.battle.cpuCardsChosen[side]=true;if(r.valid)s.battle[side?'defenseCardSlot':'attackCardSlot']=r.slot;}
