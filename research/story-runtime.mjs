// Native JavaScript story control, derived from STORY_ENGINE.c/STORY_FONT.c.
// No console CPU, instruction interpreter or emulator is present.
import {sampleSequence} from './story-scene.mjs';
export const TEXT={RUNNING:0,PAGE:1,DELAY:2,SCROLL:3,END:4};
export class MessageState {
 constructor(words,{speed=0,maxLines=3}={}){this.words=words;this.speed=speed;this.maxLines=maxLines;this.cursor=0;this.start=0;this.status=0;this.counter=0;this.lines=0;this.scrollStep=0;this.scrollY=0;this.callback=false;this.unresolved=[];}
 substep(){
  if(this.status===TEXT.END||this.status===TEXT.PAGE)return;
  if(this.status===TEXT.DELAY){if(this.counter===0)this.status=0;else this.counter--;return;}
  if(this.status===TEXT.SCROLL){if(this.scrollStep<8){this.scrollY=this.scrollStep*2;this.scrollStep++;}else{this.status=0;this.scrollY=0;let occurrence=this.lines-2;this.start=0;for(let i=0;i<this.words.length;i++)if((this.words[i]&0xf000)===0x2000&&--occurrence===0){this.start=i+1;break;}}return;}
  this.counter++;if(this.counter<this.speed)return;this.counter=0;this.cursor++;
  if(this.cursor>=this.words.length){this.status=TEXT.END;return;}
  const command=this.words[this.cursor]&0xf000;
  if(command===0x3000){this.cursor++;if(this.cursor>=this.words.length)throw new Error('Truncated message delay');this.counter=this.words[this.cursor];this.status=TEXT.DELAY;}
  else if(command===0x2000){this.lines++;if(this.lines>=this.maxLines){this.status=TEXT.SCROLL;this.scrollStep=0;}}
  else if(command===0x4000)this.status=TEXT.PAGE;
  else if(command===0xb000)this.callback=true;
 }
 tick(){this.substep();this.substep();return this.status;}
 releasePage(){if(this.status!==TEXT.PAGE)return false;this.status=0;this.counter=this.speed;return true;}
}
export function messageAt(words,age,{pageReleased=false,speed=0,maxLines=3}={}){
 const state=new MessageState(words,{speed,maxLines});
 for(let i=0;i<age;i++){state.tick();if(state.status===TEXT.PAGE){if(!pageReleased)break;state.releasePage();}else if(state.status===TEXT.END)break;}
 return state;
}
export function layoutGlyphStream(words,{start=0,count=words.length-start,x=0,y=0,size=12,direction=0,colorMode=0,maxColumns=-1,dynamicNumber,dynamicMessage}={}){
 const glyphs=[],icons=[],unresolved=[];let px=x,py=y,column=0,color=colorMode;
 const advance=size===12?13:14,line=size===12?14:16,dx=direction===0?advance:0,dy=direction===1?line:0;
 function newline(){if(direction===0){y+=advance;px=x;py=y;}else{x-=line;px=x;py=y;}column=0;}
 const limit=Math.min(words.length,start+count);
 for(let i=start;i<limit;i++){
  const word=words[i],op=word&0xf000;
  if(op===0){glyphs.push({glyphId:word&4095,x:px,y:py,size,colorMode:color});px+=dx;py+=dy;column++;if(maxColumns>0&&column>=maxColumns)newline();}
  else if(op===0x2000)newline();
  else if(op===0x5000){const value=words[++i];if(value===undefined)throw new Error('Truncated message color');color=value<3?((colorMode&2)|(value&1)):colorMode;}
  else if(op===0x3000){if(words[++i]===undefined)throw new Error('Truncated message delay');}
  else if(op===0xc000){const icon=words[++i];if(icon===undefined)throw new Error('Truncated controller icon');icons.push({icon,x:px,y:py});px+=direction===0?16:0;py+=direction===1?16:0;column++;}
  else if(op===0x1000||op===0xd000){const handler=op===0x1000?dynamicNumber:dynamicMessage;if(handler){const sub=handler({x:px,y:py,size,colorMode:color,direction});glyphs.push(...sub.glyphs);icons.push(...(sub.icons??[]));px=sub.endX;py=sub.endY;}else unresolved.push({kind:op===0x1000?'dynamicNumber':'dynamicMessage',wordIndex:i,x:px,y:py});}
  else if(op!==0x4000&&op!==0xb000)unresolved.push({kind:'fontControl',value:word,wordIndex:i});
 }
 return {glyphs,icons,unresolved,endX:px,endY:py};
}
export function drawGlyphs(context,layout,atlases,{drawIcon}={}){
 context.imageSmoothingEnabled=false;
 for(const g of layout.glyphs){const atlas=atlases.get?.(`${g.size}:${g.colorMode}`)??atlases[`${g.size}:${g.colorMode}`];if(!atlas)throw new Error(`Missing font atlas ${g.size}:${g.colorMode}`);const columns=Math.floor(256/g.size);context.drawImage(atlas,g.glyphId%columns*g.size,Math.floor(g.glyphId/columns)*g.size,g.size,g.size,g.x,g.y,g.size,g.size);}
 if(drawIcon)for(const icon of layout.icons)drawIcon(context,icon);
}
function buildQueue(scene,voiceMap){
 const t=scene.tables,result=[];let offset=0;
 for(let seq=0;seq<t.sequence.length;seq++){
  const c=t.clips[t.sequence[seq]];
  for(let lid=c[2];lid<c[2]+c[3];lid++){const l=t.layers[lid];if(l[0]<3)continue;for(let eid=l[2];eid<l[2]+l[3];eid++){const e=t.events[eid];result.push({index:result.length,sequenceIndex:seq,eventId:eid,kind:l[0],frame:offset+e[0],localFrame:e[0],value:e[1],argument:e[3],xaId:voiceMap.get(`${seq}:${eid}`)?.xaId});}}
  offset+=c[0]-1;
 }
 // Match 80026338's exchange sort, including equal-time ordering effects.
 for(let i=0;i<result.length;i++)for(let j=i+1;j<result.length;j++)if(result[j].frame<result[i].frame)[result[i],result[j]]=[result[j],result[i]];
 return result;
}
export class StoryRuntime {
 constructor({scene,messageBase,messages,voices=[],audio=null,handlers={},textSpeed=0,strictCommands=false}){
  this.scene=scene;this.messageBase=messageBase;this.messages=messages instanceof Map?messages:new Map(messages.map(m=>[m.id,m.glyphStream]));this.audio=audio;this.handlers=handlers;this.textSpeed=textSpeed;this.strictCommands=strictCommands;
  this.frames=scene.tables.sequence.map(()=>0);this.active=0;this.endReleased=this.frames.map(()=>false);this.pageReleased=this.frames.map(()=>false);this.queue=buildQueue(scene,new Map(voices.map(v=>[`${v.sequenceIndex}:${v.eventId}`,v])));this.queueIndex=0;this.prepared=new Map();this.preparing=new Set();this.errors=[];this.unresolved=[];this.history=[];this.flags=0;this.toggle=false;this.vblankCount=0;this.done=false;this.finishing=false;this.skipped=false;this.currentAudio=null;this.pendingCommand=null;
  this.firstVoice=this.queue.find(e=>e.kind===3);if(this.firstVoice)this._prepare(this.firstVoice);this.snapshot=this._sample();
 }
 _note(e,reason){if(!this.unresolved.some(x=>x.eventId===e.eventId&&x.sequenceIndex===e.sequenceIndex&&x.reason===reason))this.unresolved.push({...e,reason});}
 _prepare(e){
  if(!e||this.prepared.has(e.index)||this.preparing.has(e.index))return;
  if(e.xaId===undefined){this._note(e,'missingXAId');return;}
  if(!this.audio){this._note(e,'audioAdapterMissing');this.prepared.set(e.index,null);return;}
  this.preparing.add(e.index);
  const accept=value=>{this.preparing.delete(e.index);this.prepared.set(e.index,value);};
  try{const p=this.audio.prepare(e);if(p?.then)p.then(accept,error=>{this.preparing.delete(e.index);this.errors.push({event:e,error:String(error)});});else accept(p);}catch(error){this.preparing.delete(e.index);this.errors.push({event:e,error:String(error)});}
 }
 _playing(){return !!this.currentAudio?.playing;}
 _process(aggregate){
  if(this.errors.length){this.flags|=2;return;}
  if(this.firstVoice&&!this.prepared.has(this.firstVoice.index)){this.flags|=2;return;}
  if(this.pendingCommand){this.flags|=2;return;}
  const e=this.queue[this.queueIndex];if(!e||aggregate<e.frame)return;
  if(e.kind===3){
   if(!e.started){
    if(!this.prepared.has(e.index)){this._prepare(e);this.flags|=2;return;}
    if(this._playing()){this.flags|=2;return;}
    if(this.audio)this.currentAudio=this.audio.play(this.prepared.get(e.index),e);else this.currentAudio=null;
    e.started=true;this.flags&=~2;this.history.push({...e,action:'voiceStart'});
   }
   const next=this.queue.slice(this.queueIndex+1).find(x=>x.kind===3);
   if(this._playing()){if(next&&aggregate>=next.frame-1)this.flags|=2;return;}
   // Original code waits for the previous stream to end before preparing next.
   if(next)this._prepare(next);this.queueIndex++;this.flags&=~2;return;
  }
  const handler=this.handlers[e.kind];
  if(!handler){this._note(e,'commandHandlerMissing');if(this.strictCommands){this.flags|=2;return;}this.queueIndex++;return;}
  try{const answer=handler(e);this.history.push({...e,action:'command'});if(answer?.then){this.pendingCommand=e;this.flags|=2;answer.then(()=>{this.pendingCommand=null;this.queueIndex++;this.flags&=~2;},error=>{this.errors.push({event:e,error:String(error)});});}else if(answer===false){this.flags|=2;}else{this.queueIndex++;this.flags&=~2;}}catch(error){this.errors.push({event:e,error:String(error)});this.flags|=2;}
 }
 _sample(){
  const sequences=[],dialogues=[];this.flags&=~12;
  for(let seq=0;seq<=this.active;seq++){
   const s=sampleSequence(this.scene,seq,this.frames[seq],{messageBase:this.messageBase});sequences.push(s);
   if(s.resetsTextAcknowledgement){this.endReleased[seq]=false;this.pageReleased[seq]=false;}
   for(const m of s.messages){
    const words=this.messages.get(m.messageId);if(!words){this.unresolved.push({kind:'message',messageId:m.messageId});continue;}
    const text=messageAt(words,m.elapsedTicks,{pageReleased:this.pageReleased[seq],speed:this.textSpeed});
    if(text.status===TEXT.PAGE&&!this.pageReleased[seq])this.flags|=8;
    if(text.status===TEXT.END&&!this.endReleased[seq])this.flags|=4;
    const layout=layoutGlyphStream(words,{start:text.start,count:text.cursor-text.start,x:m.x,y:m.y-text.scrollY,colorMode:0});
    dialogues.push({...m,sequenceIndex:seq,status:text.status,cursor:text.cursor,layout,scrolling:text.status===TEXT.SCROLL,clipTop:m.y,showContinue:!(this.flags&1)&&(text.status===TEXT.PAGE||text.status===TEXT.END&&!this.endReleased[seq])});
   }
  }
  return {sequences,dialogues,frames:[...this.frames],activeSequence:this.active,flags:this.flags,done:this.done,finishing:this.finishing,unresolved:this.unresolved,errors:this.errors,vblankCount:this.vblankCount,continueIcon:{x:290,y:207,id:0}};
 }
 confirm(){
  if(this.flags&4){for(const d of this.snapshot.dialogues)if(d.status===TEXT.END)this.endReleased[d.sequenceIndex]=true;this.flags&=~4;if(this._playing())this.currentAudio.stop();return 'end';}
  if(this.flags&8){for(const d of this.snapshot.dialogues)if(d.status===TEXT.PAGE)this.pageReleased[d.sequenceIndex]=true;this.flags&=~8;return 'page';}
  return null;
 }
 vblank({confirm=false}={}){
  if(this.done)return this.snapshot;
  this.vblankCount++;this.toggle=!this.toggle;
  if(this.firstVoice&&!this.prepared.has(this.firstVoice.index))this.flags|=2;
  else if(this.queueIndex===0&&!this.queue[0]?.started&&!this.pendingCommand)this.flags&=~2;
  let aggregate=0;
  if(this.toggle){for(let seq=0;seq<=this.active;seq++){const c=this.scene.tables.clips[this.scene.tables.sequence[seq]];if(!(this.flags&15))this.frames[seq]++;this.frames[seq]=Math.min(this.frames[seq],c[0]-1);aggregate+=this.frames[seq];}}
  this._process(aggregate);this.snapshot=this._sample();
  const clip=this.scene.tables.clips[this.scene.tables.sequence[this.active]];
  if(!(this.flags&15)&&this.frames[this.active]+1>=clip[0]){
   if(this.active+1<this.frames.length){this.active++;this.snapshot=this._sample();}
   else this.finishing=true;
  }
  if(confirm)this.confirm();
  if(this.finishing&&!this._playing()&&!this.pendingCommand)this.done=true;
  this.snapshot={...this.snapshot,flags:this.flags,done:this.done,finishing:this.finishing};return this.snapshot;
 }
 skip(){if(this._playing())this.currentAudio.stop();this.skipped=true;this.finishing=true;this.done=true;this.snapshot={...this.snapshot,done:true,skipped:true};return this.snapshot;}
}
// 80019370 -> 80017b90 -> 80019ab0 -> 800194d8: linear CD pan,
// followed by volume multiplication and the CD mixer's 7-bit gain.
export function xaPanGains(pan,{volume=255,stereo=true}={}){
 pan=Math.max(-128,Math.min(127,pan|0));volume=volume&255;
 const left=stereo&&pan>=0?255-2*pan:255,right=stereo&&pan<0?Math.max(0,255+2*pan):255;
 return [left,right].map(v=>(Math.trunc(v*volume/255)>>1)/128);
}
// Connect the existing pure XA codec: loadBuffer(entry) returns an AudioBuffer.
export function createWebAudioStoryAdapter(context,xaIndex,loadBuffer,{destination=context.destination,stereo=true,volume=255,tickRate=60}={}){
 const entries=new Map(xaIndex.clips.map(e=>[e.id,e])),cache=new Map();
 return {
  prepare(event){const entry=entries.get(event.xaId);if(!entry)throw new Error(`Missing XA ${event.xaId}`);if(!cache.has(entry.id))cache.set(entry.id,Promise.resolve(loadBuffer(entry)));return cache.get(entry.id);},
  play(buffer,event){
   const node=context.createBufferSource(),left=context.createGain(),right=context.createGain(),merge=context.createChannelMerger(2);node.buffer=buffer;
   const gains=xaPanGains(event.argument??0,{volume,stereo});left.gain.value=gains[0];right.gain.value=gains[1];node.connect(left);node.connect(right);left.connect(merge,0,0);right.connect(merge,0,1);merge.connect(destination);
   let playing=true,stopping=false;node.onended=()=>{playing=false;node.disconnect();left.disconnect();right.disconnect();merge.disconnect();};node.start();
   return {get playing(){return playing;},stop(){if(playing&&!stopping){stopping=true;const now=context.currentTime;for(let i=0;i<5;i++){const v=Math.trunc(volume*(5-i)/5),gain=xaPanGains(event.argument??0,{volume:v,stereo});left.gain.setValueAtTime(gain[0],now+i/tickRate);right.gain.setValueAtTime(gain[1],now+i/tickRate);}node.stop(now+5/tickRate);}},event};
  }
 };
}
