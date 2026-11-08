/** Source-derived logical board effects. Raw offsets and limits: board-effects.md.
 * State: {players,tiles,modeFlags,rngState}; fresh objects are returned.
 * Player: {position,skillPoints,flags,status,actorStatus,direction,facing,inventory}.
 * flags=+0xa, status=+0xc, actorStatus=+0xd; do not merge these bitfields.
 * Tile: {typeCode,owner,effect,hp,level,effectOwnerByte,repairCounter,...}.
 * level is human1..5, while original packedlevel is0..4.
 */
import {ps1Random, barrierRent, barrierChains, shouldAwardScroll, sourceVictory, sourceBonus} from './faithful-rules.mjs';

export const BOARD_JUTSU = Object.freeze([
  {id:0,effect:1,kind:'defense-hp',value:1,requiresOwned:true},
  {id:1,effect:2,kind:'random-warp'},
  {id:2,effect:3,kind:'reverse-direction'},
  {id:3,effect:4,kind:'suppress-enemy-landing-actions',requiresBarrier:true},
  {id:4,effect:5,kind:'double-toll',requiresOwned:true},
  {id:5,effect:6,kind:'defense-hp',value:2,requiresOwned:true},
  {id:6,kind:'unavailable',available:false},
  {id:7,effect:8,kind:'possession'},
  {id:8,effect:9,kind:'skip-next-turn'},
  {id:9,effect:10,kind:'force-stop'},
  {id:10,kind:'barrier-damage',value:1},
  {id:11,kind:'barrier-damage',value:1},
  {id:12,kind:'barrier-damage',value:3},
  {id:13,kind:'barrier-damage',value:2},
].map(Object.freeze));
const signed16 = n => n << 16 >> 16;
const copy = s => ({...s, players:s.players.map(p=>({...p,inventory:p.inventory?.slice()})),
  tiles:s.tiles.map(t=>({...t})), events:[]});

export function boardJutsuTargets(state, actor, id) {
  const p=state.players[actor], def=BOARD_JUTSU[id];
  if (!p || !def || def.available === false) return [];
  if (id < 10) {
    const t=state.tiles[p.position];
    if (!t || t.typeCode === 0 || (t.effect ?? 0) !== 0 ||
      (def.requiresOwned && t.owner !== actor) || (def.requiresBarrier && t.typeCode !== 5)) return [];
    return [p.position];
  }
  return state.tiles.flatMap((t,i)=> {
    const eligible=(t.typeCode === 5 && t.owner !== actor) ||
      (t.typeCode === 8 && !!(p.flags & 0x100));
    if (!eligible) return [];
    if (state.modeFlags & 0x1000) {
      if (!state.players[t.owner]) throw new Error('Original team target owner is outside player records');
      if (p.team === state.players[t.owner].team) return [];
    }
    return [i];
  });
}

export function boardJutsuAvailability(state, actor, id, costs) {
  const p=state.players[actor], def=BOARD_JUTSU[id];
  if (!p || !def || id === 6 || !(p.boardJutsu ?? []).includes(id))
    return {available:false,reason:'not-in-loadout-or-hidden',targets:[]};
  // Original sign-extends16 then performs unsigned comparison against cost.
  if ((signed16(p.skillPoints) >>> 0) < costs[id])
    return {available:false,reason:'insufficient-skill-points',targets:[]};
  const targets=boardJutsuTargets(state,actor,id);
  return {available:targets.length>0,reason:targets.length?'ready':'no-valid-target',targets};
}

/** Apply at original animation commit, after valid selection. Casting is one
 * menu action; caller must enforce its per-turn action flag. */
export function castBoardJutsu(state, actor, id, costs, target) {
  const check=boardJutsuAvailability(state,actor,id,costs);
  if (!check.available) throw new Error(check.reason);
  target ??= check.targets.length === 1 ? check.targets[0] : undefined;
  if (!check.targets.includes(target)) throw new RangeError('Choose a valid jutsu target');
  const s=copy(state), p=s.players[actor], t=s.tiles[target], def=BOARD_JUTSU[id];
  p.skillPoints=signed16(p.skillPoints-costs[id]);
  s.events.push({type:'jutsu-used',actor,id,target,cost:costs[id]});
  if (id < 10) {
    t.effect=def.effect;
    if ([1,2,3,7,8,9].includes(id)) t.effectOwnerByte=actor<<4;
  } else {
    const remaining=t.hp-def.value;
    if (remaining > 0) t.hp=remaining;
    else if (t.typeCode === 8) t.typeCode=7;
    else { t.typeCode=4; t.owner=15; t.level=1; t.hp=2; t.effect=0; }
    s.events.push({type:'barrier-damaged',target,damage:def.value,destroyed:remaining<=0,
      recalculateChains:true});
  }
  return s;
}

