import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Story1Audio,nativePan,resolveEvent} from './story1-audio.mjs';
import {MusicPlayer,SequenceClock,voiceGains} from './music-player.mjs';
const root=new URL('../',import.meta.url),index=JSON.parse(fs.readFileSync(new URL('extracted/story1-audio/index.json',root))),mapping=JSON.parse(fs.readFileSync(new URL('research/story1-audio.json',root)));
assert.deepEqual(nativePan(180,0),[90,90]);assert.deepEqual(nativePan(185,-128),[92,0]);assert.deepEqual(nativePan(185,127),[0,92]);assert.deepEqual(nativePan(180,64),[45,90]);
assert.deepEqual(voiceGains({volume:127},{volume:127,pan:64},{volume:127,pan:64},127,127,64,[127,0]),[1,0]);
assert.equal(resolveEvent('walk').sequence,8);assert.equal(resolveEvent('walk',{fast:true}).sequence,10);assert.equal(resolveEvent('walk',{jump:true,suppressNormalSound:true}).sequence,12);assert(resolveEvent('walk',{suppressNormalSound:true}).silent);
assert.equal(resolveEvent('stop',{side:1}).pan,-64);assert.equal(resolveEvent('roll-impact',{hammerX:121}).pan,-19);
assert(resolveEvent('claim').unresolved);assert(resolveEvent('upgrade').unresolved);assert(resolveEvent('pay').unresolved);assert(resolveEvent('battle-result',{phase:'music'}).unresolved);
assert.equal(resolveEvent('battle-result',{phase:'music',defenderHpZero:true}).music.id,24);assert.equal(resolveEvent('battle-result',{phase:'music',defenderHpZero:false}).music.id,25);
let sequences=0,notes=0;
for(const b of index.banks){const programs=new Map(b.programs.map(p=>[p.id,p]));for(const seq of b.sequences){sequences++;const c=new SequenceClock(seq,{loop:false}),channels=Array.from({length:16},(_,i)=>i);while(!c.done){assert(c.frame<36000);for(const {event:e} of c.nextFrame()){if(typeof e[1]!=='number')continue;const kind=e[1]&240,ch=e[1]&15;if(kind===192)channels[ch]=e[2];if(kind===144&&e[3]>0){notes++;for(const t of programs.get(channels[ch])?.tones??[]){if(e[2]<t.minNote||e[2]>t.maxNote)continue;assert(t.sample);assert(index.samples.some(s=>s.id===t.sample));assert(fs.existsSync(new URL(`extracted/story1-audio/samples/${t.sample}.wav`,root)));}}}}}}
assert.equal(sequences,193);assert.equal(mapping.story.scenes[0].sounds.length,82);
for(const [i,e]of mapping.story.scenes[0].sounds.entries()){assert.equal(e.channel,5+i%3);assert(index.banks.find(b=>b.id==='story0').sequences[e.value]);assert(e.argument>=-128&&e.argument<=127);}
class Param{setValueAtTime(v){this.value=v;}}
class Node{constructor(){this.gain=new Param();}connect(){}disconnect(){}}
const ctx={currentTime:0,destination:new Node(),createGain:()=>new Node()};
class FakePlayer{constructor(){this.calls=[];this.playing=false;}async load(){}async preload(id){this.calls.push(['preload',id]);}setSequenceStereoVolume(...v){this.stereo=v;}async play(id,opts){this.calls.push(['play',id,opts]);this.playing=true;return true;}stop(){this.playing=false;}dispose(){}setSequenceVolume(v,opts){this.calls.push(['volume',v,opts]);}}
const music=new FakePlayer(),a=new Story1Audio(ctx,{index,Player:FakePlayer,musicPlayer:music});await a.load();await a.preload();
await a.playEvent('roll');assert.equal(a.channels[0].calls.at(-1)[2].loop,true);assert.deepEqual(a.channels[0].stereo,[90,90]);
await a.playEvent('stop',{side:1});assert.deepEqual(a.channels[1].stereo,[90,45]);
await a.playEvent('roll-freeze');assert.equal(a.channels[0].playing,false);
for(let i=0;i<3;i++)await a.storySound({kind:5,value:i,argument:0});
assert.equal(a.storySound({kind:5,value:3}),false);assert.equal(a.ring,0);
a.channels[6].playing=false;await a.storySound({kind:5,value:3});assert.equal(a.channels[5].calls.at(-1)[2].sequence,3,'native ring overwrites channel5 even when channel6 is free');
assert.deepEqual(a.channels[5].stereo,[92,92]);
// Sequencer end releases native busy state even if ADSR tails continue.
for(const p of a.channels.slice(5)){p.playing=true;p.sequenceEndTime=1;}
assert.equal(a.storySound({kind:5,value:4}),false);ctx.currentTime=1;await a.storySound({kind:5,value:4});
a.setMuted(true);assert.equal(a.output.gain.value,0);assert(a.channels[5].playing);a.setMuted(false);
await a.playEvent('battle-start',{phase:'combat-music'});assert.deepEqual(music.calls.at(-1),['play',22,{loop:true}]);
assert(a.storySound({kind:6,value:1}).unresolved);a.stop();assert(a.channels.every(p=>!p.playing));
// Stop while load is pending cannot emit late sound.
const b=new Story1Audio(ctx,{index,Player:FakePlayer});const pending=b.playEvent('roll');b.stop();assert((await pending).cancelled);
// Stereo setter survives play and scalar volume setter removes the stereo override.
const p=new MusicPlayer(ctx,{index});p.setSequenceStereoVolume(90,45);assert.deepEqual(p.sequenceStereo,[90,45]);p.setSequenceVolume(92);assert.equal(p.sequenceStereo,null);p.dispose();a.dispose();b.dispose();
console.log(JSON.stringify({sequences,notes,storySounds:82,originalPan:true,dispatchPhases:true,ringAndBackpressure:true,muteAndCancellation:true}));
