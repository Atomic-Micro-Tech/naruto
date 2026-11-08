// Original, standalone XA-ADPCM codec. No console CPU, game code or emulator.
// Arithmetic matches scripts/xa_decode.c hardware mode (separate truncation).
const COEFFICIENTS=[[0,0],[60,0],[115,-52],[98,-55]];
export function decodeXA(source,{channels=1,bits=4,rate=37800}={}){
 const bytes=source instanceof Uint8Array?source:new Uint8Array(source);
 if(![1,2].includes(channels)||![4,8].includes(bits)||![18900,37800].includes(rate))throw new RangeError('Unsupported XA format');
 if(!bytes.length||bytes.length%2304)throw new RangeError('XA data must contain whole18-group sectors');
 const units=32/bits,pcm=new Int16Array(bytes.length/128*units*28),history=new Int32Array(4);
 for(let start=0,group=0;start<bytes.length;start+=128,group++){
  for(let i=0;i<4;i++)if(bytes[start+i]!==bytes[start+i+4]||bytes[start+i+8]!==bytes[start+i+12])throw new Error(`XA redundant header mismatch at group${group}`);
  for(let unit=0;unit<units;unit++){
   const header=bytes[start+4+unit],predictor=header>>>4;if(predictor>3)throw new Error(`XA predictor${predictor} at group${group}`);
   const shift=(header&15)>12?9:header&15,[a,b]=COEFFICIENTS[predictor],channel=channels===2?unit&1:0;
   let old=history[channel*2],older=history[channel*2+1];
   for(let sample=0;sample<28;sample++){
    let value;
    if(bits===4){value=(bytes[start+16+sample*4+(unit>>>1)]>>>((unit&1)*4))&15;if(value>=8)value-=16;value=(value<<12)>>shift;}
    else{value=bytes[start+16+sample*4+unit];if(value>=128)value-=256;value=(value<<8)>>shift;}
    value+=(old*a>>6)+(older*b>>6);value=Math.max(-32768,Math.min(32767,value));
    const index=group*units*28+(channels===2?(unit>>>1)*56+sample*2+channel:unit*28+sample);
    pcm[index]=value;older=old;old=value;
   }
   history[channel*2]=old;history[channel*2+1]=older;
  }
 }
 return {pcm,channels,rate,frames:pcm.length/channels,duration:pcm.length/channels/rate};
}
export function toAudioBuffer(context,decoded){
 const buffer=context.createBuffer(decoded.channels,decoded.frames,decoded.rate);
 for(let channel=0;channel<decoded.channels;channel++){
  const out=buffer.getChannelData(channel);for(let i=0;i<decoded.frames;i++)out[i]=decoded.pcm[i*decoded.channels+channel]/32768;
 }
 return buffer;
}
export async function loadXA(context,entry,baseURL,{signal}={}){
 if(!entry)throw new Error('Unknown or zero-length XA clip ID');
 const response=await fetch(new URL(entry.file,baseURL),{signal});if(!response.ok)throw new Error(`XA load failed: HTTP${response.status}`);
 const bytes=await response.arrayBuffer();if(bytes.byteLength!==entry.byteLength)throw new Error('Truncated XA asset');
 const decoded=decodeXA(bytes,entry);if(decoded.frames!==entry.frames)throw new Error('XA manifest sample count mismatch');
 return toAudioBuffer(context,decoded);
}
export function gameClipId(groupTable,g,kind,slot){
 const index=(g&255)+(kind&255);if(index>=groupTable.length)throw new RangeError('XA family index out of range');
 return groupTable[index]*16+(slot&255)-1;
}