/** Board movement's arrived-step hook: effect10 forces remaining movement0 even
 * on passage. Other effects activate only after remaining movement reaches0. */
export function boardEffectOnStep(state, actor, remaining, {warpAlreadyUsed=false}={}) {
  let s=copy(state), p=s.players[actor], t=s.tiles[p.position];
  const effect=t.effect ?? 0;
  if (effect === 10 && t.typeCode !== 6) remaining=0;
  if (remaining !== 0 || ![2,3,4,8,9,10].includes(effect))
    return {...s,remaining,warpAlreadyUsed};
  if (effect === 2) {
    if (warpAlreadyUsed) return {...s,remaining,warpAlreadyUsed};
    //800f32b4 and800c4388 reject connector tiles and currenttile, with repeated draws.
    const old=p.position, eligible=s.tiles.some((x,i)=>i!==old && x.typeCode!==6);
    if (!eligible) throw new Error('Original random-warp rejection loop has no valid destination');
    let next;
    do { const r=ps1Random(s.rngState);s.rngState=r.state;next=r.value%s.tiles.length; }
    while (next===old || s.tiles[next].typeCode===6);
    t.effect=0; p.direction=255; p.facing=255; p.position=next;
    warpAlreadyUsed=true;
    s.events.push({type:'warp',actor,from:old,to:next,triggerDestination:true});
  } else {
    t.effectOwnerByte=0; t.effect=0;
    switch(effect) {
      case 3:
        if (p.direction !== 255) {
          p.direction^=1;
          if (t.typeCode === 3) p.actorStatus=(p.actorStatus??0)|2;
          p.facing=({1:2,2:1,4:8,8:4})[p.facing] ?? p.facing;
        }
        s.events.push({type:'reverse-direction',actor}); break;
      case 4:
        s.events.push({type:'landing-actions-suppressed',actor,suppressed:t.owner!==actor,
          continueTollProcessing:true}); break;
      case 8:
        p.status=(p.status??0)|0x20; p.possessionAttempts=0;
        s.events.push({type:'possession',actor}); break;
      case 9:
        p.skipTurns=1; s.events.push({type:'skip-next-turn',actor}); break;
      case 10:
        s.events.push({type:'forced-stop',actor}); break;
    }
  }
  return {...s,remaining,warpAlreadyUsed};
}

/** Battle setup800b94e8: bonuses add temporary battle HP. Effects4/7 clear here
 * on type5; defense bonuses1/6 clear later in800d6e7c, before attack choices. */
export function prepareBarrierDefense(tile) {
  const t={...tile}, bonus=t.effect===1?1:t.effect===6?2:0;
  if (t.typeCode === 5 && [4,7].includes(t.effect)) t.effect=0;
  return {tile:t,battleHp:t.hp+bonus,originalHp:t.hp,bonus};
}
export function consumeBarrierDefenseEffect(tile) {
  return {...tile,effect:[1,6].includes(tile.effect)?0:tile.effect};
}

/** Call only for an actual enemy barrier toll event. Team exclusion belongs to
 * landing dispatch. Effect5 is consumed and doubles the same rent calculation. */
export function boardToll(state, actor, tileId=state.players[actor].position) {
  const s=copy(state), t=s.tiles[tileId];
  if (t.typeCode!==5 || t.owner===actor ||
      ((s.modeFlags&0x1000) && s.players[t.owner]?.team===s.players[actor].team))
    return {...s,amount:0};
  const chains=barrierChains(s.tiles).chains;
  const multiplier=t.effect===5?2:1;
  if (t.effect===5) t.effect=0;
  const displayDelta=signed16(-barrierRent(t,chains[tileId]))*multiplier;
  const pendingDeltas=Array(s.players.length).fill(0);
  pendingDeltas[actor]=signed16(displayDelta);
  pendingDeltas[t.owner]=signed16(Math.abs(displayDelta));
  s.events.push({type:'toll',actor,owner:t.owner,tile:tileId,amount:-displayDelta,multiplier});
  // Original enqueues signed16 changes for its asynchronous money updater.
  return {...s,amount:-displayDelta,pendingDeltas};
}

