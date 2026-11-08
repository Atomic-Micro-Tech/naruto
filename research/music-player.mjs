/** Native SEQ/VAB sample player. No CPU, console runtime, synthesized instruments or ROM execution.
 * Source and fidelity limits: music-player.md. */
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const int=Math.trunc;
// Original SsPitchFromNote lookup tables, EXE 0x8006d53c and 0x8006d554.
const SEMITONES=[32768,34716,36780,38967,41285,43740,46340,49096,52015,55108,58385,61857];
const FINETUNE=[32768,32782,32797,32812,32827,32842,32856,32871,32886,32901,32916,32931,32945,32960,32975,32990,33005,33020,33035,33050,33065,33080,33094,33109,33124,33139,33154,33169,33184,33199,33214,33229,33244,33259,33274,33289,33304,33319,33334,33349,33364,33379,33394,33410,33425,33440,33455,33470,33485,33500,33515,33530,33546,33561,33576,33591,33606,33621,33636,33652,33667,33682,33697,33712,33728,33743,33758,33773,33789,33804,33819,33834,33850,33865,33880,33896,33911,33926,33941,33957,33972,33987,34003,34018,34033,34049,34064,34080,34095,34110,34126,34141,34157,34172,34187,34203,34218,34234,34249,34265,34280,34296,34311,34327,34342,34358,34373,34389,34404,34420,34435,34451,34466,34482,34497,34513,34528,34544,34560,34575,34591,34606,34622,34638,34653,34669,34685,34700];
export function pitchRegister(note,fine,center,shift){
  const total=fine+shift, semitone=note+Math.floor(total/128)-center;
  const fraction=((total%128)+128)%128, octave=Math.floor(semitone/12)-2;
  if(octave>=0)return 0x3fff;
  const product=Math.floor(SEMITONES[((semitone%12)+12)%12]*FINETUNE[fraction]/65536);
  return Math.floor((product+2**(-octave-1))/2**(-octave));
}
export function bentPitch(note,tone,bend=64){
  const d=bend-64;let n=note,fine=0;
  if(d>0){const x=d*tone.pitchBend[1];n+=int(x/63);fine=(x%63)*2;}
  if(d<0){const x=d*tone.pitchBend[0],whole=int(x/64);n+=whole-1;fine=(x-whole*64)*2+127;}
  return pitchRegister(n,fine,tone.center,tone.shift);
}
export function voiceGains(bank,program,tone,velocity,channelVolume,channelPan,sequenceVolume=127){
  const v=int(velocity*channelVolume/127);
  let left=int(int(v*bank.volume*16383/16129)*program.volume*tone.volume/16129);
  const levels=Array.isArray(sequenceVolume)?sequenceVolume:[sequenceVolume,sequenceVolume];
  let right=int(left*levels[1]/127);left=int(left*levels[0]/127);
  for(const pan of [tone.pan,program.pan,channelPan]){
    if(pan<64)right=int(right*pan/63);else left=int(left*(127-pan)/63);
  }
  // PsyQ squares the final voice volumes for sequence playback.
  return [int(left*left/16383)/16383,int(right*right/16383)/16383];
}
export function tempoStep(ppqn,microseconds,{initial=false,tickRate=60}={}){
  if(!(microseconds>0&&ppqn>0))throw Error('Invalid SEQ tempo');
  let bpm=int(60000000/microseconds);
  if(initial&&60000000%microseconds>microseconds/2)bpm++;
  const numerator=ppqn*bpm*10,denominator=tickRate*60;
  if(numerator<denominator)throw Error('Low-PPQN SEQ slow-counter mode is not implemented');
  return int(numerator/denominator)+(numerator%denominator>tickRate*30?1:0);
}
/** Original 60Hz _SsSeqPlay countdown, including tempo rounding and NRPN loops. */
export class SequenceClock{
  constructor(sequence,{loop=true,tickRate=60}={}){
    this.sequence=sequence;this.loop=loop;this.tickRate=tickRate;this.frame=0;this.index=0;
    this.step=tempoStep(sequence.ppqn,sequence.tempo,{initial:true,tickRate});
    this.remaining=(sequence.events[0]?.[0]||0)*10;this.done=false;this.loops=0;
    this.loopStart=0;this.loopCount=0;this.loopArmed=false;this.loopActive=false;
  }
  nextFrame(){
    if(this.done)return [];
    const out=[],time=this.frame++/this.tickRate;
    if(this.remaining>this.step){this.remaining-=this.step;return out;}
    let elapsed=this.remaining,guard=0;
    do{
      let delay;
      do{
        if(++guard>100000)throw Error('SEQ has a zero-duration control loop');
        const i=this.index,event=this.sequence.events[i];
        if(!event){this.done=true;return out;}
        out.push({time,frame:this.frame-1,index:i,event});this.index++;
        delay=((this.sequence.events[this.index]?.[0]??event[0])-event[0])*10;
        if(event[1]==='tempo')this.step=tempoStep(this.sequence.ppqn,event[2],{tickRate:this.tickRate});
        if(typeof event[1]==='number'&&(event[1]&240)===176){
          if(event[2]===99&&event[3]===20){this.loopStart=this.index;this.loopArmed=true;}
          else if(event[2]===6&&this.loopArmed&&!this.loopActive){this.loopCount=event[3];this.loopArmed=false;this.loopActive=true;}
          else if(event[2]===98&&!this.loopArmed){/* No loop count in CC98: original ignores it. */}
          else if(event[2]===99&&event[3]===30){
            if(this.loopCount===0)this.loopActive=false;
            else if(this.loopCount>=127){if(this.loop){this.index=this.loopStart;delay=0;this.loops++;}}
            else{this.loopCount--;if(this.loopCount===0)this.loopActive=false;else if(this.loop){this.index=this.loopStart;this.loops++;}}
          }
        }
        if(event[1]==='end'){
          if(this.loop){this.index=0;delay=0;this.loopArmed=false;this.loops++;}
          else{this.done=true;return out;}
        }
      }while(delay===0);
      elapsed+=delay;
    }while(elapsed<this.step);
    this.remaining=elapsed-this.step;return out;
  }
}
/** Register-driven ADSR amplitude model at 44.1kHz; WebAudio ramps approximate between sampled points. */
export class SpuEnvelope{
  constructor(adsr1,adsr2){this.a=adsr1;this.b=adsr2;this.phase=0;this.level=0;this.counter=0;this.samples=0;}
  release(){if(this.phase<3){this.phase=3;this.counter=0;}}
  advance(count){
    let left=Math.max(0,int(count));this.samples+=left;
    while(left>0&&this.phase<4){
      const p=this.phase,a=this.a,b=this.b;
      let shift,stepIndex,decrease,exponential,allBits;
      if(p===0){shift=(a>>10)&31;stepIndex=(a>>8)&3;decrease=false;exponential=!!(a&32768);allBits=((a>>8)&127)===127;}
      else if(p===1){shift=(a>>4)&15;stepIndex=0;decrease=true;exponential=true;allBits=false;}
      else if(p===2){shift=(b>>8)&31;stepIndex=(b>>6)&3;decrease=!!(b&16384);exponential=!!(b&32768);allBits=((b>>6)&127)===127;}
      else{shift=b&31;stepIndex=0;decrease=true;exponential=!!(b&32);allBits=shift===31;}
      let step=(decrease?-(8-stepIndex):7-stepIndex)*2**Math.max(0,11-shift);
      let increment=32768>>Math.max(0,shift-11);
      if(exponential&&!decrease&&this.level>24576){
        if(shift<10)step>>=2;else if(shift>=11)increment>>=2;else{step>>=1;increment>>=1;}
      }else if(exponential&&decrease)step=Math.floor(step*this.level/32768);
      if(!allBits)increment=Math.max(1,increment);
      if(!increment){left=0;break;}
      const ticks=Math.ceil((32768-this.counter)/increment);
      if(ticks>left){this.counter+=left*increment;left=0;break;}
      left-=ticks;this.counter=0;this.level=clamp(this.level+step,0,32767);
      if(p===0&&this.level===32767){this.phase=1;this.counter=0;}
      else if(p===1&&this.level<=Math.min(32767,((a&15)+1)*2048)){this.phase=2;this.counter=0;}
      else if(p===3&&this.level===0){this.phase=4;}
      // Fixed sustain level can skip the remainder without millions of zero steps.
      else if(p===2&&((this.level===0&&decrease)||(this.level===32767&&!decrease))){left=0;}
    }
    return this.level/32767;
  }
}

