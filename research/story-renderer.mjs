// 320x240 software scene compositor. Uses original sprite PNGs + palette STP.
// RGB5 modulation/blend formulas are explicit; GPU edge/dither equivalence
// still requires hardware reference comparison (see story-runtime.md).
export function blend5(background,foreground,mode){
 switch(mode){case 1:return (background>>1)+(foreground>>1);case 2:return Math.min(31,background+foreground);case 3:return Math.max(0,background-foreground);case 4:return Math.min(31,background+(foreground>>2));default:return foreground;}
}
const clamp5=x=>Math.max(0,Math.min(31,x));
function pixels(image){
 if(image.data&&image.width&&image.height)return image;
 const canvas=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(image.width,image.height):Object.assign(document.createElement('canvas'),{width:image.width,height:image.height});
 const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);return ctx.getImageData(0,0,image.width,image.height);
}
function cross(a,b,x,y){return (b.x-a.x)*(y-a.y)-(b.y-a.y)*(x-a.x);}
function topLeft(a,b){return b.y<a.y||b.y===a.y&&b.x>a.x;}
export class StoryRenderer {
 constructor(canvas,{sprites,images,atlases,icons=new Map(),background=[0,0,0]}={}){
  this.canvas=canvas;this.context=canvas.getContext('2d');this.width=canvas.width;this.height=canvas.height;this.sprites=sprites;this.images=images;this.atlases=atlases;this.icons=icons;this.background=background;this.cache=new Map();this.fontCache=new Map();this.rgb=new Uint8Array(this.width*this.height*3);this.output=this.context.createImageData(this.width,this.height);this.paletteFlags=[];
  for(const words of sprites.palettes){const flags=new Map();for(const word of words){if(!word)continue;const key=word&32767,stp=!!(word&32768);if(flags.has(key)&&flags.get(key)!==stp)throw new Error('Ambiguous STP palette: raw indices required');flags.set(key,stp);}this.paletteFlags.push(flags);}
 }
 _bounds(clip){return {left:Math.max(0,Math.floor(clip?.x??0)),top:Math.max(0,Math.floor(clip?.y??0)),right:Math.min(this.width,Math.ceil(clip?clip.x+clip.width:this.width)),bottom:Math.min(this.height,Math.ceil(clip?clip.y+clip.height:this.height))};}
 _put(x,y,color,blend=0){const i=(y*this.width+x)*3;for(let c=0;c<3;c++)this.rgb[i+c]=blend5(this.rgb[i+c],clamp5(color[c]),blend);}
 _bitmap(bitmap,{x,y,width=bitmap.width,height=bitmap.height,flipBits=0,color=[128,128,128],blend=0,paletteFlags,clip}={}){
  if(!width||!height)return;const bounds=this._bounds(clip),x0=Math.floor(Math.min(x,x+width)),x1=Math.ceil(Math.max(x,x+width)),y0=Math.floor(Math.min(y,y+height)),y1=Math.ceil(Math.max(y,y+height));
  for(let yy=Math.max(y0,bounds.top);yy<Math.min(y1,bounds.bottom);yy++)for(let xx=Math.max(x0,bounds.left);xx<Math.min(x1,bounds.right);xx++){
   let sx=Math.max(0,Math.min(bitmap.width-1,Math.floor((xx-x)/width*bitmap.width))),sy=Math.max(0,Math.min(bitmap.height-1,Math.floor((yy-y)/height*bitmap.height)));if(flipBits&1)sx=bitmap.width-1-sx;if(flipBits&2)sy=bitmap.height-1-sy;
   const p=(sy*bitmap.width+sx)*4;if(!bitmap.data[p+3])continue;const rgb=[bitmap.data[p]>>3,bitmap.data[p+1]>>3,bitmap.data[p+2]>>3],key=rgb[0]|rgb[1]<<5|rgb[2]<<10;
   const mode=blend&&(!paletteFlags||paletteFlags.get(key))?blend:0;
   this._put(xx,yy,rgb.map((v,c)=>clamp5(v*color[c]>>7)),mode);
  }
 }
 _sprite(s,clip){const asset=this.sprites.sprites[s.spriteId],file=asset?.paletteVariants[String(s.palette)];if(!file){this.unresolved.push({kind:'spritePalette',spriteId:s.spriteId,palette:s.palette});return;}
  if(!this.cache.has(file)){const image=this.images.get?.(file)??this.images[file];if(!image){this.unresolved.push({kind:'spriteImage',file});return;}this.cache.set(file,pixels(image));}
  this._bitmap(this.cache.get(file),{...s,width:s.width*s.scaleX/4096,height:s.height*s.scaleY/4096,paletteFlags:this.paletteFlags[s.palette],clip});
 }
 _triangle(vertices,indices,blend,clip){
  let [a,b,c]=indices.map(i=>vertices[i]);let area=cross(a,b,c.x,c.y);if(!area)return;if(area<0){[b,c]=[c,b];area=-area;}
  const box=this._bounds(clip),x0=Math.max(box.left,Math.floor(Math.min(a.x,b.x,c.x))),x1=Math.min(box.right,Math.ceil(Math.max(a.x,b.x,c.x))),y0=Math.max(box.top,Math.floor(Math.min(a.y,b.y,c.y))),y1=Math.min(box.bottom,Math.ceil(Math.max(a.y,b.y,c.y)));
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
   const wa=cross(b,c,x+0.5,y+0.5),wb=cross(c,a,x+0.5,y+0.5),wc=cross(a,b,x+0.5,y+0.5);
   if(wa<0||wb<0||wc<0||wa===0&&!topLeft(b,c)||wb===0&&!topLeft(c,a)||wc===0&&!topLeft(a,b))continue;
   this._put(x,y,[0,1,2].map(k=>Math.floor((a.color[k]*wa+b.color[k]*wb+c.color[k]*wc)/area)>>3),blend);
  }
 }
 _polygon(p,clip){for(const tri of p.triangles)this._triangle(p.vertices,tri,p.blend,clip);}
 _dialogue(d){
  const clip=d.scrolling?{x:0,y:d.clipTop,width:this.width,height:this.height-d.clipTop}:undefined;
  for(const g of d.layout.glyphs){const key=`${g.size}:${g.colorMode}`;if(!this.fontCache.has(key)){const image=this.atlases.get?.(key)??this.atlases[key];if(!image){this.unresolved.push({kind:'fontAtlas',key});continue;}this.fontCache.set(key,pixels(image));}const atlas=this.fontCache.get(key),columns=Math.floor(256/g.size),sx=g.glyphId%columns*g.size,sy=Math.floor(g.glyphId/columns)*g.size,bounds=this._bounds(clip);
   if(sy+g.size>atlas.height){this.unresolved.push({kind:'glyph',glyphId:g.glyphId});continue;}
   for(let y=0;y<g.size;y++)for(let x=0;x<g.size;x++){const xx=g.x+x,yy=g.y+y;if(xx<bounds.left||yy<bounds.top||xx>=bounds.right||yy>=bounds.bottom)continue;const i=((sy+y)*atlas.width+sx+x)*4;if(atlas.data[i+3])this._put(xx,yy,[atlas.data[i]>>3,atlas.data[i+1]>>3,atlas.data[i+2]>>3]);}
  }
  for(const i of d.layout.icons)this._icon(i.icon,i.x,i.y);
  if(d.showContinue)this._icon(0,290,207);
 }
 _icon(id,x,y){y-=1+(Math.floor((this.vblankCount??0)/60)&1);const image=this.icons.get?.(id)??this.icons[id];if(image)this._bitmap(pixels(image),{x,y});else if(!this.unresolved.some(x=>x.kind==='controllerIcon'&&x.id===id))this.unresolved.push({kind:'controllerIcon',id});}
 render(snapshot){
  this.vblankCount=snapshot.vblankCount??0;this.unresolved=[];for(let i=0;i<this.rgb.length;i++)this.rgb[i]=this.background[i%3]>>3;
  for(const sequence of snapshot.sequences){
   const commands=[...sequence.objects.map(o=>({kind:'object',...o})),...snapshot.dialogues.filter(d=>d.sequenceIndex===sequence.sequenceIndex).map(d=>({kind:'text',...d}))].sort((a,b)=>b.layerId-a.layerId);
   for(const command of commands){if(command.kind==='text'){this._dialogue(command);continue;}for(const p of command.polygons.filter(p=>p.drawBeforeSprites))this._polygon(p,command.clipRect);for(const s of command.sprites)this._sprite(s,command.clipRect);for(const p of command.polygons.filter(p=>!p.drawBeforeSprites))this._polygon(p,command.clipRect);}
  }
  for(let i=0;i<this.width*this.height;i++){this.output.data[i*4]=this.rgb[i*3]<<3;this.output.data[i*4+1]=this.rgb[i*3+1]<<3;this.output.data[i*4+2]=this.rgb[i*3+2]<<3;this.output.data[i*4+3]=255;}
  this.context.putImageData(this.output,0,0);return {unresolved:this.unresolved};
 }
}
