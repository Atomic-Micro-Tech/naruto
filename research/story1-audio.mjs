/** Original first-story SFX dispatch. Source refs and conditional phases: story1-audio.md/json. */
import {MusicPlayer} from './music-player.mjs';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
/** FUN80019ab0 + 19b9c: attenuate one byte-volume side, then shift both right by one. */
export function nativePan(volume=180,pan=0){
 volume=clamp(Math.trunc(volume),0,255);pan=clamp(Math.trunc(pan),-128,127);
 const attenuated=volume-Math.min(volume,Math.trunc(volume*Math.abs(pan)*2/255));
 return pan<0?[volume>>1,attenuated>>1]:[attenuated>>1,volume>>1];
}
const sound=(bank,sequence,channel,extra={})=>({bank,sequence,channel,volume:180,pan:0,loop:false,...extra});
/** Returns source-backed commands, including explicit unresolved events. Does no IO. */
export function resolveEvent(name,d={}){
 const pan=d.pan??0;
 switch(name){
 case 'menu-cursor':return sound('menu',2,0);
 case 'menu-confirm':return sound('menu',0,1);
 case 'menu-cancel':return sound('menu',1,1);
 case 'menu-disabled':return sound('menu',10,1);
 case 'menu-open':return sound('board',2,3);
 case 'roll':return sound('menu',3,0,{loop:true});
 case 'stop':return sound('menu',4,1,{pan:d.pan??(d.side===1?-64:64)});
 case 'roll-freeze':return {stopChannel:0};
 case 'roll-impact':return sound('menu',5,0,{pan:d.pan??Math.trunc(((d.hammerX??160)-160)/2)});
 case 'walk':
  if(d.jump)return sound('board',12,2);
  if(d.suppressNormalSound)return {silent:true};
  return sound('board',d.cpu||d.possessed||d.fast?10:8,2);
 case 'walk-land':return d.jump?sound('board',13,5):{silent:true};
 case 'claim':
  if(d.phase==='prompt')return sound('board',24,1);
  if(d.phase==='confirm')return sound('menu',0,1);
  return {unresolved:'claim requires prompt or confirm phase; no dedicated ownership-commit sound proven'};
 case 'upgrade':
  if(d.phase==='confirm')return sound('menu',0,1);
  return {unresolved:'upgrade visual-effect sound not yet traced; generic accepted menu sound requires confirm phase'};
 case 'pay':
  if(d.phase==='negative-amount-display')return sound('board',21,1);
  if(d.phase==='reaction')return sound('board',22,4);
  return {unresolved:'payment has phased visual-effect and actor-reaction sounds; no immediate debit sound proven'};
 case 'bonus-tick':return d.frame%2===0?sound('board',5,2):{silent:true};
 case 'turn':return d.scriptVoiceActive?{silent:true}:sound('board',d.readyToWin?47:7,2);
 case 'battle-start':
  if(d.phase==='transition')return {...sound('board',78,2),fadeMusic:{seconds:20/60,stop:true}};
  if(d.phase==='combat-music')return {music:{id:22,volume:100,loop:true}};
  return {unresolved:'battle-start requires transition or combat-music phase'};
 case 'battle-result':
  if(d.phase==='fade')return {fadeMusic:{seconds:20/60,stop:true}};
  if(d.phase==='music'&&typeof d.defenderHpZero==='boolean')return {music:{id:d.defenderHpZero?24:25,volume:100,loop:false}};
  return {unresolved:'battle-result music requires phase music and defenderHpZero; result is not attacker success flag'};
 case 'board-music':return {music:{id:10,volume:90,loop:true}};
 case 'character-voice':
  if([12,10].includes(d.character)&&Number.isInteger(d.slot)&&d.slot>=0&&d.slot<12&&Number.isInteger(d.channel))return sound(`character-${d.character}-voice-${d.slot}`,0,d.channel,{volume:255,pan});
  return {unresolved:'character voice requires character 12/10, original slot 0..11, and original channel'};
 default:return {unresolved:`Unmapped original audio event: ${name}`};
 }
}
export class Story1Audio{
 constructor(context,{baseURL='./assets/story1-audio/',muted=false,index=null,destination=context.destination,musicPlayer=null,Player=MusicPlayer,fetch:fetcher=globalThis.fetch,onUnresolved=null}={}){
  this.context=context;this.baseURL=baseURL.endsWith('/')?baseURL:baseURL+'/';this.index=index;this.fetch=fetcher.bind(globalThis);this.Player=Player;this.musicPlayer=musicPlayer;this.onUnresolved=onUnresolved;
  this.output=context.createGain();this.output.connect(destination);this.channels=[];this.buffers=new Map();this.pending=new Set();this.unresolved=[];this.ring=0;this.generation=0;this.musicTimer=null;this.setMuted(muted);
 }
 async load(){
  if(!this._load)this._load=(async()=>{
   if(!this.index){const r=await this.fetch(this.baseURL+'index.json');if(!r.ok)throw Error('Story audio index HTTP '+r.status);this.index=await r.json();}
   this.channels=Array.from({length:8},()=>{const p=new this.Player(this.context,{baseURL:this.baseURL,index:this.index,destination:this.output,fetch:this.fetch,volume:1});p.buffers=this.buffers;return p;});
   await Promise.all(this.channels.map(p=>p.load()));return this;
  })();return this._load;
 }
 async preload(ids=['menu','board','story0']){await this.load();await Promise.all(ids.map(id=>this.channels[0].preload(id)));return this;}
 setMuted(value){this.muted=!!value;this.output.gain.setValueAtTime(this.muted?0:1,this.context.currentTime);}
 stop(){this.generation++;if(this.musicTimer!==null)clearTimeout(this.musicTimer);this.musicTimer=null;for(const p of this.channels)p.stop();this.pending.clear();this.ring=0;}
 dispose(){this.stop();for(const p of this.channels)p.dispose();this.output.disconnect();}
 _unresolved(message,event){const record={message,event};this.unresolved.push(record);this.onUnresolved?.(record);return {unresolved:message};}
 async _execute(command){
  if(command.unresolved)return this._unresolved(command.unresolved,command);
  if(command.silent)return command;
  const token=this.generation;await this.load();if(token!==this.generation)return {cancelled:true};
  if(command.stopChannel!==undefined)this.channels[command.stopChannel].stop();
  if(command.fadeMusic&&this.musicPlayer){
   if(this.musicTimer!==null)clearTimeout(this.musicTimer);
   this.musicPlayer.setSequenceVolume(0,{fadeSeconds:command.fadeMusic.seconds});
   if(command.fadeMusic.stop)this.musicTimer=setTimeout(()=>{this.musicPlayer.stop();this.musicTimer=null;},command.fadeMusic.seconds*1000);
  }
  if(command.music&&this.musicPlayer){
   if(this.musicTimer!==null)clearTimeout(this.musicTimer);this.musicTimer=null;
   this.musicPlayer.setSequenceVolume(command.music.volume);await this.musicPlayer.play(command.music.id,{loop:command.music.loop});
  }
  if(command.bank){
   const p=this.channels[command.channel];if(!p)throw Error('Original audio channel must be 0..7');
   const marker={channel:command.channel};this.pending.add(marker);
   try{p.setSequenceStereoVolume(...nativePan(command.volume,command.pan));await p.play(command.bank,{sequence:command.sequence,loop:command.loop});}finally{this.pending.delete(marker);}
  }
  return command;
 }
 playEvent(name,details={}){return this._execute(resolveEvent(name,details));}
 /** Use directly as StoryRuntime handlers[5]. False synchronously means retry, not consumed. */
 storySound(event){
  if(event.kind!==undefined&&event.kind!==5)return this._unresolved('storySound only handles SPU kind 5; kind 6 is controller rumble',event);
  const busy=channel=>{const p=this.channels[channel];return (p?.playing&&(p.sequenceEndTime==null||this.context.currentTime<p.sequenceEndTime))||[...this.pending].some(p=>p.channel===channel);};
  if([5,6,7].every(busy))return false;
  const channel=5+this.ring;this.ring=(this.ring+1)%3;
  return this._execute(sound('story0',event.value,channel,{volume:185,pan:event.argument??0}));
 }
}
export default Story1Audio;
