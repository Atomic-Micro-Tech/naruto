import assert from 'node:assert/strict';import{StoryRenderer,blend5}from'./story-renderer.mjs';
assert.equal(blend5(31,31,1),30);assert.equal(blend5(25,10,2),31);assert.equal(blend5(5,20,3),0);assert.equal(blend5(10,15,4),13);
function canvas(w,h){const context={createImageData(){return {width:w,height:h,data:new Uint8ClampedArray(w*h*4)};},putImageData(image){this.image=image;}};return {width:w,height:h,getContext(){return context;},context};}
const image={width:2,height:1,data:new Uint8ClampedArray([248,0,0,255,0,248,0,255])},c=canvas(2,1),sprites={palettes:[[31,0x8000|31<<5]],sprites:[{paletteVariants:{0:'s'}}]},r=new StoryRenderer(c,{sprites,images:new Map([['s',image]]),atlases:new Map(),background:[0,0,248]});
r.render({sequences:[{sequenceIndex:0,objects:[{layerId:0,sprites:[{spriteId:0,palette:0,x:0,y:0,width:2,height:1,scaleX:4096,scaleY:4096,color:[128,128,128],blend:1,flipBits:0}],polygons:[]}]}],dialogues:[]});
assert.deepEqual([...r.rgb],[31,0,0,0,15,15]); // Only the STP green texel blends.
const q=canvas(4,4),g=new StoryRenderer(q,{sprites:{palettes:[],sprites:[]},images:new Map(),atlases:new Map(),background:[248,0,0]});
const vertices=[{x:0,y:0,color:[0,0,248]},{x:4,y:0,color:[0,0,248]},{x:4,y:4,color:[0,0,248]},{x:0,y:4,color:[0,0,248]}];
g.render({sequences:[{sequenceIndex:0,objects:[{layerId:0,sprites:[],polygons:[{vertices,triangles:[[0,1,2],[0,2,3]],blend:1,drawBeforeSprites:true}]}]}],dialogues:[]});
for(let i=0;i<16;i++)assert.deepEqual([...g.rgb.slice(i*3,i*3+3)],[15,0,15]); // Shared diagonal receives exactly one blend.
console.log('Passed RGB5/STP/modulation and triangle shared-edge fixtures');