/** Source possession recovery: each attempted turn gets a1..N roulette,
 * N=max(2,5-attempts); only landing1 removesstatus0x20. No guessed duration. */
export function possessionRecoveryFaces(player) {
  const n=Math.max(2,5-(player.possessionAttempts??0));
  return {faces:Array.from({length:12},(_,i)=>i%n+1),
    player:{...player,possessionAttempts:((player.possessionAttempts??0)+1)&255}};
}
export function finishPossessionRecovery(player,value) {
  return {...player,status:value===1?(player.status??0)&0xdf:player.status??0};
}

/** Called for the skip-turn state, not ordinary turncompletion. */
export function consumeSkippedTurn(player) {
  if (!(player.skipTurns>0)) return {player:{...player},skipped:false};
  return {player:{...player,skipTurns:(player.skipTurns-1)&255},skipped:true};
}

const takeFirstCard=(p,id)=>{
  const slot=p.inventory?.indexOf(id)??-1;
  if(slot<0)return false;
  p.inventory.splice(slot,1);p.inventory.push(255);return true;
};

/** Scroll theft800ba43c. Source step flag92a is required for unprotected success;
 * heldcard20 allows theft while passing. Protectioncard21 is always consumed,
 * and attackcard20 is consumed too if present, including when blocked.
 * Team membership does not block this source path. */
export function attemptScrollTheft(state,actor,{remaining=0,everAwarded=true,
  scriptedTravel=false,arrivedStep=false}={}) {
  const s=copy(state),p=s.players[actor];
  if((p.flags&0x200)||scriptedTravel||!everAwarded||
    (remaining!==0&&!p.inventory?.includes(20)))return {...s,result:'none'};
  const holder=s.players.findIndex((q,i)=>i!==actor && !(q.actorStatus&1) &&
    q.position===p.position && (q.flags&0x200));
  if(holder<0)return {...s,result:'none'};
  const q=s.players[holder];
  if(takeFirstCard(q,21)){
    const attackCardConsumed=takeFirstCard(p,20);
    return {...s,result:'protected',holder,attackCardConsumed,events:[{type:'scroll-protected',actor,holder}]};
  }
  if(!arrivedStep)return {...s,result:'none'};
  const attackCardConsumed=takeFirstCard(p,20);
  q.flags&=0xfdff;q.scrollSeals=0;q.debtTurns=0;
  p.flags|=0x200;p.scrollCounter=0;p.scrollSeals=0;p.debtTurns=0;
  return {...s,result:'stolen',holder,attackCardConsumed,events:[{type:'scroll-stolen',actor,holder}]};
}

export function awardScrollAfterBonus(state,actor,everAwarded=false) {
  const s=copy(state);
  if(!shouldAwardScroll(s.players,actor,everAwarded))return {...s,awarded:false,everAwarded};
  const p=s.players[actor];p.flags|=0x200;p.scrollCounter=0;p.scrollSeals=0;p.debtTurns=0;
  return {...s,awarded:true,everAwarded:true,events:[{type:'scroll-awarded',actor}]};
}

/** Branch-specific scenario checks. Source victory is allowed only at source;
 * other reasons are evaluated at their matching event rather than every tick. */
export function scenarioVictory(state,{event,actor,round=0,lastCharacterId}={}) {
  const f=state.modeFlags??0,r=state.ruleParameters??[],p=state.players[actor];
  if(event==='source-bonus')return sourceVictory({modeFlags:f,chakra:p.chakra,
    targetChakra:state.targetChakra,playerFlags:p.flags,sealCount:p.scrollSeals??0,
    ruleParameters:r,lastCharacterId});
  if(event==='barrier-destroyed' && (f&0x100) && state.tiles.filter(t=>t.typeCode===7).length===r[8])
    return {won:true,reason:0x100,winner:actor};
  if(event==='turn-end' && (f&0x80) && ((state.defeatCounters??0)&15)+((state.defeatCounters??0)>>>4)===r[7])
    return {won:true,reason:0x80,winner:actor};
  if(event==='round-end' && actor===state.players.length-1 && (f&2) && round===r[1])return {won:true,reason:2,winner:255};
  return {won:false,reason:0};
}


/** At successful source bonus commit. Caller supplies original map crystalCount,
 * baseBonus (80012a8c) and skillAward (80012ac0); no guessed defaults.
 * Stops before optional barrier upgrade and scroll award states8..10. */
