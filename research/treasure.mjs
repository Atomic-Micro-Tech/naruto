/** Original MENU Treasure Box navigation and collected-item view. */
import data from './treasure-data.mjs';
import {hasUnlock,collectTreasure} from './progression.mjs';
export {data as treasureData};
/** Call only when a barrier upgrade's animation/result has completed.
 * FUN800e5e0c case5 checks the actor's CURRENT tile, not upgrade target.
 * currentTile.level uses displayed1..5 levels, as faithful-rules.mjs does.
 */
export function awardTreasureAfterUpgrade(progress,{gameMode,actorFlags,currentTile}={}){
 const missing=[];if(gameMode===undefined)missing.push('gameMode/80012904');if(actorFlags===undefined)missing.push('actorFlags');if(currentTile?.level===undefined)missing.push('currentTile.level');if(currentTile?.eventId===undefined)missing.push('currentTile.eventId');
 if(missing.length)return {progress,awarded:null,missing};
 const id=currentTile.eventId;
 if(gameMode!==0||(actorFlags&256)!==0||currentTile.level!==5||!Number.isInteger(id)||id<0||id>=56||hasUnlock(progress,id))return {progress,awarded:null,missing:[]};
 return {progress:collectTreasure(progress,id),awarded:id,missing:[],event:{type:'treasure-acquired',id,source:'FUN_800e5e0c',presentationSource:'FUN_801171fc'}};
}
export function createTreasureState({menuTheme=0}={}){return {phase:'index',column:0,cursorRow:0,scrollRows:0,menuTheme,viewedFirstPair:[false,false],events:[]};}
export const selectedTreasure=view=>(view.scrollRows+view.cursorRow)*7+view.column;
export function treasureItems(progress,view){return data.entries.map(e=>({...e,collected:hasUnlock(progress,e.id),selected:e.id===selectedTreasure(view),position:[50+e.column*36,78+(e.row-view.scrollRows)*42],scale:e.id===selectedTreasure(view)&&hasUnlock(progress,e.id)?1.125:1}));}
function closeItem(view){
 const id=selectedTreasure(view);view.phase='index';view.events.push({type:'stop-treasure-voice',source:'FUN_800192c8'});
 // Original reversible menu-background easter egg, FUN800c1c7c.
 if(id<2){view.viewedFirstPair[id]=true;if(!view.viewedFirstPair.every(Boolean)||view.menuTheme!==0)return view;view.menuTheme=1;view.events.push({type:'menu-theme',theme:1,resource:45});}
 else if(id===2){if(view.menuTheme!==0){view.menuTheme=0;view.events.push({type:'menu-theme',theme:0,resource:44});}}
 else return view;
 view.viewedFirstPair=[false,false];return view;
}
/** This ports selection/confirmation behavior after original transitions settle.
 * The renderer owns typewriter state: send advance only once dialogue is at a
 * page boundary/end; native FUN800b1134 advances a waiting page.
 */
export function stepTreasure(state,action,progress){
 const n={...state,viewedFirstPair:[...state.viewedFirstPair],events:[]};
 if(action.type==='back'){if(n.phase==='detail')return closeItem(n);if(n.phase==='index')n.phase='exit';return n;}
 if(n.phase==='detail'){
  if(action.type==='advance'){
   if(action.dialogueStatus==='waiting-page')n.events.push({type:'advance-message',source:'FUN_800b1134'});
   else if(action.dialogueStatus==='complete')return closeItem(n);
  }
  return n;
 }
 if(n.phase!=='index')return n;
 if(action.type==='open'){
  const id=selectedTreasure(n);
  if(!hasUnlock(progress,id)){n.events.push({type:'locked',id,sound:10});return n;}
  n.phase='detail';n.events.push({type:'show-item',id,resource:data.entries[id].resource,nameMessageId:2354+id,descriptionMessageId:2194+id});
  n.events.push({type:'play-treasure-voice',id,xaIndex:1312+id,source:'FUN_800193f0',nativeIndexFormula:'UNK_80064d56 * 16 + id'});return n;
 }
 if(action.type==='move'){
  const dx=Math.sign(action.dx??0),dy=dx?0:Math.sign(action.dy??0);let moved=false;
  if(dx){const x=n.column+dx;if(x>=0&&x<7){n.column=x;moved=true;}}
  else if(dy){
   const y=n.cursorRow+dy;
   if(y>=0&&y<3){n.cursorRow=y;moved=true;}
   else if(y<0&&n.scrollRows>0){n.scrollRows--;moved=true;}
   else if(y>=3&&n.scrollRows<5){n.scrollRows++;moved=true;}
  }
  if(moved)n.events.push({type:'selection',id:selectedTreasure(n),durationFrames:8});
 }
 return n;
}