export class MusicPlayer{
  constructor(context,{baseURL='./assets/music/',index=null,destination=context.destination,fetch:fetcher=globalThis.fetch,volume=100/127,lookahead=.15,onEvent=null}={}){
    this.context=context;this.baseURL=baseURL.endsWith('/')?baseURL:baseURL+'/';this.index=index;this.fetch=fetcher.bind(globalThis);
    this.output=context.createGain();this.output.gain.value=volume;this.output.connect(destination);
    this.volume=volume;this.sequenceVolume=127;this.sequenceFade=null;this.muted=false;this.lookahead=lookahead;this.onEvent=onEvent;
    this.buffers=new Map();this.voices=new Set();this.unresolved=[];this._diagnostics=new Set();this.generation=0;this.timer=null;
  }
  async load(){
    if(!this._load)this._load=(async()=>{
      if(!this.index){const r=await this.fetch(this.baseURL+'index.json');if(!r.ok)throw Error('Music index HTTP '+r.status);this.index=await r.json();}
      this.banks=new Map(this.index.banks.map(b=>[String(b.id),b]));this.samples=new Map(this.index.samples.map(s=>[s.id,s]));return this;
    })();return this._load;
  }
  async _buffer(id){
    if(!this.buffers.has(id))this.buffers.set(id,(async()=>{
      const r=await this.fetch(this.baseURL+'samples/'+id+'.wav');if(!r.ok)throw Error('Music sample HTTP '+r.status+': '+id);
      return this.context.decodeAudioData(await r.arrayBuffer());
    })());return this.buffers.get(id);
  }
  async preload(id){
    await this.load();const bank=this.banks.get(String(id));if(!bank)throw Error('Unknown original music bank '+id);
    await Promise.all([...new Set(bank.programs.flatMap(p=>p.tones.map(t=>t.sample)).filter(Boolean))].map(k=>this._buffer(k)));return this;
  }
  async play(id,{sequence=0,loop=true}={}){
    this.stop();const token=this.generation;await this.load();if(token!==this.generation)return false;
    const original=this.banks.get(String(id));if(!original)throw Error('Unknown original music bank '+id);
    if(!original.sequences[sequence])throw Error('Unknown SEQ '+sequence+' in bank '+id);
    const sampleIDs=[...new Set(original.programs.flatMap(p=>p.tones.map(t=>t.sample)).filter(Boolean))];
    const decoded=await Promise.all(sampleIDs.map(async k=>[k,await this._buffer(k)]));if(token!==this.generation)return false;
    this.bank=structuredClone(original);this.programs=new Map(this.bank.programs.map(p=>[p.id,p]));this.decoded=new Map(decoded);
    this.channels=Array.from({length:16},(_,i)=>({program:i,volume:127,pan:64}));
    this.nrpn={high:0,low:0,count:0,rpnHigh:0,rpnLow:0,rpnCount:0};
    this.clock=new SequenceClock(this.bank.sequences[sequence],{loop});this.startTime=this.context.currentTime+.025;
    this.current={id,sequence,loop};this.sequenceEndTime=null;this.playing=true;this.unresolved=[];this._diagnostics.clear();
    this._pump();this.timer=setInterval(()=>this._pump(),25);return true;
  }
  stop(){
    this.generation++;if(this.timer!==null)clearInterval(this.timer);this.timer=null;this.playing=false;this.clock=null;this.current=null;this.sequenceEndTime=null;
    for(const v of this.voices){try{v.source.stop();}catch{}this._disconnect(v);}this.voices.clear();
  }
  setMuted(value){this.muted=!!value;this.setVolume(this.volume);}
  setVolume(value,{fadeSeconds=0}={}){
    this.volume=clamp(value,0,1);const gain=this.output.gain,now=this.context.currentTime;
    if(gain.cancelAndHoldAtTime)gain.cancelAndHoldAtTime(now);
    else if(gain.cancelScheduledValues)gain.cancelScheduledValues(now);
    const target=this.muted?0:this.volume;
    if(fadeSeconds>0)gain.linearRampToValueAtTime(target,now+fadeSeconds);else gain.setValueAtTime(target,now);
  }
  setSequenceVolume(raw,{fadeSeconds=0}={}){
    const now=this.context.currentTime,from=this._sequenceAt(now),to=clamp(int(raw),0,127);
    this.sequenceStereo=null;this.sequenceVolume=to;this.sequenceFade=fadeSeconds>0?{start:now,end:now+fadeSeconds,from,to}:null;
    for(const v of this.voices)this._refreshVolume(v,now);
  }
  setSequenceStereoVolume(left,right){
    this.sequenceStereo=[clamp(int(left),0,127),clamp(int(right),0,127)];this.sequenceFade=null;
    for(const v of this.voices)this._refreshVolume(v,this.context.currentTime);
  }
  _sequenceAt(time){
    const f=this.sequenceFade;if(!f)return this.sequenceVolume;
    if(time<=f.start)return f.from;if(time>=f.end)return f.to;
    const steps=Math.max(1,Math.round((f.end-f.start)*60)),n=Math.min(steps,Math.floor((time-f.start)*60+1e-7));
    return f.to-int((f.to-f.from)*(steps-n)/steps);
  }
  dispose(){this.stop();this.output.disconnect();}
  _report(kind,details={}){const key=JSON.stringify([kind,details]);if(!this._diagnostics.has(key)){this._diagnostics.add(key);this.unresolved.push({kind,...details});}}
  _pump(){
    if(!this.clock)return;
    const horizon=this.context.currentTime+this.lookahead;let guard=0;
    while(!this.clock.done&&this.startTime+this.clock.frame/60<=horizon){
      if(++guard>36000){this._report('scheduler-backlog');break;}
      for(const item of this.clock.nextFrame())this._event(item.event,this.startTime+item.time,item);
    }
    for(const v of this.voices)this._envelopeUntil(v,horizon);
    if(this.clock.done&&this.voices.size===0){this.playing=false;clearInterval(this.timer);this.timer=null;}
  }
  _event(e,time,item){
    this.onEvent?.({...item,audioTime:time});
    if(e[1]==='end'){if(this.clock.done){this.sequenceEndTime=time;for(const v of this.voices)this._release(v,time);}return;}
    if(e[1]==='tempo')return;
    const kind=e[1]&240,ch=e[1]&15,c=this.channels[ch],p=this.programs.get(c.program);
    if(kind===192){c.program=e[2];return;}
    if(kind===144&&e[3]>0){this._noteOn(ch,e[2],e[3],time);return;}
    if(kind===128||(kind===144&&e[3]===0)){
      // Original key-off matches sequence/VAB/program/note, not MIDI channel.
      for(const v of this.voices)if(v.program.id===c.program&&v.note===e[2])this._release(v,time);return;
    }
    if(kind===224){for(const v of this.voices)if(v.program.id===c.program)v.source.playbackRate.setValueAtTime(bentPitch(v.note,v.tone,e[3])/4096,time);return;}
    if(kind!==176){this._report('event',{status:e[1]});return;}
    const cc=e[2],value=e[3],n=this.nrpn;
    if(cc===7||cc===10||cc===11){
      if(cc===11&&p)p.volume=value;
      // SetVol affects all active voices of this program, using the sending channel values.
      const volume=cc===7?value:c.volume,pan=cc===10?value:c.pan;
      for(const v of this.voices)if(v.program.id===c.program)this._volume(v,Math.max(1,volume),Math.max(1,pan),time);
      if(cc===7)c.volume=value;if(cc===10)c.pan=value;return;
    }
    if(cc===99){n.high=value;if(![20,30].includes(value))n.count++;return;}
    if(cc===98){if(![20,30,40].includes(n.high)){n.low=value;n.count++;}return;}
    if(cc===101){n.rpnHigh=value;n.rpnCount++;return;}
    if(cc===100){n.rpnLow=value;n.rpnCount++;return;}
    if(cc===6){
      if(n.high===20)return; // SequenceClock handles repeat count.
      if(n.rpnCount===2&&n.rpnHigh===0&&n.rpnLow===0&&p){for(const t of p.tones)t.pitchBend=[value,value];n.rpnCount=0;return;}
      if(n.count===2){
        if(n.low===15){if(value<=9)this._report('hardware-reverb-type',{value});} // >9 rejected by original.
        else if(n.low===16)this._report('hardware-reverb-depth',{value});
        else this._report('vab-attribute',{attribute:n.low,tone:n.high,value});
        n.count=0;
      }
      return;
    }
    if(cc===91){this._report('hardware-reverb-depth',{value});return;}
    if(cc===121){c.program=ch;c.volume=127;c.pan=64;for(const v of this.voices)this._release(v,time);return;}
    this._report('controller',{cc,value});
  }
  _noteOn(channel,note,velocity,time){
    const c=this.channels[channel],program=this.programs.get(c.program);
    if(!program){return;} // Empty VAB program: original creates no voice.
    for(const tone of program.tones){
      if(note<tone.minNote||note>tone.maxNote)continue;
      const buffer=this.decoded.get(tone.sample),sample=this.samples.get(tone.sample);
      if(!buffer||!sample){this._report('missing-sample',{sample:tone.sample});continue;}
      const source=this.context.createBufferSource(),envelope=this.context.createGain(),left=this.context.createGain(),right=this.context.createGain(),merger=this.context.createChannelMerger(2);
      source.buffer=buffer;source.playbackRate.setValueAtTime(pitchRegister(note,0,tone.center,Math.min(127,tone.shift))/4096,time);
      source.loop=!!sample.loop_repeat;if(source.loop){source.loopStart=sample.loop_start_sample/sample.sample_rate;source.loopEnd=sample.loop_end_sample/sample.sample_rate;}
      envelope.gain.setValueAtTime(0,time);source.connect(envelope);envelope.connect(left);envelope.connect(right);left.connect(merger,0,0);right.connect(merger,0,1);merger.connect(this.output);
      const v={source,envelope,left,right,merger,tone,program,note,velocity,channel,start:time,envelopeTime:time,envelopeSamples:0,model:new SpuEnvelope(tone.adsr1,tone.adsr2),released:false,ended:false,volumeEvents:[]};
      this.voices.add(v);this._volume(v,c.volume,c.pan,time);source.onended=()=>{v.ended=true;this.voices.delete(v);this._disconnect(v);};source.start(time);
    }
  }
  _volume(v,volume,pan,time){
    v.volumeEvents.push({time,volume,pan,programVolume:v.program.volume});this._refreshVolume(v,time);
  }
  _refreshVolume(v,from){
    if(v.ended||!v.volumeEvents.length)return;from=Math.max(from,v.start);
    for(const p of [v.left.gain,v.right.gain])p.cancelScheduledValues?.(from);
    const times=new Set([from]);
    for(const e of v.volumeEvents)if(e.time>=from)times.add(e.time);
    const f=this.sequenceFade;
    if(f&&f.end>=from){
      for(let i=Math.max(0,Math.ceil((from-f.start)*60));f.start+i/60<f.end;i++)times.add(f.start+i/60);
      times.add(f.end);
    }
    let current=v.volumeEvents[0],i=0;
    for(const time of [...times].sort((a,b)=>a-b)){
      while(i<v.volumeEvents.length&&v.volumeEvents[i].time<=time+1e-9)current=v.volumeEvents[i++];
      const program={...v.program,volume:current.programVolume};
      const [l,r]=voiceGains(this.bank,program,v.tone,v.velocity,current.volume,current.pan,this.sequenceStereo??this._sequenceAt(time));
      v.left.gain.setValueAtTime(l,time);v.right.gain.setValueAtTime(r,time);
    }
  }
  _envelopeUntil(v,time){
    if(v.ended||v.model.phase===4)return;
    // Dense around initial attack, then 4ms ramps. The envelope model itself uses 44.1kHz integer cycles.
    while(v.envelopeTime<time-1e-9){
      const step=v.envelopeSamples<441?.00025:.004;
      const end=Math.min(time,v.envelopeTime+step),samples=Math.floor((end-v.start)*44100+1e-7);
      const level=v.model.advance(samples-v.envelopeSamples);v.envelopeSamples=samples;v.envelopeTime=end;
      v.envelope.gain.linearRampToValueAtTime(level,end);
      if(v.model.phase===4){v.source.stop(end);break;}
    }
  }
  _release(v,time){if(v.released||v.ended)return;this._envelopeUntil(v,time);v.model.release();v.released=true;}
  _disconnect(v){for(const n of [v.source,v.envelope,v.left,v.right,v.merger])try{n.disconnect();}catch{}}
}
export default MusicPlayer;
