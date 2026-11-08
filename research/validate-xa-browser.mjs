import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {decodeXA,gameClipId} from './xa-decoder.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const index=JSON.parse(fs.readFileSync(path.join(root,'extracted/xa/browser/index.json'))),manifest=JSON.parse(fs.readFileSync(path.join(root,'extracted/xa/manifest.json')));
let frames=0;
for(const entry of index.clips){
 const source=fs.readFileSync(path.join(root,'extracted/xa/browser',entry.file));const result=decodeXA(source,entry);
 assert.equal(result.frames,entry.frames);assert.equal(result.rate,entry.rate);assert.equal(result.channels,entry.channels);
 const wav=fs.readFileSync(path.join(root,'extracted/xa',manifest.clips.find(c=>c.id===entry.id).wav));
 let offset=12,data;
 while(offset<wav.length){const type=wav.toString('ascii',offset,offset+4),size=wav.readUInt32LE(offset+4);if(type==='data'){data=wav.subarray(offset+8,offset+8+size);break;}offset+=8+size+(size&1);}
 assert(data);const encoded=Buffer.alloc(result.pcm.length*2);for(let i=0;i<result.pcm.length;i++)encoded.writeInt16LE(result.pcm[i],i*2);
 assert(encoded.equals(data),`JS hardware PCM differs from exported WAV: clip${entry.id}`);frames+=result.frames;
}
assert.equal(gameClipId(index.groupTable,0,0,1),0);
assert.throws(()=>decodeXA(new Uint8Array(5)),/whole/);
assert.throws(()=>decodeXA(new Uint8Array(2304),{channels:3}),/Unsupported/);
const report={clips:index.clips.length,pcmFramesCompared:frames,byteExactAgainstExportedHardwareWav:true};
fs.writeFileSync(path.join(root,'extracted/xa/browser/validation.json'),JSON.stringify(report,null,2)+'\n');console.log(report);
