import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as P from './story1-cpu-preroll.mjs';
const data=JSON.parse(fs.readFileSync(new URL('./board-ai.json',import.meta.url)));
const rules=JSON.parse(fs.readFileSync(new URL('./full-rules.json',import.meta.url)));
const fresh=()=>({rngState:1,modeFlags:0,players:[{position:0,chakra:1500,flags:0,status:0,actorStatus:0,direction:0,team:255,inventory:[255,255,255]},{position:1,chakra:1500,flags:0x500,status:0,actorStatus:0,direction:0,team:255,inventory:[255,255,255]}],tiles:Array.from({length:6},(_,i)=>({typeCode:4,owner:15,level:1,hp:2,effect:0,neighbors:[(i+1)%6,(i+5)%6,255,255],purchasePrice:100,upgradeBase:100,rents:[100,200,300,400,500]}))});
const cardOpts={cards:rules.cards,priority:0,frequency:11,relationships:[0,1],crystalCount:2};
const preOpts={params:P.preRollCpuParameters(data,10),cards:rules.cards,availableJutsu:[10,13,2,255],jutsuPriorityTable:data.jutsuPriorities,relationships:[1,0],crystalCount:2};
test('raw parameters distinguish card frequency and jutsu frequency',()=>{
 const p=P.preRollCpuParameters(data,10);assert.equal(p.jutsuFrequency,1);assert.equal(p.cardFrequency,2);assert.equal(p.cardUsePriority,0);assert.equal(p.powerPriority,0);assert.equal(p.powerFrequency,1);
 assert.deepEqual(P.powerPriorities[0],[0,1,3,2,255]);assert.equal(P.cardUsePriorities[0][0],26);
});
test('stage0 CPU attempts jutsu but cannot win frequency without type8',()=>{
 const s=fresh();s.players[1].inventory=[28,255,255];
 const r=P.cpuPreRoll(s,1,preOpts);assert.equal(r.kind,'roll');assert.equal(r.draws,3);
 assert.deepEqual(r.menu,[0,3,5]);assert.deepEqual(r.policyState,{decisionByte:0,cardAttempted:false,powerAttempted:false,jutsuAttempted:false});
});
test('forced move replaces roll menu; disabled/all-empty jutsu consumes no jutsu draw',()=>{
 const s=fresh();s.players[1].forcedMove=4;
 const r=P.cpuPreRoll(s,1,{...preOpts,availableJutsu:[255,255,255,255]});
 assert.equal(r.kind,'forced-move');assert.equal(r.draws,1);assert.deepEqual(r.menu,[1,3]);
});
test('card28 targets self and outranks jutsu; attempts retained until actual roll',()=>{
 const s=fresh();s.players[1].inventory=[28,255,255];
 const params={...preOpts.params,cardFrequency:11};
 let r=P.cpuPreRoll(s,1,{...preOpts,params});assert.equal(r.kind,'card');assert.equal(r.payload.cardSlot,0);assert.equal(r.payload.target,1);
 assert.equal(r.policyState.cardAttempted,true);assert.equal(r.policyState.jutsuAttempted,true);
 r=P.cpuPreRoll({...s,rngState:r.rngState},1,{...preOpts,params,policyState:r.policyState});
 assert.equal(r.kind,'roll');assert.equal(r.draws,1);
});
test('targeted card prefers positive rival score and requires exact actorStatus0',()=>{
 const s=fresh();s.players[0].inventory=[19,255,255];
 let r=P.cpuPreRollCard(s,0,cardOpts);assert.equal(r.target,1);assert.equal(r.actionPriority,350);assert.equal(r.draws,2);
 s.players[1].actorStatus=2;r=P.cpuPreRollCard(s,0,cardOpts);assert.equal(r.target,255);assert.equal(r.draws,1);
});
test('movement card source lookahead uses own fixed direction and target coin flip',()=>{
 const s=fresh();s.rngState=2;s.players[0].inventory=[13,255,255];s.tiles[2].typeCode=2;
 let r=P.cpuPreRollCard(s,0,cardOpts);assert.equal(r.target,0);assert.equal(r.actionPriority,350);assert.equal(r.draws,2);
 s.players[0].direction=255;assert.throws(()=>P.cpuPreRollCard(s,0,cardOpts),/invalid directional/);
 s.players[0].direction=0;s.tiles[0].typeCode=3;r=P.cpuPreRollCard(s,0,cardOpts);assert.equal(r.actionPriority,0);assert.equal(r.draws,2);
});
test('scroll power3 forces selection and blocks lower card despite card attempt RNG',()=>{
 const s=fresh();s.players[1].flags|=0x200;s.players[1].inventory=[28,255,255];
 const r=P.cpuPreRoll(s,1,{...preOpts,params:{...preOpts.params,cardFrequency:11},enabledPowerIds:[3]});
 assert.equal(r.kind,'scroll-power');assert.equal(r.payload.powerId,3);assert.equal(r.priority,1000);assert.equal(r.draws,4);
 assert.equal(r.policyState.cardAttempted,true);
});
test('scroll power0 original rank3 check prevents selecting it in two-player story0',()=>{
 const s=fresh();s.players[1].chakra=-2000;s.players[1].flags|=0x200;
 const r=P.cpuPreRollPower(s,1,{enabledPowerIds:[0],priority:0,frequency:1,reserveByte:75,relationships:[1,0]});
 assert.equal(r.powerId,0);assert.equal(r.actionPriority,0);assert.equal(r.draws,1);
});
test('scroll capture chooses highest rawrent after per-target relationship RNG',()=>{
 const s=fresh();Object.assign(s.tiles[0],{typeCode:5,owner:0});Object.assign(s.tiles[2],{typeCode:5,owner:0,level:3});
 const r=P.cpuPreRollPower(s,1,{enabledPowerIds:[2],priority:0,frequency:10,reserveByte:75,relationships:[0,0]});
 assert.equal(r.powerId,2);assert.equal(r.target,2);assert.equal(r.actionPriority,1000);assert.equal(r.draws,4);
});

test('freshmap0 direction255 reads untouched fourth-arrow flag byte0',()=>{
 const s=fresh();s.rngState=2;s.players[0].inventory=[13,255,255];s.players[0].direction=255;s.tiles[0].typeCode=0;Object.assign(s.tiles[3],{typeCode:5,owner:0});
 const r=P.cpuPreRollCard(s,0,{...cardOpts,direction255TileByte:0});assert.equal(r.target,0);assert.equal(r.actionPriority,350);assert.equal(r.draws,2);
});