export function completeSourceBonus(state,actor,{crystalCount,baseBonus,skillAward,
  remaining=0,lastCharacterId}={}) {
  if (![crystalCount,baseBonus,skillAward].every(Number.isInteger))
    throw new TypeError('Original crystalCount/baseBonus/skillAward are required');
  const s=copy(state),p=s.players[actor];
  let crystals=0;for(let bit=12;bit<16;bit++)crystals+=(p.flags>>>bit)&1;
  if(crystals<crystalCount)return {...s,completed:false,bonus:0,victory:{won:false,reason:0}};
  p.flags=(p.flags+1)&65535;
  if(remaining===0){p.direction=255;p.facing=255;}
  if(p.flags&0x200){
    if(p.chakra<0)p.debtTurns=((p.debtTurns??0)+1)&255;
    p.scrollSeals=((p.scrollSeals??0)+1)&255;
  }
  let repairs=0;
  for(const t of s.tiles){
    if(t.typeCode!==5||t.owner!==actor)continue;
    t.repairCounter=((t.repairCounter??0)+1)&255;
    if(t.repairCounter===2){
      repairs++;t.repairCounter=0;
      if(t.hp+1<=t.level+1)t.hp++;
    }
  }
  if(s.modeFlags&0x2000)return {...s,completed:true,bonus:0,repairs,
    victory:{won:true,reason:0,winner:actor}};
  for(let i=0;i<s.players.length;i++){
    if(i===actor||((s.modeFlags&0x1000)&&s.players[i].team===p.team))s.players[i].flags&=0xfff;
  }
  const bonus=sourceBonus(s.tiles,actor,baseBonus);
  p.chakra=Math.min(99999,Math.max(-9999,p.chakra+bonus));
  // Source animation increments/caps one point at a time, including ushort wrap.
  for(let i=0;i<(skillAward&255);i++)p.skillPoints=Math.min(8,(p.skillPoints+1)&65535);
  // 80109fec tests team byte !=0 (not modeFlags); 800171a4 returns first match.
  const persistentTeam=p.persistentTeam??(p.team===255?0:p.team);
  const teammate=persistentTeam?s.players.findIndex((q,i)=>i!==actor&&
    (q.persistentTeam??(q.team===255?0:q.team))===persistentTeam):-1;
  if(teammate>=0)s.players[teammate].chakra=p.chakra;
  const victory=scenarioVictory(s,{event:'source-bonus',actor,lastCharacterId});
  s.events.push({type:'source-bonus',actor,bonus,skillAward,repairs});
  return {...s,completed:true,bonus,repairs,victory};
}

/** Mode0x80 scoreboard: successful player0/1 attacks on player2/3 barriers,
 * plus player0/1 eliminations of player2/3. Call once at that exact source event.
 * Capture counter is skipped when original DAT_8013ea4c !=0. */
export function recordScenarioDefeat(state,{attacker,defender,event,specialBattle=false,tileType}={}) {
  const s=copy(state);
  if(!(s.modeFlags&0x80)||attacker>=2||![2,3].includes(defender)||
    !['barrier-captured','player-eliminated'].includes(event)||
    (event==='barrier-captured'&&(specialBattle||tileType===8)))return s;
  const old=s.defeatCounters??0;
  s.defeatCounters=(defender===2?(old&15)+((old&240)+16):old+1)&255;
  return s;
}

/** Post-battle scroll path. battleEligibilityWord is original defender battle
 * record+0x1a (boardState+0x5ce): selected defense technique ID, or -1 for
 * the final free-defense entry (8011f4d8 ->80019fe8). */
export function resolveBattleScroll(state,{attacker,defender,defenderHp,battleEligibilityWord,
  everAwarded}={}) {
  if(!Number.isInteger(battleEligibilityWord)||typeof everAwarded!=='boolean')
    throw new TypeError('Original battleEligibilityWord and everAwarded are required');
  const s=copy(state),p=s.players[attacker],q=s.players[defender];
  if(defenderHp>0||!(q.flags&0x200)||signed16(battleEligibilityWord)===-1)
    return {...s,result:'none'};
  if(takeFirstCard(q,21))return {...s,result:'protected'};
  q.flags&=0xfdff;q.scrollSeals=0;q.debtTurns=0;
  if(!everAwarded)return {...s,result:'lost'};
  p.flags|=0x200;p.scrollCounter=0;p.scrollSeals=0;p.debtTurns=0;
  return {...s,result:'stolen'};
}

