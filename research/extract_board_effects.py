#!/usr/bin/env python3
"""Extract immutable costs and emit source-audited effect/phase metadata."""
import hashlib,json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
exe=(root/'extracted/disc/SLPS_035.53').read_bytes()
costs=list(exe[0x80057774-0x80010000+0x800:0x80057774-0x80010000+0x800+14])
names=['defense-hp+1','random-warp','reverse-direction','suppress-enemy-landing-actions','double-toll','defense-hp+2','hidden-unavailable','possession','skip-next-turn','force-stop','barrier-damage1','barrier-damage1','barrier-damage3','barrier-damage2']
data={'schemaVersion':1,'sourceExeSha256':hashlib.sha256(exe).hexdigest(),'costTable':'0x80057774','jutsu':[{'id':i,'cost':c,'behavior':names[i],'selectable':i!=6,'effect':i+1 if i<10 and i!=6 else None}for i,c in enumerate(costs)],'sourceFunctions':{'eligibility':'800bbe54','cast':'800d9570','damage':'800dd7c0','commit':'800db29c','arrival':'800f3658','forcedStop':'800c0a00 movement tail','trapCommit':'800e2e8c','battleSetup':'800b94e8','battleConsume':'800d6e7c','toll':'800dc2e0','possessionFaces':'800cee18','skipTurn':'800e61f4','scrollTheft':'800ba43c','scrollTransfer':'800e70c8','sourceBonus':'800edd68','sourcePayment':'80109fec','type8Landing':'800f2490','initialTiles':'800f7adc / 800f6ec4','resultRanking':'800e1958','boardRanking':'800b7464'},'initialType8':{'owner':0,'level':3,'hp':4,'effect':0,'repairCounter':0},'scenarioSkillAwardField':'unknownSetting17','scenarioControlByteDestination':'80016258 / player persistent+0xa2..0xa5 (not team flags)','unresolved':['Battle scroll eligibility word boardState+0x5ce semantic meaning','Team result forcedWinner255 out-of-range team read','Presentation-frame and global cosmetic RNG interleaving','Directed movement distance800b83fc and stack sentinel behavior']}
(root/'research/board-effects.json').write_text(json.dumps(data,indent=2)+'\n')
print('Extracted14costs and audited source metadata')
