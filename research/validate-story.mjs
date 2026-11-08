import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
import {mul12,positionAt,sampleSequence} from './story-scene.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),base=path.join(root,'extracted/story'),index=JSON.parse(fs.readFileSync(path.join(base,'index.json')));
assert.equal(mul12(4096,4096),4096);assert.equal(mul12(-1,1),-1);
assert.deepEqual(positionAt([[0,0,0,0,0,0,0,0],[3,1,-10,10,-10,10,-10,10]],1),[-12288,12288]);
assert.deepEqual(positionAt([[0,0,0,0,0,0,0,10],[10,1,10,0,10,10,10,0]],5),[20480,30720]);
assert.equal(positionAt([[5,0,1,1,1,1,1,1]],4),null);
let frames=0,sprites=0,messages=0,polygons=0;const missing=new Set();
for(const story of index.storyScenes){
 const scene=JSON.parse(fs.readFileSync(path.join(base,`scenes/scene_${story.sceneResourceId}.json`))),assets=JSON.parse(fs.readFileSync(path.join(base,story.sprites)));
 for(let seq=0;seq<scene.tables.sequence.length;seq++){
  const clip=scene.tables.clips[scene.tables.sequence[seq]];
  for(let f=0;f<clip[0];f++){
   const sampled=sampleSequence(scene,seq,f,{messageBase:story.messageBase});frames++;messages+=sampled.messages.length;
   for(const object of sampled.objects){polygons+=object.polygons.length;for(const p of object.polygons){assert(p.vertices.length>=3);assert(p.vertices.every(v=>[v.x,v.y,...v.color].every(Number.isFinite)));assert(p.triangles.every(t=>t.every(i=>i>=0&&i<p.vertices.length)));}for(const s of object.sprites){sprites++;assert([s.x,s.y,s.scaleX,s.scaleY,...s.color].every(Number.isFinite));const asset=assets.sprites[s.spriteId],file=asset?.paletteVariants[String(s.palette)];if(!file)missing.add(`${story.sceneResourceId}:${s.spriteId}:${s.palette}`);else assert(fs.existsSync(path.join(base,path.dirname(story.sprites),file)));}}
  }
 }
}
assert.equal(missing.size,0,`Missing selected sprite variants: ${[...missing]}`);
const first=index.campaign[0].scenes[0];assert.equal(first.voices.length,60);assert.equal(first.voices[0].xaId,0);assert.equal(first.voices[59].xaId,59);
const firstStory=index.storyScenes.find(s=>s.outcome===0&&s.sceneId===0),firstText=firstStory.timeline[0].events.find(e=>e.kind==='message');assert.equal(firstText.frame,31);assert.equal(firstText.messageId,1664);
const report={sceneTables:index.sceneResources.length,storyAssetSets:index.storyScenes.length,sampledLogicalFrames:frames,spriteInstancesChecked:sprites,textInstancesChecked:messages,implementedPolygonGroups:polygons,missingSpritePaletteVariants:[...missing],scope:'Static tables, references and sampler invariants; no original console trace or complete scheduler comparison.'};
fs.writeFileSync(path.join(base,'validation.json'),JSON.stringify(report,null,2)+'\n');console.log(report);
