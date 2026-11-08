/** Original MENU unlock predicates and Bingo Book navigation. */
import data from './progression-data.mjs';
export {data as progressionData};
const clone=x=>JSON.parse(JSON.stringify(x));
export function newProgression(){return {flags:Array(160).fill(false),playSessions:1,matches:0,characterCounts:Array(13).fill(0),achievementCounters:Array(5).fill(0)};}
export const hasUnlock=(p,id)=>Number.isInteger(id)&&id>=0&&id<160&&!!p.flags[id];
export function grantUnlock(p,id){const n=clone(p);if(Number.isInteger(id)&&id>=0&&id<160)n.flags[id]=true;return n;}
export function collectTreasure(p,id){if(!Number.isInteger(id)||id<0||id>=56)throw new RangeError('Treasure ID must be0..55');return grantUnlock(p,id);}
export function availableCharacters(p){return Array.from({length:13},(_,id)=>id).filter(id=>id<4||hasUnlock(p,id+52));}
export function availableMainMenu(p){return [0,4,...(hasUnlock(p,92)||hasUnlock(p,93)?[6]:[]),...(hasUnlock(p,135)?[5]:[]),...(hasUnlock(p,102)?[7]:[]),2,3,1];}
export function availableRaceMaps(p){return [16,17].filter((id,i)=>hasUnlock(p,92+i));}
export function availableBoardStages(p){return [0,...Array.from({length:8},(_,i)=>i+1).filter(id=>hasUnlock(p,78+id))];}
export function encodeUnlockBits(p){const bytes=Array(20).fill(0);p.flags.forEach((v,i)=>{if(v)bytes[i>>3]|=1<<(i&7);});return bytes;}
export function decodeUnlockBits(bytes){if(bytes.length!==20)throw new RangeError('Original unlock bitfield is20bytes');return Array.from({length:160},(_,i)=>!!(bytes[i>>3]&(1<<(i&7))));}
class Missing extends Error{constructor(key){super(key);this.key=key;}}
function read(c,name,...args){
 const supplied=c.native?.[name];
 if(typeof supplied==='function')return supplied(...args);
 if(supplied!==undefined){if(args.length===0)return supplied;let v=supplied;for(const i of args)v=v?.[i];if(v!==undefined)return v;}
 const simple={'80012444':'campaignId','800126e8':'stageIndex','800129e4':'mapId','80012c54':'turnCount','80012ad0':'modeFlags','80012a70':'targetChakra','8001a274':'winner','80013380':'counter13380','8001a2d8':'specialResultFlag'};
 if(simple[name]&&c[simple[name]]!==undefined)return c[simple[name]];
 if(name==='800135e0'&&c.players)return c.players.length;
 if(name==='80017144'&&c.players){const i=c.players.findIndex(p=>p.characterId===(args[0]&255));return i<0?255:i;}
 if(name==='800138ec'&&c.players?.[args[0]]?.chakra!==undefined)return c.players[args[0]].chakra;
 if(name==='80013d40'&&c.players?.[args[0]]?.flags!==undefined)return c.players[args[0]].flags;
 if(name==='8001a1bc'&&c.ranking?.[args[0]]!==undefined)return c.ranking[args[0]];
 if(name==='80012bd4'&&c.roulette?.[args[1]]!==undefined)return c.roulette[args[1]];
 throw new Missing(`${name}(${args.join(',')})`);
}
/** All28 source predicate families. Unprovided native stats fail closed and
 * are returned as unresolved getter keys, rather than awarding guessed flags.
 */
