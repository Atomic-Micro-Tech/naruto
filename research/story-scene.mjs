// Data-only scene sampler recovered from STORY_ENGINE.c; no CPU emulation.
// The caller owns text pauses, XA preparation/completion, sequence activation,
// music and SPU playback. This module does not claim to be that scheduler.
const trunc=Math.trunc;
export function mul12(a,b){return (Math.imul(a,b>>12)+(Math.imul(a,b&4095)>>12))|0;}
function keys(scene,layer,name,pair){return scene.tables[name].slice(layer[pair],layer[pair]+layer[pair+1]);}
function interval(values,frame){if(!values.length)return null;let i=0;for(let j=0;j<values.length&&values[j][0]<=frame;j++)i=j;return [values[i],values[i+1],i];}
export function positionAt(values,frame){
 if(!values.length||frame<values[0][0])return null;
 const [a,b]=interval(values,frame);
 if(!b||!b[1]||frame===a[0])return [a[2]<<12,a[3]<<12];
 const elapsed=frame-a[0],span=b[0]-a[0];if(span<=0)throw new Error('Invalid position key span');
 if(a[6]===a[2]&&a[7]===a[3]&&b[4]===b[2]&&b[5]===b[3])return [(a[2]+trunc((b[2]-a[2])*elapsed/span))<<12,(a[3]+trunc((b[3]-a[3])*elapsed/span))<<12];
 const t=trunc(elapsed*4096/span),u=4096-t,uuu=mul12(mul12(u,u),u),ttt=mul12(mul12(t,t),t),ut3=mul12(mul12(u,t),12288),uut3=mul12(u,ut3),utt3=mul12(t,ut3);
 return [0,1].map(k=>(mul12(uuu,a[2+k]<<12)+mul12(uut3,a[6+k]<<12)+mul12(utt3,b[4+k]<<12)+mul12(ttt,b[2+k]<<12))|0);
}
function linearAt(values,frame,defaults,fixed){
 if(!values.length)return defaults;const [a,b]=interval(values,frame);
 const current=defaults.map((_,i)=>fixed?trunc(a[2+i]*4096):a[2+i]);
 if(!b||!b[1]||frame===a[0])return current;
 const t=trunc((frame-a[0])*4096/(b[0]-a[0]));
 return current.map((v,i)=>fixed?v+mul12(t,trunc(Math.fround(Math.fround(b[2+i]*4096)-Math.fround(a[2+i]*4096)))):v+(mul12(t,(b[2+i]-v)<<12)>>12));
}
function state(scene,layer,frame){
 const pair=interval(keys(scene,layer,'events',2),frame);if(!pair||pair[0][1]===-1)return null;
 const position=positionAt(keys(scene,layer,'positions',4),frame);if(!position)return null;
 const event=pair[0],scale=linearAt(keys(scene,layer,'scales',10),frame,[4096,4096],true),color=linearAt(keys(scene,layer,'colors',8),frame,[128,128,128],false);
 const blend=interval(keys(scene,layer,'blends',6),frame)?.[0][1]??0,palette=interval(keys(scene,layer,'palettes',12),frame)?.[0][1];
 return {event,position,scale,color,blend,palette};
}
export function sampleSequence(scene,sequenceIndex,frame,{messageBase=0}={}){
 const t=scene.tables,clipId=t.sequence[sequenceIndex],clip=t.clips[clipId];if(!clip)throw new RangeError('Unknown sequence');
 const result={sequenceIndex,frame,clipId,durationTicks:clip[0],objects:[],messages:[],resetsTextAcknowledgement:false,unresolved:[]};
 for(let lid=clip[2]+clip[3]-1;lid>=clip[2];lid--){
  const layer=t.layers[lid];if(layer[0]>=3)continue;const selected=interval(keys(scene,layer,'events',2),frame)?.[0];if(selected?.[1]===-1&&(selected[2]&4))result.resetsTextAcknowledgement=true;const root=state(scene,layer,frame);if(!root)continue;
  if(root.event[2]&4){result.messages.push({layerId:lid,localId:root.event[1],messageId:messageBase+root.event[1],elapsedTicks:frame-root.event[0],x:root.position[0]>>12,y:root.position[1]>>12});continue;}
  const objectId=root.event[1],object=t.objects[objectId];if(!object){result.unresolved.push({kind:'objectReference',objectId});continue;}
  const child=t.clips[object[0]],local=frame-root.event[0],group={layerId:lid,objectId,childClipId:object[0],localFrame:local,clipBounds:object.slice(1),sprites:[],polygons:[]},polygonGroups=[{kind:1,vertices:[],blend:0},{kind:2,vertices:[],blend:0}];
  for(let sl=child[2]+child[3]-1;sl>=child[2];sl--){
   const l=t.layers[sl];if(l[0]!==0){
    if(l[0]!==1&&l[0]!==2){result.unresolved.push({kind:'unknownChildLayer',layerId:sl,code:l[0]});continue;}
    const pos=positionAt(keys(scene,l,'positions',4),local);if(!pos)continue;
    const pg=polygonGroups[l[0]-1],color=linearAt(keys(scene,l,'colors',8),local,[128,128,128],false);
    const px=(l[0]===2?mul12(root.scale[0],pos[0]):pos[0])+mul12(root.scale[0],root.event[4]<<12)+root.position[0];
    const py=(l[0]===2?mul12(root.scale[1],pos[1]):pos[1])+mul12(root.scale[1],root.event[5]<<12)+root.position[1];
    pg.vertices.push({x:px>>12,y:py>>12,color,layerId:sl});pg.blend=interval(keys(scene,l,'blends',6),local)?.[0][1]??0;continue;
   }
   const s=state(scene,l,local);if(!s)continue;const spriteId=s.event[1],sprite=t.sprites[spriteId];if(!sprite){result.unresolved.push({kind:'spriteReference',spriteId});continue;}
   const x=(mul12(root.scale[0],root.event[4]<<12)+root.position[0]+mul12(root.scale[0],s.position[0]+mul12(s.scale[0],s.event[4]<<12)))>>12;
   const y=(mul12(root.scale[1],root.event[5]<<12)+root.position[1]+mul12(root.scale[1],s.position[1]+mul12(s.scale[1],s.event[5]<<12)))>>12;
   group.sprites.push({layerId:sl,spriteId,palette:s.palette??sprite[1],x,y,width:sprite[4],height:sprite[5],scaleX:mul12(root.scale[0],s.scale[0]),scaleY:mul12(root.scale[1],s.scale[1]),color:s.color,blend:s.blend,flipBits:s.event[2]&3,anchor:[0,0]});
  }
  for(const pg of polygonGroups){if(pg.vertices.length<3)continue;const n=pg.vertices.length;pg.triangles=n===3?[[0,1,2]]:Array.from({length:n-2},(_,i)=>[n-1,i,i+1]);pg.drawBeforeSprites=pg.kind===2;group.polygons.push(pg);}
  if(object[1]){const w=mul12(root.scale[0],(object[4]-object[2])<<12)>>12,h=mul12(root.scale[1],(object[5]-object[3])<<12)>>12;group.clipRect={x:(root.position[0]>>12)-((w-(object[4]-object[2]))>>1)+object[2]+(mul12(root.scale[0],root.event[4]<<12)>>12),y:(root.position[1]>>12)-((h-(object[5]-object[3]))>>1)+object[3]+(mul12(root.scale[1],root.event[5]<<12)>>12),width:w,height:h};}
  result.objects.push(group);
 }
 return result;
}
export function sequenceEvents(scene,sequenceIndex){const c=scene.tables.clips[scene.tables.sequence[sequenceIndex]],out=[];for(let i=c[2];i<c[2]+c[3];i++){const l=scene.tables.layers[i];if(l[0]>=3)for(const e of keys(scene,l,'events',2))out.push({layerId:i,kind:l[0],frame:e[0],value:e[1],arg:e[3]});}return out.sort((a,b)=>a.frame-b.frame||a.layerId-b.layerId);}
