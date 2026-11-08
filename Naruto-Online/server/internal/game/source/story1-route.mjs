/** Map0 specialization of BOARD800b78e4 +800b83fc. See story1-flow.md.
 * Deliberately rejects other maps; this is not a substitute generic BFS. */
export function story1DefenderRoute(tiles,from,to){
 if(tiles.length!==22||!tiles.every((t,i)=>t.id===i&&t.typeCode!==3&&t.typeCode!==6&&
   t.neighborSlots?.[0]===(i+1)%22&&t.neighborSlots?.[1]===(i+21)%22&&
   t.neighborSlots?.[2]===255&&t.neighborSlots?.[3]===255))
   throw new RangeError('Original map0 ordered22-node ring required');
 if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||to<0||from>=22||to>=22)
   throw new RangeError('Map0 tile IDs0..21 required');
 if(from===to)return {distance:0,direction:255,path:[from],candidates:[]};
 const candidates=[0,1].map(direction=>{
   let current=tiles[from].neighborSlots[direction],count=0,reached=false;
   for(let step=0;step<20;step++){
     if(current===to){reached=true;break;}
     current=tiles[current].neighborSlots[direction];count++;
   }
   // Main80039728 is hypot;80038848 truncates its nonnegative result.
   const metric=Math.trunc(Math.hypot(tiles[to].x-tiles[current].x,tiles[to].y-tiles[current].y));
   return {direction,score:metric+count*20-(reached?10000:0),reached,count};
 });
 // Original scan uses strict <; slot0 wins an exact tie.
 const selected=candidates[1].score<candidates[0].score?candidates[1]:candidates[0];
 const path=[from];let current=from;
 for(let i=0;i<30;i++){current=tiles[current].neighborSlots[selected.direction];path.push(current);if(current===to)break;}
 return {distance:path.length-1,direction:selected.direction,path,candidates};
}

import {cpuRouteGeometry,cpuRouteProbe,cpuLandingCandidate,cpuChooseRoute} from './board-ai.mjs';
const ringTiles=tiles=>tiles.map(t=>({...t,neighborSlots:t.neighborSlots??t.neighbors,
 neighbors:t.neighborSlots??t.neighbors}));
/**800d5bc0: compact menu slots in up/down/left/right order. Ties use the first
 * original graph slot; selected neighbors are removed before the next axis. */
export function story1DirectionMenu(tiles,position){
 tiles=ringTiles(tiles);story1DefenderRoute(tiles,position,position);
 const origin=tiles[position],remaining=[0,1],menu=[];
 for(let code=0;code<4;code++){
  let best=1000,selected=-1;
  for(const direction of remaining){const next=tiles[origin.neighbors[direction]],dx=next.x-origin.x,dy=next.y-origin.y;
   const enabled=[dy< -20,dy>20,dx< -20,dx>20][code],metric=code<2?Math.abs(dx):Math.abs(dy);
   if(enabled&&metric<best){best=metric;selected=direction;}
  }
  if(selected>=0){menu.push({direction:selected,choiceCode:code,next:origin.neighbors[selected]});remaining.splice(remaining.indexOf(selected),1);}
 }
 while(menu.length<4)menu.push({direction:255,choiceCode:255,next:255});
 return menu;
}
/**800b9e30 on the exact map0 ring: two candidates, in original graph slot order.
 * remaining is the source unsigned remaining-step byte, including its bit7. */
export function story1MovementPreview(tiles,position,remaining){
 tiles=ringTiles(tiles);story1DefenderRoute(tiles,position,position);
 if(!Number.isInteger(remaining)||remaining<0||remaining>255)throw new RangeError('Original remaining-step byte required');
 return [0,1].map(direction=>{let tile=position;for(let i=0;i<(remaining&127);i++)tile=tiles[tile].neighbors[direction];return {tile,direction};});
}
/**Full initial direction-menu choice on map0 (800d5bc0 ->800ccd3c).
 * State uses faithful-rules runtime fields. This is NOT a midmovement junction
 * policy. Return direction is original graph slot; nextDirection is the source
 * direction byte committed after choosing its neighbor. No state mutation. */
