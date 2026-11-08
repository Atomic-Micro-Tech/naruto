import assert from 'node:assert/strict';
import fs from 'node:fs';
import {SequenceClock,SpuEnvelope,pitchRegister,bentPitch,voiceGains,tempoStep,MusicPlayer} from './music-player.mjs';
const index=JSON.parse(fs.readFileSync(new URL('../extracted/music/index.json',import.meta.url)));
assert.equal(pitchRegister(60,0,60,0),4096);
assert.equal(pitchRegister(72,0,60,0),8192);
assert.equal(pitchRegister(48,0,60,0),2048);
assert.equal(pitchRegister(84,0,60,0),16383);
assert.equal(pitchRegister(60,0,60,127),4338);
assert.equal(bentPitch(60,{center:60,shift:0,pitchBend:[12,12]},127),8192);
assert.equal(bentPitch(60,{center:60,shift:0,pitchBend:[12,12]},64),4096);
// Negative bend's asymmetry (+127 fraction after subtracting a semitone) is in _SsVmPBVoice.
assert.equal(bentPitch(60,{center:60,shift:0,pitchBend:[12,12]},0),2047);
assert.equal(tempoStep(480,500000),160);
assert.deepEqual(voiceGains({volume:127},{volume:127,pan:64},{volume:127,pan:64},127,127,64),[1,1]);
assert.deepEqual(voiceGains({volume:127},{volume:127,pan:64},{volume:127,pan:64},127,127,0),[1,0]);
const half=voiceGains({volume:127},{volume:127,pan:64},{volume:127,pan:64},127,127,64,63);assert.deepEqual(half,[4031/16383,4031/16383]);
const seq={ppqn:480,tempo:500000,events:[[0,144,60,127],[16,144,60,0],[32,'end']]};
const clock=new SequenceClock(seq,{loop:false});
assert.deepEqual(clock.nextFrame().map(e=>e.index),[0]);
assert.deepEqual(clock.nextFrame().map(e=>e.index),[1]);
assert.deepEqual(clock.nextFrame().map(e=>e.index),[2]);assert(clock.done);
const loopSeq={ppqn:480,tempo:500000,events:[[0,176,99,20],[1,176,6,127],[10,144,60,127],[480,176,99,30],[481,'end']]};
const looping=new SequenceClock(loopSeq);let loopEvents=[];
while(looping.loops<2)loopEvents.push(...looping.nextFrame());
assert(!looping.done);assert.equal(loopEvents.filter(x=>x.event[1]==='end').length,0);
assert.equal(loopEvents.filter(x=>x.event[2]===60).length,2);
const title=new SequenceClock({ppqn:480,tempo:500000,events:[[0,176,99,20],[1,176,98,127],[480,176,99,30],[481,'end']]});
let titleEvents=[];while(title.loops<1)titleEvents.push(...title.nextFrame());
assert(titleEvents.some(x=>x.event[1]==='end'),'CC98 is not a loop counter');
const immediate=new SpuEnvelope(0x00ff,0xdfc0);immediate.advance(3);assert.equal(immediate.level,32767);immediate.release();immediate.advance(2);assert.equal(immediate.level,0);
const stuck=new SpuEnvelope(0x7fff,0xffff);stuck.advance(44100);assert.equal(stuck.level,0);
// All corpus note events pass through native tone selection. Empty programs/ranges are intentional silence.
let sequences=0,notes=0,sounding=0,silent=0,frames=0;const durations=[];
for(const bank of index.banks){
 const programs=new Map(bank.programs.map(x=>[x.id,x]));
 for(let si=0;si<bank.sequences.length;si++){
  const source=bank.sequences[si],c=new SequenceClock(source,{loop:false}),channels=Array.from({length:16},(_,i)=>i);let seen=0;
  while(!c.done){
   assert(c.frame<60*600,'no finite SEQ may exceed ten minutes');
   for(const {event:e} of c.nextFrame()){
    seen++;if(typeof e[1]!=='number')continue;const ch=e[1]&15,kind=e[1]&240;
    if(kind===192)channels[ch]=e[2];
    if(kind===144&&e[3]>0){
     notes++;const p=programs.get(channels[ch]),tones=(p?.tones||[]).filter(t=>t.minNote<=e[2]&&t.maxNote>=e[2]);
     if(!tones.length){silent++;continue;}
     sounding++;
     for(const t of tones){assert(t.sample);assert(index.samples.some(s=>s.id===t.sample));assert(fs.existsSync(new URL('../extracted/music/samples/'+t.sample+'.wav',import.meta.url)));
      const rate=pitchRegister(e[2],0,t.center,Math.min(127,t.shift));assert(rate>=0&&rate<=16383);
     }
    }
   }
  }
  assert.equal(seen,source.events.length);sequences++;frames+=c.frame;durations.push({bank:bank.id,sequence:si,frames:c.frame,seconds:c.frame/60});
 }
}
assert.equal(sequences,39);assert.equal(notes,23002);assert.equal(sounding,22851);assert.equal(silent,151);
// Minimal AudioContext graph fixture checks lifecycle, controller updates, and mute without clock reset.
class Param{constructor(){this.value=1;this.events=[];}setValueAtTime(v,t){assert(Number.isFinite(v)&&Number.isFinite(t));this.value=v;this.events.push([v,t]);}linearRampToValueAtTime(v,t){this.setValueAtTime(v,t);}}
class Node{constructor(){this.gain=new Param();this.playbackRate=new Param();}connect(){}disconnect(){}start(t){this.started=t;}stop(t){this.stopped=t;}}
const ctx={currentTime:0,destination:new Node(),createGain:()=>new Node(),createBufferSource:()=>new Node(),createChannelMerger:()=>new Node(),decodeAudioData:async()=>({})};
const player=new MusicPlayer(ctx,{index,fetch:async function(){assert.equal(this,globalThis,'Safari fetch requires the global receiver');return {ok:true,arrayBuffer:async()=>new ArrayBuffer(0)};}});
await player.load();assert(await player.play(0,{loop:false}));assert(player.voices.size>0);const active=player.current,frame=player.clock.frame;player.setMuted(true);assert.equal(player.output.gain.value,0);assert.equal(player.current,active);assert.equal(player.clock.frame,frame);player.setMuted(false);assert.equal(player.output.gain.value,100/127);
player.setSequenceVolume(63);assert.equal(player.sequenceVolume,63);const voice=[...player.voices][0];assert(voice.left.gain.value<=.25);player.setSequenceVolume(127,{fadeSeconds:1});assert.equal(player._sequenceAt(0),63);assert.equal(player._sequenceAt(1),127);
ctx.currentTime=2;player._pump();assert.equal(player.unresolved.length,0);player.stop();assert.equal(player.voices.size,0);assert.equal(player.timer,null);
// A cancelled asynchronous play must not start after stop.
const pending=player.play(1);player.stop();assert.equal(await pending,false);
fs.writeFileSync(new URL('../extracted/music/runtime-validation.json',import.meta.url),JSON.stringify({sequences,notes,sounding,silent,frames,durations},null,2)+'\n');
console.log(JSON.stringify({sequences,notes,sounding,silent,frames,pitchAndVolumeFixtures:true,loopAndTempoFixtures:true,envelopeFixtures:true,webAudioLifecycle:true}));
