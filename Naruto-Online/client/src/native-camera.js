/** Native BOARD camera, from FUN800f64b0 /800f7ed4 /800faac8 /800c0a00.
 * Coordinates are signed16.16, rendered camera coordinates use the high16 bits.
 */
export const BOARD_VIEWPORT=Object.freeze({width:320,height:240,centerX:160,centerY:120});
const FP=65536,hi=x=>Math.floor(x/FP),trunc=Math.trunc;
export function createBoardCamera({width,height,x,y,zoom16=FP}){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<320||height<240)throw new RangeError('Native board image must be at least320×240');
 return {width,height,x16:(x??trunc(width/2)-160)*FP,y16:(y??trunc(height/2)-120)*FP,zoom16,pan:null,followLatch:0,blocked:0};
}
export const cameraPixels=c=>({x:hi(c.x16),y:hi(c.y16)});
export function worldToScreen(c,{x,y},zoom16=c.zoom16){const p=cameraPixels(c);return {x:160+Math.floor((x-p.x-160)*zoom16/FP),y:120+Math.floor((y-p.y-120)*zoom16/FP)};}
export function boardImageDraw(c){const p=cameraPixels(c),z=c.zoom16/FP;return {x:160+(-p.x-160)*z,y:120+(-p.y-120)*z,width:c.width*z,height:c.height*z,clip:[0,0,320,240]};}
/** Source rejects the complete step at a boundary; it does not clamp/snap.
 * Positive edge comparison is strict. Direction: right1,left2,down4,up8.
 * Source suppresses subpixel steps and raises positive1..3px steps to4px.
 */
export function scrollBoardCamera(camera,{direction,stepX16=0,stepY16=0}){
 const c={...camera,blocked:0};if(!direction)return c;
 const speed=v=>hi(v)<1?0:hi(v)<4?4*FP:v;const sx=speed(stepX16),sy=speed(stepY16);
 if(direction&2){const next=c.x16-sx;if(hi(next)<0)c.blocked|=2;else c.x16=next;}
 else if(direction&1){const next=c.x16+sx;if(hi(next)+320<c.width)c.x16=next;else c.blocked|=1;}
 if(direction&8){const next=c.y16-sy;if(hi(next)<0)c.blocked|=8;else c.y16=next;}
 else if(direction&4){const next=c.y16+sy;if(hi(next)+240<c.height)c.y16=next;else c.blocked|=4;}
 return c;
}
/** Target is a source tile/world point. Recenter leaves a <6px remainder. */
export function beginCameraPan(camera,{x,y}){
 const p=cameraPixels(camera),nx=trunc((x-160-p.x)/6),ny=trunc((y-120-p.y)/6);
 return {...camera,pan:nx||ny?{remainingX:Math.abs(nx),remainingY:Math.abs(ny),directionX:nx<0?2:1,directionY:ny<0?8:4}:null};
}
/** Called once per original update (NTSC frame). Chakra interpolation blocks
 * this update until all four original pending chakra deltas reach zero.
 */
export function stepCameraPan(camera,{pendingChakra=false}={}){
 if(!camera.pan||pendingChakra)return camera;
 const pan={...camera.pan};let direction=0;
 if(pan.remainingY){pan.remainingY--;direction=pan.directionY;}
 if(pan.remainingX){pan.remainingX--;direction|=pan.directionX;}
 const c=scrollBoardCamera(camera,{direction,stepX16:6*FP,stepY16:6*FP});
 // Preserve exact equality tests, including source combined-block behavior.
 if(c.blocked===8||c.blocked===4)pan.remainingY=0;
 if(c.blocked===1||c.blocked===2)pan.remainingX=0;
 c.pan=pan.remainingX||pan.remainingY?pan:null;return c;
}
function followLatch(camera,position,velocity,latch){
 const p=cameraPixels(camera),sx=position.x-p.x,sy=position.y-p.y;
 if((velocity.x16<0&&sx<161)||(velocity.x16>0&&sx>159))latch=1;
 if((velocity.y16<0&&sy<121)||(velocity.y16>0&&sy>119))latch|=2;
 return latch;
}
export function beginCameraFollow(camera,{position,velocity}){return {...camera,followLatch:followLatch(camera,position,velocity,0)};}
/** Feed the new integer rendered actor position after a walk step. Source's
 * latch is only an on/off gate: it deliberately does not mask movement axes.
 */
export function stepCameraFollow(camera,{position,velocity,direction,disabled=false}){
 const latch=followLatch(camera,position,velocity,camera.followLatch);
 let c={...camera,followLatch:latch};
 if(latch&&!disabled)c=scrollBoardCamera(c,{direction,stepX16:Math.abs(velocity.x16),stepY16:Math.abs(velocity.y16)});
 return c;
}
/** Source walking segment timing for ordinary world-coordinate movement.
 * Animation/jump vertical offsets are separate and not synthesized here.
 */
export function boardWalkPlan(from,to,{actorFlags=0,statusFlags=0,inputMask=0,forcedFast=false}={}){
 const speed=!forcedFast&&!(actorFlags&256)&&!(statusFlags&32)&&!(inputMask&64)?4:6;
 const dx=to.x-from.x,dy=to.y-from.y;let nx=Math.abs(trunc(dx/speed)),ny=Math.abs(trunc(dy/speed));
 let vx=nx?trunc(dx*FP/nx):dx,vy=ny?trunc(dy*FP/ny):dy;
 if(nx&&ny&&nx!==ny){if(ny<nx){ny=nx;vy=trunc(dy*FP/nx);}else{nx=ny;vx=trunc(dx*FP/ny);}}
 return {from:{...from},to:{...to},speed,xFrames:nx,yFrames:ny,frames:Math.max(nx,ny),velocity:{x16:vx,y16:vy},source:'FUN_800c0a00'};
}
/** Original top HUD stays in screen coordinates, independent of camera/zoom. */
export function boardHudOrigin(playerCount,playerIndex){return {x:160-playerCount*36+playerIndex*72,y:16};}
export function boardHudPositions(playerCount,playerIndex){const p=boardHudOrigin(playerCount,playerIndex);return {origin:p,panel:{x:p.x+8,y:p.y},face:{...p},name:{x:p.x,y:p.y+32},chakra:{x:p.x+32,y:p.y+16},scroll:{x:p.x+56,y:p.y+32},crystalStart:{x:p.x+32,y:p.y},crystalSpacing:8};}