export function story1CpuInitialRoute(state,actor,{remaining,crystalTileIds=[11,17]}={}){
 const tiles=ringTiles(state.tiles),p=state.players[actor];
 const menu=story1DirectionMenu(tiles,p.position);
 if(state.modeFlags!==0)throw new RangeError('Story1 modeFlags0 required');
 const allCrystals=crystalTileIds.every((_,i)=>p.flags&(0x1000<<i));
 const s={...state,tiles,players:state.players.map((q,i)=>i===actor?{...q,direction:0}:q)};
 const barrierCount=tiles.filter(t=>t.typeCode===5&&t.owner===actor).length;
 const finish=(result,routes,candidates)=>{const route=routes[result.slot];return {...result,
  direction:route.direction,next:route.next,nextDirection:Number(tiles[route.next].neighbors[0]===p.position),routes,candidates};};
 if(p.status&0x20)return finish(cpuChooseRoute(s,actor,{routes:menu,allCrystals,barrierCount}),menu,[]);
 const candidates=story1MovementPreview(tiles,p.position,remaining);
 const geometry=cpuRouteGeometry(s,actor,{directions:menu.map(r=>r.direction),crystalTileIds,mapId:0});
 //800cd518 s2=sp+0x28 is a signed PS1 RAM pointer (<-10000). The exact address
 //cannot affect the one-candidate comparison. Then800cd5b8/70c s2=returned ID.
 let incomingScore=-2147483648;
 const routes=menu.map((r,i)=>{
  if(r.direction===255)return r;
  const landing=cpuLandingCandidate(s,actor,{candidates,direction:r.direction,crystalTileIds,initialScore:incomingScore});incomingScore=landing.tile;
  const probe=cpuRouteProbe(s,actor,{goalType:allCrystals?0:1,direction:r.direction,crystalTileIds});
  const t=tiles[landing.tile];
  return {...r,distance:geometry[i],landingTile:landing.tile,probeFound:probe.found,
   missingBeforeJunction:!allCrystals&&probe.found,
   defenderDistance:t?.typeCode===5&&t.owner!==actor?story1DefenderRoute(tiles,s.players[t.owner].position,t.id).distance:undefined};
 });
 const unknown=allCrystals?routes.flatMap((r,i)=>r.direction!==255&&r.landingTile===255?[i]:[]):[];
 if(unknown.length){
  //800cd5c4 reads tile255 RAM, but the all-crystal branch can only subtract
  //20000 and/or10000. Every unknown route reads the SAME address, so its
  //penalty is shared. Enumerate all four possibilities; return only when
  //the winning choice is identical for every possible memory value.
  const knownRoutes=routes.map((r,i)=>unknown.includes(i)?{...r,direction:255}:r);
  const result=knownRoutes.every(r=>r.direction===255)?{scores:[null,null,null,null],rngState:s.rngState,draws:0}:
   cpuChooseRoute(s,actor,{routes:knownRoutes,allCrystals,barrierCount});
  const possibleWinners=[0,-10000,-20000,-30000].map(penalty=>{
   let slot=0,best=-1000000;
   routes.forEach((r,i)=>{if(r.direction===255)return;
    const score=unknown.includes(i)?-r.distance+penalty:result.scores[i];
    if(score>best){best=score;slot=i;}
   });return slot;
  });
  if(possibleWinners.some(slot=>slot!==possibleWinners[0]))
   throw Object.assign(new Error('Original all-crystal route reads invalid landing tile; unknown RAM can change winner'),{code:'UNKNOWN_ROUTE_RAM',routes,possibleWinners});
  const slot=possibleWinners[0],reads=unknown.map(slot=>({slot,address:0x8014daf4,scoreUpperBound:-routes[slot].distance}));
  return finish({...result,slot,choiceCode:routes[slot].choiceCode,
   memoryIndependentChoice:{address:0x8014daf4,possibleWinners},
   ...(!unknown.includes(slot)?{dominatedMemoryReads:reads}:{sharedMemoryReads:reads})},routes,candidates);
 }
 return finish(cpuChooseRoute(s,actor,{routes,allCrystals,barrierCount}),routes,candidates);
}
