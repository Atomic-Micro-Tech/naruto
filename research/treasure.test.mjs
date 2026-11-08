import test from 'node:test';
import assert from 'node:assert/strict';
import {newProgression,collectTreasure}from'./progression.mjs';
import {createTreasureState,selectedTreasure,treasureItems,stepTreasure,treasureData,awardTreasureAfterUpgrade}from'./treasure.mjs';
test('56 original entries map image, name, description and7th-column voice portraits',()=>{
 assert.equal(treasureData.entries.length,56);
 assert.equal(treasureData.entries[0].resource,517);assert.equal(treasureData.entries[5].resource,522);
 assert.equal(treasureData.entries[6].resource,573);assert.equal(treasureData.entries[55].resource,580);
 assert.equal(treasureData.entries[55].nameMessageId,2409);assert.equal(treasureData.entries[55].descriptionMessageId,2249);
});
test('bounded7×8 index scrolls only after cursor reaches visible row2',()=>{
 const p=newProgression();let s=createTreasureState();
 s=stepTreasure(s,{type:'move',dx:-1},p);assert.equal(selectedTreasure(s),0);
 for(let i=0;i<2;i++)s=stepTreasure(s,{type:'move',dy:1},p);
 assert.equal(s.cursorRow,2);assert.equal(s.scrollRows,0);assert.equal(selectedTreasure(s),14);
 for(let i=0;i<20;i++)s=stepTreasure(s,{type:'move',dy:1},p);
 assert.equal(s.scrollRows,5);assert.equal(selectedTreasure(s),49);
 for(let i=0;i<20;i++)s=stepTreasure(s,{type:'move',dx:1},p);assert.equal(selectedTreasure(s),55);
 s=stepTreasure(s,{type:'move',dy:-1},p);assert.equal(s.scrollRows,5);assert.equal(s.cursorRow,1);
 s=stepTreasure(s,{type:'move',dy:-1},p);s=stepTreasure(s,{type:'move',dy:-1},p);assert.equal(s.scrollRows,4);assert.equal(s.cursorRow,0);
});
test('fresh collection renders no items and cannot open; viewing never grantsflags',()=>{
 const p=newProgression(),s=createTreasureState();assert.equal(treasureItems(p,s).filter(x=>x.collected).length,0);
 const locked=stepTreasure(s,{type:'open'},p);assert.equal(locked.phase,'index');assert.equal(locked.events[0].type,'locked');
 const collected=collectTreasure(p,0),detail=stepTreasure(s,{type:'open'},collected);assert.equal(detail.phase,'detail');
 assert.equal(detail.events[1].id,0);assert.equal(p.flags[0],false);assert.equal(collected.flags.filter(Boolean).length,1);
 const typing=stepTreasure(detail,{type:'advance',dialogueStatus:'typing'},collected);assert.equal(typing.phase,'detail');
 const next=stepTreasure(detail,{type:'advance',dialogueStatus:'waiting-page'},collected);assert.equal(next.events[0].type,'advance-message');
 const closed=stepTreasure(detail,{type:'advance',dialogueStatus:'complete'},collected);assert.equal(closed.phase,'index');
});
test('source menu-background easter egg after viewing0and1, reset by2',()=>{
 let p=newProgression();for(const id of [0,1,2])p=collectTreasure(p,id);let s=createTreasureState();
 const viewAndClose=()=>{s=stepTreasure(s,{type:'open'},p);s=stepTreasure(s,{type:'back'},p);};
 viewAndClose();assert.equal(s.menuTheme,0);s=stepTreasure(s,{type:'move',dx:1},p);viewAndClose();
 assert.equal(s.menuTheme,1);assert.deepEqual(s.viewedFirstPair,[false,false]);assert.equal(s.events.find(e=>e.type==='menu-theme').resource,45);
 s=stepTreasure(s,{type:'move',dx:1},p);viewAndClose();assert.equal(s.menuTheme,0);assert.equal(s.events.find(e=>e.type==='menu-theme').resource,44);
});
test('source acquisition only after story human upgrade with currenttile at displayedlevel5',()=>{
 const p=newProgression(),c={gameMode:0,actorFlags:0,currentTile:{level:5,eventId:4}};
 const r=awardTreasureAfterUpgrade(p,c);assert.equal(r.awarded,4);assert.equal(r.progress.flags[4],true);assert.equal(p.flags[4],false);
 assert.equal(awardTreasureAfterUpgrade(r.progress,c).awarded,null);
 for(const bad of [{...c,gameMode:1},{...c,actorFlags:256},{...c,currentTile:{level:4,eventId:4}},{...c,currentTile:{level:5,eventId:255}},{...c,currentTile:{level:5,eventId:57}}])assert.equal(awardTreasureAfterUpgrade(p,bad).awarded,null);
 assert.ok(awardTreasureAfterUpgrade(p,{}).missing.length);
 assert.equal(new Set(treasureData.locations.map(l=>l.treasureId)).size,56);
 assert.deepEqual(treasureData.locations.find(l=>l.mapId===0&&l.tileId===7),{mapId:0,tileId:7,treasureId:0,mapResource:630,byteOffset:240});
});
