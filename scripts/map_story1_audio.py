import json,hashlib
from pathlib import Path
R=Path(__file__).resolve().parents[1]
def queue(scene):
 t=scene['tables'];q=[];offset=0
 for seq,cid in enumerate(t['sequence']):
  c=t['clips'][cid]
  for lid in range(c[2],c[2]+c[3]):
   l=t['layers'][lid]
   if l[0]<3:continue
   for eid in range(l[2],l[2]+l[3]):
    e=t['events'][eid];q.append(dict(sequenceIndex=seq,eventId=eid,kind=l[0],frame=offset+e[0],localFrame=e[0],value=e[1],argument=e[3]))
  offset+=c[0]-1
 for i in range(len(q)):
  for j in range(i+1,len(q)):
   if q[j]['frame']<q[i]['frame']:q[i],q[j]=q[j],q[i]
 return q
rows=[]
def add(name,source,**kw):rows.append(dict(event=name,source=source,**kw))
add('board-music','BOARD.c:800b1e88; STORY1_AUDIO.c:80012eac,80013464,80013488,800182a8,8001811c',music=10,resource=1252,volumeByte=180,sequenceVolume=90,loop=True)
add('menu-cursor','BOARD.c:80101fe8',bank='menu',sequence=2,channel=0)
add('menu-confirm','BOARD.c:80101fe8',bank='menu',sequence=0,channel=1)
add('menu-cancel','BOARD.c:80101fe8',bank='menu',sequence=1,channel=1,condition='menu id >=2 and !=7')
add('menu-disabled','BOARD.c:80101fe8',bank='menu',sequence=10,channel=1)
add('menu-open','BOARD.c:80102738',bank='board',sequence=2,channel=3)
add('roll','ROULETTE_MAIN.c:80020bf4',bank='menu',sequence=3,channel=0,loop=True)
add('stop','BOARD.c:8010b084',bank='menu',sequence=4,channel=1,pan='side0:64; side1:-64',phase='hammer request, not freeze')
add('roll-freeze','ROULETTE_MAIN.c:80020c90',stopChannel=0)
add('roll-impact','ROULETTE_BOARD.c:8010bfa8',bank='menu',sequence=5,channel=0,pan='trunc((hammerX-160)/2)',phase='three hammer impacts')
add('walk','BOARD.c:800c0a00',bank='board',channel=2,sequences={'humanNormal':8,'cpuOrPossessedOrFast':10,'sharedSourceDestinationTileFlags':12},condition='normal sounds suppressed in alternate presentation unless board+0x537==0')
add('walk-land','BOARD.c:800c0a00',bank='board',sequence=13,channel=5,condition='shared tile flags / jump branch only')
add('claim','BOARD.c:800f0c10',phases={'prompt':{'bank':'board','sequence':24,'channel':1},'confirm':{'bank':'menu','sequence':0,'channel':1}},unresolved='No distinct ownership-commit sound proven')
add('upgrade','BOARD.c:800e3e74,80101fe8',phases={'confirm':{'bank':'menu','sequence':0,'channel':1}},unresolved='Dedicated upgrade effect 0x25c audio not traced')
add('pay','BOARD_EFFECTS.c:800c5978 case3; BOARD.c:800bee54',phases={'negative-amount-display':{'bank':'board','sequence':21,'channel':1},'reaction':{'bank':'board','sequence':22,'channel':4}},condition='Effect dispatch and actor animation are distinct phases; do not play immediately on any debit')
add('bonus-tick','BOARD.c:80109fec states3..10',bank='board',sequence=5,channel=2,condition='global frame counter even')
add('turn','BOARD.c:800cee18 case2',bank='board',channel=2,sequences={'normal':7,'readyToWin':47},condition='skip when board+0x92b script voice flag active; readyToWin checks chakra+bonus, crystals and scroll')
add('battle-start','BOARD.c:8011c028,8011ce2c case0x15,8011d994',phases={'transition':{'bank':'board','sequence':78,'channel':2,'fadeMusicTicks':20},'combat-music':{'music':22,'sequenceVolume':100,'loop':True}},condition='transition sound only when previous main state 3 or4')
add('battle-result','BOARD.c:8012c934 case10,20;8011d994; table800b0d94',phases={'fade':{'fadeMusicTicks':20},'music':{'defenderHpZero':24,'defenderHpNotZero':25,'sequenceVolume':100,'loop':False}})
add('character-voice','STORY1_AUDIO.c:800188f0,80018968; table80065408',resourceBases={'12':1287,'10':1407},slots=12,sequence=0,volumeByte=255,note='18968 initially sets220 then final19b9c applies255 with signed pan')
scenes=[]
for sid in [175,166]:
 s=json.loads((R/f'extracted/story/scenes/scene_{sid}.json').read_text());q=queue(s);sound=[]
 for e in q:
  if e['kind']==5:sound.append(dict(**e,bank='story0',channel=5+len(sound)%3,volumeByte=185))
 scenes.append(dict(scene=sid,kindCounts={str(k):sum(e['kind']==k for e in q) for k in [3,4,5,6]},sounds=sound))
result=dict(scope='Naruto first campaign stage; proven native calls only',sources=[dict(path=p,sha256=hashlib.sha256((R/p).read_bytes()).hexdigest()) for p in ['decompiled/STORY1_AUDIO.c','decompiled/BOARD.c','decompiled/BOARD_EFFECTS.c','decompiled/STORY_ENGINE.c','decompiled/STORY.c','decompiled/ROULETTE_MAIN.c','decompiled/ROULETTE_BOARD.c']],defaultSound={'volumeByte':180,'pan':0,'loop':False},events=rows,story={'bank':'story0','resource':1454,'source':'STORY_ENGINE.c:800279c4; STORY1_AUDIO.c:800190fc; EXE table80065480','ringChannels':[5,6,7],'allBusy':'wait and retry same event','kind6':'controller rumble, not sound; 80027c80 ->8001f4b8/1f568 ->1fbd8 ->2e8a4 ->PadSetAct','scenes':scenes},unresolved=['Dedicated upgrade-effect sound beyond generic menu confirm','Full stage victory and ending music timing','General combat choreography SEQ triggers','Mapping all twelve character voice slots to semantic actions'])
(R/'research/story1-audio.json').write_text(json.dumps(result,indent=2)+'\n')
print([(s['scene'],s['kindCounts']) for s in scenes])
