import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as A from './board-ai.mjs';
import {ps1Random} from './faithful-rules.mjs';
const data=JSON.parse(fs.readFileSync(new URL('./board-ai.json',import.meta.url)));
const fresh=()=>({rngState:1,modeFlags:0,defeatCounters:0,
 players:Array.from({length:4},()=>({chakra:1500,position:0,flags:0,status:0,actorStatus:0,team:0,direction:0,inventory:[]})),
 tiles:Array.from({length:8},(_,i)=>({typeCode:4,owner:15,level:1,hp:2,effect:0,repairCounter:0,
  purchasePrice:100,upgradeBase:100,rents:[100,200,300,400,500],neighbors:[255,255,255,255],x:i*10,y:i*5}))});
const nextState=(seed,n)=>{while(n--)seed=ps1Random(seed).state;return seed;};
const skills=[{costs:[30,3],powers:[6,2],flags:0},{costs:[10,9],powers:[4,9],flags:4},
 {costs:[20,5],powers:[6,4],flags:0},{costs:[10,3],powers:[4,8],flags:0}];
test('binary tables and per-character getter mapping, including reserve-byte wrap',()=>{
 assert.equal(data.cardPriorities.length,5);assert.ok(data.cardPriorities.every(r=>r.length===60));
 assert.equal(data.jutsuPriorities.length,4);assert.deepEqual(data.combatSelectionRanks,[3,3,3,2,2,2,1,1,1,0,0,0]);
 assert.deepEqual(A.characterCpuParameters(data,0),{reserveByte:75,cardPriority:2,discardPriority:2,jutsuPriority:0,jutsuFrequency:2,combatChoiceSkill:2,combatStopSkill:1});
 assert.equal(A.characterCpuParameters(data,11).combatChoiceSkill,9);
 assert.equal(A.cpuReserveThreshold(179),600);assert.throws(()=>A.cpuReserveThreshold(),/reserve/);
});
test('purchase reserve boundary and scenario restriction are independent of purchase price',()=>{
 const s=fresh();s.players[0].chakra=599;s.tiles[0].purchasePrice=1;
 assert.equal(A.cpuPurchaseOrRemoteUpgrade(s,0,{reserveByte:179}).choice,1);
 s.players[0].chakra=600;s.tiles[0].purchasePrice=999;
 assert.equal(A.cpuPurchaseOrRemoteUpgrade(s,0,{reserveByte:179}).choice,0);
 s.modeFlags=0x80;s.defeatCounters=0x23;
 assert.equal(A.cpuPurchaseOrRemoteUpgrade(s,2,{reserveByte:0}).choice,1);
});
test('remote upgrade uses rent plus level bonus and preserves first tie',()=>{
 const s=fresh();s.tiles[0].typeCode=2;
 for(const i of [1,2,3])Object.assign(s.tiles[i],{typeCode:5,owner:0,level:2});
 s.tiles[3].upgradeBase=1600;
 assert.equal(A.cpuPurchaseOrRemoteUpgrade(s,0,{reserveByte:0,candidateTiles:[2,1,3]}).upgradeTile,2);
});
test('owned barrier uses nonlinear cost and consumes RNG even with locked decision',()=>{
 const s=fresh();s.tiles[0].typeCode=5;s.tiles[0].owner=0;s.players[0].chakra=1100;
 const menuActions=[255,6,0,255,255,255,255,255];
 const r=A.cpuOwnedBarrierAction(s,0,{reserveByte:179,menuActions,decisionByte:129});
 assert.deepEqual([r.slot,r.action,r.upgradeIndex,r.decisionByte,r.draws],[2,0,1,128,1]);
 assert.equal(r.rngState,nextState(1,1));
 s.players[0].chakra=600;assert.equal(A.cpuOwnedBarrierAction(s,0,{reserveByte:179,menuActions}).action,6);
});
test('chance choice card11 missing-crystal boost and card36 target side effect',()=>{
 const s=fresh();const priorityTable=[Array.from({length:60},(_,i)=>i)];
 let r=A.cpuChanceChoice(s,0,{cards:[0,11,5],priority:0,priorityTable,crystalTileIds:[1,2]});
 assert.equal(r.slot,1);assert.equal(r.draws,0);
 s.modeFlags=8;for(const i of [1,2,3])s.players[i].flags=0x100;s.players[3].inventory=[21];
 r=A.cpuChanceChoice(s,0,{cards:[11,36,1],priority:0,priorityTable,crystalTileIds:[1,2]});
 assert.equal(r.slot,0);assert.equal(r.teleportTarget,2);
 r=A.cpuChanceChoice(s,0,{cards:[0,11,5],priority:5,priorityTable,crystalTileIds:[1]});
 assert.equal(r.slot,2);assert.equal(r.draws,1);
});
test('discard selects largest preference rank; random policy includes fourth slot',()=>{
 assert.equal(A.cpuDiscardChoice({cards:[2,9,4,255],priority:0,priorityTable:[Array.from({length:16},(_,i)=>i)],rngState:1}).slot,1);
 assert.equal(A.cpuDiscardChoice({cards:[2,9,4,255],priority:3,priorityTable:[],rngState:1}).slot,2);
});
test('combat power/cost ordering uses original signed fields and exact RNG branch count',()=>{
 const a=A.cpuCombatOrder({side:0,techniques:skills,rngState:1});
 assert.deepEqual(a.order,[1,3,2,0]);assert.equal(a.policy,1);assert.equal(a.draws,2);
 const d=A.cpuCombatOrder({side:1,techniques:skills,defenderChoice:1,rngState:1});
 assert.deepEqual(d.order,[2,0,1,3]);assert.equal(d.draws,1);
 const ranged=A.cpuCombatOrder({side:0,techniques:skills,ranged:true,rngState:1});
 assert.deepEqual(ranged.order,[3,0,2,1]);
});
test('counter insertion reverses tail matches; malformed all-counter list is explicit',()=>{
 const t=[0,0,4,4].map(flags=>({flags}));
 assert.deepEqual(A.promoteCounterOrder([0,1,2,3],t),[3,2,0,1]);
 assert.throws(()=>A.promoteCounterOrder([0],[{flags:4}]),/beyond/);
});
test('combat rank follows character skill and availability wraps sorted order',()=>{
 const r=A.cpuCombatChoice({side:0,order:[1,3,2,0],aiSkill:2,selectionRanks:data.combatSelectionRanks,availabilityMask:4,rngState:1});
 assert.deepEqual([r.rank,r.index,r.button,r.draws],[0,1,4,2]);
 const d=A.scanCombatAvailability({side:1,order:[0,2,1],rank:1,availabilityMask:8});
 assert.deepEqual(d,{rank:1,index:2,button:8});
 assert.throws(()=>A.scanCombatAvailability({side:0,order:[0],rank:0,availabilityMask:0}),/no selectable/);
});
test('reactive combat demotes attacking counter or promotes defensive counter without forced RNG',()=>{
 let r=A.cpuCombatReaction({side:0,order:[1,0,2,3],policy:128,techniques:skills,selectedIndex:1,opponentCounter:true,chakra:1000,divisor:1,availabilityMask:15,rngState:1});
 assert.equal(r.changed,true);assert.equal(r.policy,0);assert.equal(r.draws,0);assert.equal(r.index,3);
 r=A.cpuCombatReaction({side:1,order:[0,2,3,1],policy:0,techniques:skills,selectedIndex:0,opponentCounter:true,chakra:1000,divisor:1,availabilityMask:15,rngState:1});
 assert.equal(r.changed,true);assert.equal(r.index,1);assert.equal(r.policy,128);
 r=A.cpuCombatReaction({side:1,order:[0,2,3,1],policy:0,techniques:skills,selectedIndex:0,opponentCounter:true,chakra:1001,divisor:2,availabilityMask:15,rngState:1});
 assert.equal(r.changed,false);assert.equal(r.draws,0);
});
test('board jutsu probability attempts once; special barriers bypass failure',()=>{
 const s=fresh(),opts={availableJutsu:[1,255,255,255],priority:0,frequency:2,priorityTable:[Array.from({length:14},(_,i)=>i)]};
 let r=A.cpuBoardJutsu(s,0,opts);assert.equal(r.jutsuSlot,255);assert.equal(r.attempted,true);assert.equal(r.draws,1);
 s.tiles[7].typeCode=8;r=A.cpuBoardJutsu(s,0,opts);assert.equal(r.jutsuId,1);assert.equal(r.actionPriority,255);assert.equal(r.draws,2);
 r=A.cpuBoardJutsu(s,0,{...opts,alreadyAttempted:true});assert.equal(r.draws,0);
});
test('owned jutsu negative priority wraps after selection instead of remaining signed',()=>{
 const s=fresh();Object.assign(s.tiles[0],{typeCode:5,owner:0});
 const r=A.cpuBoardJutsu(s,0,{availableJutsu:[0,4,5,255],priority:0,frequency:11,priorityTable:[Array.from({length:14},(_,i)=>i)]});
 assert.equal(r.jutsuId,5);assert.equal(r.draws,1);
});
test('damage jutsu requires source relationship values and prioritizes eligible target',()=>{
 const s=fresh();Object.assign(s.tiles[1],{typeCode:5,owner:1,level:1,upgradeBase:300});
 Object.assign(s.tiles[2],{typeCode:5,owner:2,level:2,upgradeBase:100});
 const opts={availableJutsu:[10,255,255,255],priority:0,frequency:11,priorityTable:[Array.from({length:14},(_,i)=>i)],targets:[1,2]};
 assert.throws(()=>A.cpuBoardJutsu(s,0,opts),/relationship/);
 const r=A.cpuBoardJutsu(s,0,{...opts,relationships:[-1,-1,-1,-1]});
 assert.equal(r.target,1);assert.equal(r.actionPriority,255);assert.equal(r.draws,4);
});
test('directed route probe counts nonconnectors and treats junction as successful stop',()=>{
 const s=fresh();s.tiles[0].neighbors[0]=1;s.tiles[1].typeCode=6;s.tiles[1].neighbors[0]=2;
 s.tiles[2].typeCode=3;s.tiles[2].neighbors[0]=3;s.tiles[3].typeCode=1;
 let r=A.cpuRouteProbe(s,0,{goalType:1,direction:0,crystalTileIds:[3]});
 assert.deepEqual(r,{found:true,tile:2,steps:1,packed:65538});
 assert.equal(A.cpuRouteProbe(s,0,{goalType:1,direction:0,rejectJunction:true,crystalTileIds:[3]}).found,false);
 s.tiles[2].typeCode=4;s.players[0].flags=0x1000;
 assert.deepEqual(A.cpuRouteProbe(s,0,{goalType:1,direction:0,crystalTileIds:[3]}),{found:false,steps:2});
});
test('landing scoring keeps incoming register on cheap enemy barrier and tie keeps prior tile',()=>{
 const s=fresh();s.tiles[0].typeCode=2;Object.assign(s.tiles[1],{typeCode:5,owner:1});
 const c={direction:0,crystalTileIds:[7],candidates:[{tile:1,direction:0}]};
 assert.throws(()=>A.cpuLandingCandidate(s,0,c),/s2/);
 assert.equal(A.cpuLandingCandidate(s,0,{...c,initialScore:500}).score,500);
 const r=A.cpuLandingCandidate(s,0,{...c,candidates:[{tile:0,direction:0},{tile:1,direction:0}]});
 assert.deepEqual(r,{tile:0,score:300,carriedScore:300});
});
test('route geometry uses map7 vertical metric, otherwise first hop plus four directed lookahead steps',()=>{
 const s=fresh();for(let i=0;i<7;i++)s.tiles[i].neighbors[0]=i+1;s.tiles[7].typeCode=1;
 assert.deepEqual(A.cpuRouteGeometry(s,0,{directions:[0,255],crystalTileIds:[7],mapId:7}),[30,null]);
 assert.deepEqual(A.cpuRouteGeometry(s,0,{directions:[0],crystalTileIds:[7],mapId:0}),[22]);
 s.players[0].flags=0x1000;assert.deepEqual(A.cpuRouteGeometry(s,0,{directions:[0],crystalTileIds:[7],mapId:0}),[11]);
});
test('route score weighs missing crystal ahead of trap, strict tie picks first',()=>{
 const s=fresh();s.tiles[1].typeCode=1;s.tiles[1].effect=8;s.tiles[2].typeCode=4;
 const routes=[{direction:0,choiceCode:10,distance:20,landingTile:1,probeFound:true,missingBeforeJunction:true},
 {direction:1,choiceCode:11,distance:1,landingTile:2,probeFound:true},null,null];
 const r=A.cpuChooseRoute(s,0,{routes,allCrystals:false,barrierCount:0});
 assert.deepEqual(r.scores,[30480,2099,null,null]);assert.equal(r.choiceCode,10);assert.equal(r.draws,0);
 s.players[0].status=0x20;const p=A.cpuChooseRoute(s,0,{routes,allCrystals:false,barrierCount:0});
 assert.equal(p.slot,1);assert.equal(p.draws,3);
});
test('bankruptcy waits for money queue and only commits in elimination mode',()=>{
 const s=fresh();s.modeFlags=1;s.players[0].chakra=-1;s.players[0].flags=0x1200;
 Object.assign(s.tiles[0],{typeCode:5,owner:0,level:5,hp:8,effect:8,repairCounter:1});
 assert.deepEqual(A.resolveBankruptcy(s,{currentActor:0}).eliminated,[]);
 const r=A.resolveBankruptcy(s,{currentActor:0,queuesSettled:true});
 assert.deepEqual(r.eliminated,[0]);assert.equal(r.players[0].flags,0);assert.equal(r.players[0].actorStatus&1,1);
 assert.deepEqual([r.tiles[0].typeCode,r.tiles[0].owner,r.tiles[0].level,r.tiles[0].hp,r.tiles[0].effect,r.tiles[0].repairCounter],[4,15,1,2,0,0]);
 assert.equal(s.tiles[0].typeCode,5);assert.equal(r.victory.won,false);
});
test('team bankruptcy starts only for current actor, then processes all negative wallets',()=>{
 const s=fresh();s.modeFlags=0x1001;s.players.forEach((p,i)=>p.team=i%2);
 s.players[0].chakra=-1;s.players[2].chakra=-1;
 assert.deepEqual(A.resolveBankruptcy(s,{currentActor:1,queuesSettled:true}).eliminated,[]);
 const r=A.resolveBankruptcy(s,{currentActor:2,queuesSettled:true});assert.deepEqual(r.eliminated,[2,0]);
 assert.deepEqual(r.victory,{won:true,reason:0x1000,winner:1});
});
test('bankruptcy zero-human ending uses255; zero-wallet winner keeps prior byte',()=>{
 const s=fresh();s.modeFlags=1;s.players.forEach(p=>p.flags=0x100);
 assert.deepEqual(A.resolveBankruptcy(s,{currentActor:0,queuesSettled:true}).victory,{won:true,reason:0,winner:255,noHumans:true});
 for(let i=1;i<4;i++)s.players[i].actorStatus=1;s.players[0].chakra=0;
 assert.throws(()=>A.resolveBankruptcy(s,{currentActor:0,queuesSettled:true}),/prior byte/);
 assert.equal(A.resolveBankruptcy(s,{currentActor:0,queuesSettled:true,previousWinner:2}).victory.winner,2);
});
test('defender choice uses raw rent/chain, scroll/elimination modes and type8 wallet',()=>{
 const s=fresh();Object.assign(s.tiles[0],{typeCode:5,owner:1});s.players[1].flags=0x100;
 assert.equal(A.cpuDefenderChoice(s,1,0),0);s.tiles[0].rents[0]=201;
 assert.equal(A.cpuDefenderChoice(s,1,0),1);s.modeFlags=1;assert.equal(A.cpuDefenderChoice(s,1,0),0);
 s.modeFlags=8;s.players[1].flags|=0x200;assert.equal(A.cpuDefenderChoice(s,1,0),0);
 s.players[1].flags=0;assert.throws(()=>A.cpuDefenderChoice(s,1,0),/persistent/);
 assert.equal(A.cpuDefenderChoice(s,1,0,{previousChoice:1}),1);
 s.tiles[0].typeCode=8;s.players[0].status=0x20;s.players[0].chakra=300;
 assert.equal(A.cpuDefenderChoice(s,1,0),0);s.players[0].chakra=301;assert.equal(A.cpuDefenderChoice(s,1,0),1);
});
