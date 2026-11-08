import fs from 'node:fs';import assert from 'node:assert/strict';import {StoryRuntime,MessageState,messageAt,layoutGlyphStream,TEXT} from './story-runtime.mjs';
const index=JSON.parse(fs.readFileSync('extracted/story/index.json')),messages=JSON.parse(fs.readFileSync('extracted/story/messages.json'));
const font=new MessageState([1,2,3,4]);assert.equal(font.tick(),0);assert.equal(font.cursor,2);assert.equal(font.tick(),4);
let page=messageAt([1,2,0x4000,3,4],10);assert.equal(page.status,1);assert.equal(page.cursor,2);page=messageAt([1,2,0x4000,3,4],10,{pageReleased:true});assert.equal(page.status,4);
let slow=new MessageState([1,2,3],{speed:3});slow.tick();assert.equal(slow.cursor,0);slow.tick();assert.equal(slow.cursor,1);
let glyphs=layoutGlyphStream([1,0x2000,2,0x5000,1,3],{x:32,y:178});assert.deepEqual(glyphs.glyphs.map(g=>[g.x,g.y,g.colorMode]),[[32,178,0],[32,191,0],[45,191,1]]);
let summaries=[];
for(const campaign of index.campaign)for(const selection of campaign.scenes){
 if(selection.sceneId===255)continue;const story=index.storyScenes.find(s=>s.outcome===selection.outcome&&s.sceneId===selection.sceneId),scene=JSON.parse(fs.readFileSync(`extracted/story/scenes/scene_${story.sceneResourceId}.json`));
 let clock=0,current=null,wait=0,confirmed=0;const started=[],audio={prepare(e){return e;},play(e){started.push(e.xaId);current={end:clock+90,get playing(){return clock<this.end;},stop(){this.end=clock;}};return current;}};
 const runtime=new StoryRuntime({scene,messageBase:story.messageBase,messages,voices:selection.voices,audio,handlers:{4(){},5(){},6(){}}});
 for(;clock<200000&&!runtime.done;clock++){
  const waiting=!!(runtime.flags&12);wait=waiting?wait+1:0;const confirm=wait===6;if(confirm){confirmed++;wait=0;}runtime.vblank({confirm});
  assert.equal(runtime.errors.length,0);assert.equal(runtime.unresolved.length,0);
 }
 assert(runtime.done,`Stalled ${campaign.campaign}:${campaign.stage}:${selection.outcome}, flags${runtime.flags}, sequence${runtime.active}, frame${runtime.frames}, queue${runtime.queueIndex}`);
 assert.deepEqual(started,selection.voices.map(v=>v.xaId),`Voice order ${story.sceneResourceId}`);
 summaries.push({campaign:campaign.campaign,stage:campaign.stage,phase:selection.outcome,scene:story.sceneResourceId,vblanks:clock,voices:started.length,confirms:confirmed});
}
console.log('Passed font control and full playback traces:',summaries.length);fs.writeFileSync('extracted/story/runtime-validation.json',JSON.stringify({scope:'Deterministic virtual-audio playback, not original hardware trace',traces:summaries},null,2)+'\n');
// Async loading holds animation before it starts; early confirm never skips typing.
const first=index.campaign[0].scenes[0],firstStory=index.storyScenes.find(s=>s.outcome===0&&s.sceneId===0),firstScene=JSON.parse(fs.readFileSync('extracted/story/scenes/scene_175.json'));
let ready;const loading=new StoryRuntime({scene:firstScene,messageBase:firstStory.messageBase,messages,voices:first.voices,audio:{prepare(){return new Promise(r=>{ready=r;});},play(){return {playing:false,stop(){}};}},handlers:{4(){},5(){},6(){}}});
for(let i=0;i<10;i++)loading.vblank({confirm:true});assert.equal(loading.frames[0],0);assert(loading.flags&2);ready({});await Promise.resolve();loading.vblank();assert.equal(loading.frames[0],1);assert.equal(loading.confirm(),null);
const pageWords=messages.find(m=>m.id===1845).glyphStream;const before=messageAt(pageWords,1000);assert.equal(before.status,TEXT.PAGE);const after=messageAt(pageWords,1000,{pageReleased:true});assert.equal(after.status,TEXT.END);assert(after.start>0);assert(layoutGlyphStream(pageWords,{start:after.start,count:after.cursor-after.start}).glyphs.length>0);
const {xaPanGains}=await import('./story-runtime.mjs');assert.deepEqual(xaPanGains(0),[127/128,127/128]);assert.deepEqual(xaPanGains(16),[111/128,127/128]);assert.deepEqual(xaPanGains(-16),[127/128,111/128]);assert.deepEqual(xaPanGains(-128),[127/128,0]);
console.log('Passed async preparation, early confirm, original page/scroll and XA pan fixtures');
