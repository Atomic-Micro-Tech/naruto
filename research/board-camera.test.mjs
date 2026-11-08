import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createBoardCamera,cameraPixels,worldToScreen,boardImageDraw,scrollBoardCamera,beginCameraPan,stepCameraPan,beginCameraFollow,stepCameraFollow,boardWalkPlan,boardHudPositions}from'./board-camera.mjs';
const FP=65536;
test('original320×240 centered crop keeps race map at native scale',()=>{
 const c=createBoardCamera({width:384,height:784});assert.deepEqual(cameraPixels(c),{x:32,y:272});
 assert.deepEqual(boardImageDraw(c),{x:-32,y:-272,width:384,height:784,clip:[0,0,320,240]});
 assert.deepEqual(worldToScreen(c,{x:192,y:392}),{x:160,y:120});
 assert.deepEqual(cameraPixels(createBoardCamera({width:640,height:480})),{x:160,y:120});
});
test('strict far edges reject whole steps; negative edge zero is allowed',()=>{
 let c=createBoardCamera({width:384,height:784,x:58,y:538});
 c=scrollBoardCamera(c,{direction:5,stepX16:6*FP,stepY16:6*FP});assert.deepEqual(cameraPixels(c),{x:58,y:538});assert.equal(c.blocked,5);
 c=scrollBoardCamera({...c,x16:6*FP,y16:6*FP},{direction:10,stepX16:6*FP,stepY16:6*FP});assert.deepEqual(cameraPixels(c),{x:0,y:0});assert.equal(c.blocked,0);
 c=scrollBoardCamera(c,{direction:10,stepX16:6*FP,stepY16:6*FP});assert.equal(c.blocked,10);
});
test('native minimum scrolling speed and fixedpoint raster coordinate',()=>{
 let c=createBoardCamera({width:640,height:480,x:10,y:10});
 c=scrollBoardCamera(c,{direction:1,stepX16:FP/2});assert.equal(c.x16,10*FP);
 c=scrollBoardCamera(c,{direction:1,stepX16:2*FP+123});assert.equal(c.x16,14*FP);
 c=scrollBoardCamera(c,{direction:1,stepX16:4*FP+123});assert.equal(c.x16,18*FP+123);
 assert.equal(worldToScreen(c,{x:100,y:100}).x,82);
});
test('turn recenter moves6px per frame and preserves truncation remainder',()=>{
 let c=beginCameraPan(createBoardCamera({width:640,height:480,x:100,y:100}),{x:285,y:201});
 assert.deepEqual(c.pan,{remainingX:4,remainingY:3,directionX:1,directionY:8});
 assert.equal(stepCameraPan(c,{pendingChakra:true}),c);
 c=stepCameraPan(c);assert.deepEqual(cameraPixels(c),{x:106,y:94});
 for(let i=0;i<3;i++)c=stepCameraPan(c);assert.equal(c.pan,null);assert.deepEqual(cameraPixels(c),{x:124,y:82});
});
test('actual race start camera pans to bounded tile view, preserving6px grid',()=>{
 const maps=JSON.parse(fs.readFileSync(new URL('./maps.json',import.meta.url)));
 for(const [mapId,startId]of [[16,18],[17,20]]){
  const tile=maps[mapId].tiles[startId];let c=beginCameraPan(createBoardCamera({width:384,height:784}),tile),frames=0;
  while(c.pan&&frames<100){c=stepCameraPan(c);frames++;}
  assert.equal(c.pan,null);assert.equal(frames,mapId===16?45:46);const p=cameraPixels(c),s=worldToScreen(c,tile);
  assert.deepEqual(p,{x:2,y:542});assert.deepEqual(s,{x:158,y:mapId===16?121:153});
  assert.ok(p.x>=0&&p.x+320<384);assert.ok(p.y>=0&&p.y+240<784);assert.ok(s.x>=0&&s.x<320&&s.y>=0&&s.y<240);
 }
});
test('walking follow waits for center crossing, then follows active directions',()=>{
 const velocity={x16:4*FP,y16:0};let c=createBoardCamera({width:640,height:480,x:0,y:0});
 c=beginCameraFollow(c,{position:{x:150,y:120},velocity});assert.equal(c.followLatch,0);
 c=stepCameraFollow(c,{position:{x:158,y:120},velocity,direction:1});assert.equal(c.x16,0);
 c=stepCameraFollow(c,{position:{x:162,y:120},velocity,direction:1});assert.equal(c.x16,4*FP);
 c=stepCameraFollow(c,{position:{x:166,y:120},velocity,direction:1,disabled:true});assert.equal(c.x16,4*FP);
});
test('walk segment duration matches source4/6pixel axis synchronization',()=>{
 const from={x:0,y:0},to={x:32,y:12};let p=boardWalkPlan(from,to);assert.equal(p.frames,8);assert.equal(p.xFrames,8);assert.equal(p.yFrames,8);assert.deepEqual(p.velocity,{x16:4*FP,y16:1.5*FP});
 p=boardWalkPlan(from,to,{actorFlags:256});assert.equal(p.frames,5);assert.equal(p.velocity.x16,419430);assert.equal(p.velocity.y16,157286);
 assert.equal(boardWalkPlan(from,to,{inputMask:64}).speed,6);assert.equal(boardWalkPlan(from,to,{statusFlags:32}).speed,6);
});
test('zoom preserves source screen center and topHUD stays unscaled',()=>{
 const c=createBoardCamera({width:640,height:480,x:160,y:120,zoom16:FP/2});assert.deepEqual(worldToScreen(c,{x:400,y:300}),{x:200,y:150});
 assert.deepEqual(boardHudPositions(2,0).origin,{x:88,y:16});assert.deepEqual(boardHudPositions(2,1).origin,{x:160,y:16});
 assert.deepEqual(boardHudPositions(4,0).face,{x:16,y:16});assert.deepEqual(boardHudPositions(4,3).chakra,{x:264,y:32});
});