export function testUnlock(record,p,c={}){
 const [a,b,d,e,f]=record.args,g=(name,...args)=>read(c,name,...args),flag=id=>hasUnlock(p,id);
 const mode=()=>a<0||g('80012444')===a;
 const stage=()=>b<0||g('800126e8')===b;
 const match=()=>mode()&&stage();
 const selected=()=>d<0?0:g('80017144',d);
 let n,v,w;
 try{
  let result=false;
  switch(record.type){
   case 1:result=p.flags.slice(0,56).filter(Boolean).length>=a;break;
   case 2:n=data.groupMap[b];result=mode()&&b>=0&&b<16&&n>=0&&Array.from({length:7},(_,i)=>flag(n*7+i)).every(Boolean);break;
   case 3:result=a>=0&&a<13&&p.characterCounts[a]>=b;break;
   case 4:result=p.playSessions>=a;break;
   case 5:result=p.matches>=a;break;
   case 6:result=record.args.every(id=>id<0||flag(id));break;
   case 7:n=g('80012444');result=n===a&&(a===0?g('800126e8')>=8:a===1?g('800126e8')>=2:a===2?g('800126e8')>=5:false);break;
   case 8:result=p.achievementCounters.slice(0,4).every(x=>x!==0);break;
   case 9:result=match()&&g('8001519c',0,d)!==0;break;
   case 10:result=match();break;
   case 11:
    if(!match())break;n=g('80017144',d);if(n===255)break;v=g('800138ec',n);result=true;
    for(let i=0;i<g('800135e0');i++)if(i!==n&&g('800138ec',i)<v)result=false;
    if(result&&(g('80012ad0')&2)&&g('80012c54')>=g('80012b74',g('8001f1c4',g('80012ad0'))))result=false;
    if(result)result=g('8001a1bc',0)!==n;break;
   case 12:case 13:n=g('800129e4');result=n!==16&&n!==17&&match()&&(record.type===12?g('80012c54')>=d:g('80012c54')<d);break;
   case 14:result=match()&&flag(d)&&flag(e)&&flag(f);break;
   case 15:if(match()){n=selected();result=n!==255&&!!(g('80013d40',n)&512);}break;
   case 16:
    if(!match())break;
    if(d>=0&&e>=0){n=g('80017144',d);v=g('80017144',e);result=n!==255&&v!==255&&g('80014888',n,v)>=f;}
    else{v=0;for(let i=1;i<g('800135e0');i++)v=(v+g('80014888',0,i))&65535;result=v>=f;}break;
   case 17:result=match()&&g('80013380')<=d;break;
   case 18:
    if(!match())break;n=g('80017144',d);if(n===255)break;
    for(let i=3;i>=e-2;i--)if(g('800152c8',n,i&255)!==0){result=true;break;}break;
   case 19:result=match()&&g('80015460',0,e)>=d;break;
   case 20:if(match()){v=0;for(let i=0;i<12;i++)v=Math.max(v,g('80012bd4',0,i));result=g('80015460',0,v&255)>=d;}break;
   case 21:result=match()&&g('8001a274')===d;break;
   case 22:if(match()){n=selected();result=n!==255&&g('80014ed0',n)>=e;}break;
   case 23:
    if(!match())break;n=selected();if(n===255)break;result=true;
    for(let i=0;i<g('800135e0');i++)if(i!==n&&g('800138ec',i)>=0)result=false;break;
   case 24:if(match()){n=selected();result=n!==255&&g('80015234',n)!==0;}break;
   case 25:if(match()){n=selected();if(n===255)break;v=0;for(let i=0;i<14;i++)v=(v+g('80015078',n,i))&65535;result=v<=e;}break;
   case 26:if(match()){n=g('80017144',d);v=g('80017144',e);result=n!==255&&v!==255&&Math.trunc(g('800138ec',v)*f/100)<=g('800138ec',n);}break;
   case 27:result=match()&&g('80012a70')!==0&&Math.abs(g('80012a70')-g('800138ec',0))<=d;break;
   case 28:result=g('8001a2d8')!==0;break;
  }
  return {eligible:!!result,missing:[]};
 }catch(error){if(error instanceof Missing)return {eligible:false,missing:[error.key]};throw error;}
}
export function evaluateProgression(progress,context={}){
 const p=clone(progress),awarded=[],unresolved={};let changed;
 do{changed=false;for(const record of data.records){if(hasUnlock(p,record.id))continue;const result=testUnlock(record,p,context);
  if(result.eligible){p.flags[record.id]=true;changed=true;awarded.push(record.id);delete unresolved[record.id];}
  else if(result.missing.length)unresolved[record.id]=result.missing;
 }}while(changed);
 return {progress:p,awarded,notifications:awarded.filter(id=>id!==159).map(id=>({id,messageId:2194+id})),unresolved};
}
/** FUN800c2748, invoked by the original result notification scene. pairCounts
 * are the sum of native800146d8(0,i) and80014724(0,i), for each opponent i.
 */
export function applyResultCounters(progress,{mapId,characterIds,pairCounts,achievementCounters}){
 const p=clone(progress);if(mapId!==16&&mapId!==17&&p.matches<65535)p.matches++;
 const player0=characterIds[0]===12?0:characterIds[0];
 for(let i=1;i<characterIds.length;i++){
  if(pairCounts?.[i]===undefined)continue;const amount=pairCounts[i];
  p.characterCounts[characterIds[i]]=(p.characterCounts[characterIds[i]]+amount)&65535;p.characterCounts[player0]=(p.characterCounts[player0]+amount)&65535;
 }
 if(achievementCounters)p.achievementCounters=achievementCounters.map(x=>x&65535);return p;
}
// profileId 13 is an additional Haku profile, not a playable character ID.
export function bingoEntries(p){return data.bingoEntries.map(e=>({...e,profileId:e.characterId,blank:e.characterId===255,unlocked:e.characterId!==255&&hasUnlock(p,e.unlockFlag)}));}
export function createBingoState(){return {phase:'index',slot:0,overlay:true};}
export function stepBingo(view,action,p){
 const n={...view},entries=bingoEntries(p);if(action.type==='back'){n.phase=view.phase==='page'?'index':'exit';return n;}
 if(action.type==='open'){if(entries[n.slot].unlocked){n.phase='page';n.overlay=true;}return n;}
 if(action.type==='toggle-overlay'&&view.phase==='page'){n.overlay=!n.overlay;return n;}
 if(action.type==='next-page'&&view.phase==='page'){
  const step=action.direction<0?-1:1;for(let i=0;i<16;i++){n.slot=(n.slot+step+16)%16;if(entries[n.slot].unlocked)return n;}return {...view};
 }
 if(action.type==='move'&&view.phase==='index'){
  let x=n.slot%8,y=Math.floor(n.slot/8),dx=Math.sign(action.dx??0),dy=dx?0:Math.sign(action.dy??0);
  if(!dx&&!dy)return n;x=(x+dx+8)%8;y=(y+dy+2)%2;
  while(entries[y*8+x].blank){if(dx)x=(x+dx+8)%8;else x=x===0?1:x===7?6:x;}
  n.slot=y*8+x;return n;
 }
 return n;
}