/** Scenario loader80012eac + board800b5790 initial logical fields. Teams come
 * from menu/session data, never from scenario unknownControlBytes. */
export function scenarioInitialPlayers(scenario,{teams}={}) {
  if((scenario.modeFlags&0x1000)&&(!teams||teams.length<scenario.players.length))
    throw new TypeError('Team-mode requires original menu team assignments');
  return scenario.players.map((r,i)=>{
    const cpu=i!==(scenario.mapId===17?1:0)&&!((scenario.modeFlags&0x10)&&i===1);
    return {characterId:r.characterId,position:0,chakra:scenario.initialChakra,
      skillPoints:scenario.initialSkillPoints,boardJutsu:r.techniqueIds.slice(),
      flags:(i<<10)|(cpu?0x100:0),status:0,actorStatus:0,
      team:scenario.modeFlags&0x1000?teams[i]:255,
      persistentTeam:teams?.[i]??0,inventory:[255,255,255],
      direction:scenario.modeFlags&0x6000?0:255,facing:scenario.modeFlags&0x6000?8:255,
      skipTurns:0,possessionAttempts:0,scrollSeals:0,debtTurns:0,scrollCounter:0,
      scenarioControlBytes:r.unknownControlBytes?.slice()};
  });
}

/** Map load800f7adc and800f6ec4 case8. Actor is0 on a fresh load. */
export function initialBoardTiles(tiles,actor=0) {
  return tiles.map(t=>({...t,owner:t.typeCode===8?actor:15,
    hp:t.typeCode===8?4:2,level:t.typeCode===8?3:1,effect:0,repairCounter:0}));
}

const exchangeOrder = scores => {
  const order=scores.map((_,i)=>i),values=scores.slice();
  for(let i=0;i<values.length;i++)for(let j=i+1;j<values.length;j++){
    if(values[i]<values[j]){[values[i],values[j]]=[values[j],values[i]];[order[i],order[j]]=[order[j],order[i]];}
  }
  return {order,scores:values};
};
/**800b7464 intentionally truncates chakra to signed16 before sorting. */
export function sourceBoardRanks(players) {
  const {order}=exchangeOrder(players.map(p=>signed16(p.chakra)));
  return {order,players:players.map((p,i)=>({...p,flags:(p.flags&0xf3ff)|(order.indexOf(i)<<10)}))};
}
/**800e1958 case0 result ranking uses full signed32 scores and inactive penalty.
 * Team mode with forcedWinner255 dereferences an out-of-bounds original record:
 * explicitly require the observed byte rather than guessing a winner. */
export function sourceResultRanking(state,{forcedWinner=255,outOfBoundsWinnerTeam}={}) {
  const scores=state.players.map((p,i)=>i===forcedWinner?0x7fffffff:
    (p.chakra-(p.actorStatus&1?10000:0))|0);
  if(state.modeFlags&0x1000){
    const team=state.players[forcedWinner]?.team??outOfBoundsWinnerTeam;
    if(team===undefined)throw new Error('Original winner255 team byte is outside valid player records');
    state.players.forEach((p,i)=>{if(i!==forcedWinner&&p.team===team)scores[i]=0x7fffffff;});
  }
  const firstOther=state.players.find(p=>p.team!==state.players[0].team);
  const draw=!!(state.modeFlags&0x1000)&&!!firstOther&&firstOther.chakra===state.players[0].chakra;
  return {...exchangeOrder(scores),draw};
}

/**800f2490 landing branch; cost list is ALL character techniques, not4loadout. */
export function type8Landing(state,actor,{remaining=0,techniqueCosts,hasFifthTechnique=false}={}) {
  const p=state.players[actor],t=state.tiles[p.position];
  if(t.typeCode!==8)return {action:'not-type8'};
  if(remaining!==0)return {action:'continue-moving'};
  if(!(p.flags&0x100))return {action:'end-turn'};
  if(!Array.isArray(techniqueCosts))throw new TypeError('All original character technique costs are required');
  const minimum=Math.min(10000,...techniqueCosts);
  const eligible=p.chakra>=minimum||(p.chakra<0&&hasFifthTechnique);
  if(!eligible)return {action:t.owner===actor?'wait':'end-turn',reason:'no-affordable-attack'};
  return {action:'attack',attacker:actor,defender:0,tile:p.position,
    attackingDistance:0,defendingDistanceRequired:true,hp:prepareBarrierDefense(t).battleHp};
}
