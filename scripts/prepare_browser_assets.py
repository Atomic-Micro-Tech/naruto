#!/usr/bin/env python3
"""Copy decoded originals and provenance into the self-contained browser build."""
import json,shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];src=ROOT/'extracted';out=ROOT/'browser-game/dist/assets';out.mkdir(parents=True,exist_ok=True)
shutil.copytree(src/'xa/browser',out/'xa',dirs_exist_ok=True)
for folder in ('textures','maps','story','music','story1-audio'):
 shutil.copytree(src/folder,out/folder,dirs_exist_ok=True)
for name in ('maps','scenarios'):
 shutil.copy2(ROOT/f'research/{name}.json',out/f'{name}.json')
colors=['#f3a044','#9b98e7','#ed96ad','#8db6ad','#a4bf61','#aa8fc9','#e7bf7b','#8cc6d4','#e5a873','#a5c4d8','#a8c49c','#a7b6ce','#d9b197']
shutil.copytree(src/'original-ui',out/'original-ui',dirs_exist_ok=True)
characters=json.loads((src/'original-ui/characters.json').read_text())
board_chars=json.loads((src/'original-ui/board-characters/characters.json').read_text())['characters']
for c in characters:
 c['boardAnimations']=board_chars[c['id']]['animations']
 c['sprite']='assets/original-ui/'+c['sprite']
 c['portrait']='assets/'+c['portrait'].replace('../','')
 c['color']=colors[c['id']]
rules=json.loads((ROOT/'research/full-rules.json').read_text())
shutil.copy2(ROOT/'research/faithful-rules.mjs',out.parent/'faithful-rules.mjs')
shutil.copy2(ROOT/'research/faithful-combat.mjs',out.parent/'faithful-combat.mjs')
shutil.copy2(ROOT/'research/faithful-roulette.mjs',out.parent/'faithful-roulette.mjs')
for name in ('board-effects','board-ai','board-camera','story-scene','story-runtime','story-renderer','race-rules','progression','progression-data','treasure','treasure-data','music-player','story1-economy','story1-cpu','story1-route','story1-scroll','story1-audio','story1-cpu-preroll','story1-cpu-roulette','story1-cpu-combatcard'):
 shutil.copy2(ROOT/f'research/{name}.mjs',out.parent/f'{name}.mjs')
shutil.copy2(ROOT/'research/board-ai.json',out/'board-ai.json')
(out/'full-rules.json').write_text(json.dumps(rules))
manifest=json.loads((src/'manifest.json').read_text())
# BOARD FUN_80100698 loads card art from resource 0x1a9 + card ID.
for card in rules['cards']:
 entry=next(t for t in manifest['textures'] if t['resource']==425+card['id'])
 card['art']='assets/'+entry['png']
gallery=[]
for e in manifest['textures']:
 if e['mode']&7 not in (0,1):continue
 if e['width']<48 or e['height']<32:continue
 r=e['resource'];category='Lainnya'
 if 484<=r<=514:category='Ilustrasi'
 elif 681<=r<=706 or r==773:category='Sprite'
 elif 425<=r<=476:category='Kartu'
 elif 388<=r<=411:category='Petunjuk asli'
 elif 707<=r<=758:category='Potret'
 elif 517<=r<=580:category='Item'
 gallery.append(dict(**e,category=category,src='assets/'+e['png']))
(out/'catalog.json').write_text(json.dumps(gallery))
sounds=['00a445ecd205d45b','b9a064e727565a9b','0339d7057b8a06ab','c2852064f0f16a2e','782f2cdf169f3597']
(out/'audio').mkdir(exist_ok=True)
for s in sounds:shutil.copy2(src/f'audio/wav/spu_{s}.wav',out/f'audio/{s}.wav')
(out/'game-data.json').write_text(json.dumps(dict(characters=characters,maps=json.loads((out/'maps.json').read_text()),scenarios=json.loads((out/'scenarios.json').read_text()),boardAi=json.loads((ROOT/'research/board-ai.json').read_text()),combat=rules["combat"],cards=rules["cards"],decks=rules["decks"],campaigns=rules["campaigns"],allScenarios=rules["scenarios"],techniques=json.loads((ROOT/'research/techniques.json').read_text()),counts=dict(textures=len(manifest['textures']),maps=18,samples=1081,resources=1504),sounds=sounds)))
print(f'Prepared {len(gallery)} gallery images, 18 original maps, 13 characters, 52 card definitions, story scenes, original SEQ/XA and native rule modules.')
