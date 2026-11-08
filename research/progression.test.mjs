import test from 'node:test';
import assert from 'node:assert/strict';
import {newProgression,grantUnlock,collectTreasure,availableCharacters,availableMainMenu,availableRaceMaps,availableBoardStages,encodeUnlockBits,decodeUnlockBits,testUnlock,evaluateProgression,applyResultCounters,bingoEntries,createBingoState,stepBingo,progressionData} from './progression.mjs';

const predicate=(type,args,p=newProgression(),c={})=>testUnlock({type,args},p,c);
test('original 160-bit save flags and default availability',()=>{
 let p=newProgression();
 assert.deepEqual(availableCharacters(p),[0,1,2,3]);
 assert.deepEqual(availableMainMenu(p),[0,4,2,3,1]);
 assert.deepEqual(availableBoardStages(p),[0]);
 for(const id of [0,7,8,56,64,79,86,92,93,102,135,159])p=grantUnlock(p,id);
 const bytes=encodeUnlockBits(p);assert.equal(bytes.length,20);assert.equal(bytes[0],129);assert.equal(bytes[1],1);assert.equal(bytes[19],128);
 assert.deepEqual(decodeUnlockBits(bytes),p.flags);
 assert.deepEqual(availableCharacters(p),[0,1,2,3,4,12]);
 assert.deepEqual(availableMainMenu(p),[0,4,6,5,7,2,3,1]);
 assert.deepEqual(availableRaceMaps(p),[16,17]);assert.deepEqual(availableBoardStages(p),[0,1,8]);
});
test('original table has 160 records; all treasures unlock threshold flags',()=>{
 assert.equal(progressionData.records.length,160);
 let p=newProgression();for(let i=0;i<56;i++)p=collectTreasure(p,i);
 const r=evaluateProgression(p,{});
 for(const id of [73,85,134])assert.equal(r.progress.flags[id],true);
 assert.throws(()=>collectTreasure(p,56),RangeError);
 assert.equal(p.flags[73],false,'caller state is immutable');
});
test('fixed point awards dependency 94 after quiet flag159, in original scan order',()=>{
 const p=collectTreasure(newProgression(),21);
 const r=evaluateProgression(p,{campaignId:0,stageIndex:9,mapId:0,turnCount:12});
 assert.equal(r.progress.flags[159],true);assert.equal(r.progress.flags[94],true);
 assert.ok(r.awarded.indexOf(159)<r.awarded.indexOf(94));
 assert.equal(r.notifications.some(n=>n.id===159),false);
 assert.deepEqual(r.notifications.find(n=>n.id===94),{id:94,messageId:2288});
});
test('unprovided source statistics remain unresolved, never guessed zero',()=>{
 const p=newProgression(),record=progressionData.records[72];
 assert.deepEqual(testUnlock(record,p,{players:[{characterId:0,chakra:100}]}),{eligible:false,missing:['80015078(0,0)']});
 const c={players:[{characterId:0,chakra:100}],native:{'80015078':[Array(14).fill(0)]}};
 assert.equal(testUnlock(record,p,c).eligible,true);
 assert.equal(evaluateProgression(p,{}).progress.flags[72],false);
});
test('campaign completion source boundaries are 8,2,5',()=>{
 for(const [campaignId,threshold]of [[0,8],[1,2],[2,5]]){
  assert.equal(predicate(7,[campaignId,-1,-1,-1,-1],undefined,{campaignId,stageIndex:threshold-1}).eligible,false);
  assert.equal(predicate(7,[campaignId,-1,-1,-1,-1],undefined,{campaignId,stageIndex:threshold}).eligible,true);
 }
});
test('turn conditions exclude both race maps and use strict upper bound',()=>{
 for(const mapId of [16,17])assert.equal(predicate(13,[-1,-1,10,-1,-1],undefined,{mapId,turnCount:9}).eligible,false);
 assert.equal(predicate(13,[-1,-1,10,-1,-1],undefined,{mapId:0,turnCount:9}).eligible,true);
 assert.equal(predicate(13,[-1,-1,10,-1,-1],undefined,{mapId:0,turnCount:10}).eligible,false);
 assert.equal(predicate(12,[-1,-1,40,-1,-1],undefined,{mapId:0,turnCount:40}).eligible,true);
});
test('bankruptcy unlock requires strictly negative other chakra; target condition includes equality',()=>{
 const c={players:[{characterId:0,chakra:100},{characterId:1,chakra:0}]};
 assert.equal(predicate(23,[-1,-1,-1,-1,-1],undefined,c).eligible,false);
 c.players[1].chakra=-1;assert.equal(predicate(23,[-1,-1,-1,-1,-1],undefined,c).eligible,true);
 c.targetChakra=600;assert.equal(predicate(27,[-1,-1,500,-1,-1],undefined,c).eligible,true);
 c.targetChakra=0;assert.equal(predicate(27,[-1,-1,500,-1,-1],undefined,c).eligible,false);
});
test('lowest-chakra nonwinner predicate rejects turn-limit finish',()=>{
 const args=[-1,-1,9,-1,-1],c={players:[{characterId:0,chakra:400},{characterId:9,chakra:100}],ranking:[0,1],modeFlags:0};
 assert.equal(predicate(11,args,undefined,c).eligible,true);
 c.modeFlags=2;c.turnCount=20;c.native={'8001f1c4':()=>1,'80012b74':()=>20};
 assert.equal(predicate(11,args,undefined,c).eligible,false);
 c.turnCount=19;assert.equal(predicate(11,args,undefined,c).eligible,true);
 c.ranking=[1,0];assert.equal(predicate(11,args,undefined,c).eligible,false);
});
test('result counters exclude race, normalize only player0 goggles, and truncate at16bits',()=>{
 let p=newProgression();p.characterCounts[0]=65534;p.matches=65535;
 let n=applyResultCounters(p,{mapId:0,characterIds:[12,1,12],pairCounts:[0,3,2],achievementCounters:[1,2,3,4,5]});
 assert.equal(n.matches,65535);assert.equal(n.characterCounts[0],3);assert.equal(n.characterCounts[1],3);assert.equal(n.characterCounts[12],2);
 assert.deepEqual(n.achievementCounters,[1,2,3,4,5]);
 for(const mapId of [16,17])assert.equal(applyResultCounters(newProgression(),{mapId,characterIds:[0,1],pairCounts:[0,1]}).matches,0);
 assert.equal(applyResultCounters(newProgression(),{mapId:0,characterIds:[0,1]}).matches,1);
});
test('Bingo Book index has14 source profiles, skips blank slots and rejects locked pages',()=>{
 const p=newProgression(),entries=bingoEntries(p);assert.equal(entries.filter(x=>!x.blank).length,14);
 let s=createBingoState();assert.equal(stepBingo(s,{type:'open'},p).phase,'index');
 s=stepBingo(s,{type:'move',dy:1},p);assert.equal(s.slot,9);
 s=stepBingo(s,{type:'move',dx:-1},p);assert.equal(s.slot,14);
 s=stepBingo({phase:'index',slot:7,overlay:true},{type:'move',dy:1},p);assert.equal(s.slot,14);
 assert.equal(entries.find(e=>e.profileId===13).resource,343);
});
test('Bingo Book page cycling skips locked entries and wraps both ways',()=>{
 let p=grantUnlock(grantUnlock(newProgression(),65),148),s={phase:'index',slot:1,overlay:true};
 s=stepBingo(s,{type:'open'},p);assert.equal(s.phase,'page');
 s=stepBingo(s,{type:'next-page',direction:1},p);assert.equal(s.slot,13);
 s=stepBingo(s,{type:'next-page',direction:1},p);assert.equal(s.slot,1);
 s=stepBingo(s,{type:'next-page',direction:-1},p);assert.equal(s.slot,13);
 s=stepBingo(s,{type:'toggle-overlay'},p);assert.equal(s.overlay,false);
 s=stepBingo(s,{type:'back'},p);assert.equal(s.phase,'index');
 s=stepBingo(s,{type:'back'},p);assert.equal(s.phase,'exit');
});
