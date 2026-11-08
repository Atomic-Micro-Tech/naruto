#!/usr/bin/env python3
"""CARD-RACE original tile atlas and source-backed lane configuration."""
from extract_board_ui import *
out=ROOT/'extracted/original-ui/race';out.mkdir(exist_ok=True)
parts=members(resources[39]['offset']);rects=read(0x800aede8,'8h')
for i,(o,s) in enumerate(parts):upload(o,rects[i*4],rects[i*4+1])
assets=[]
for kind in range(9,22):
 i=kind-9;page=read(0x800aec98+i*4,'I')[0];u=read(0x800aeccc+i*4,'I')[0];v=read(0x800aed00+i*4,'I')[0];size=read(0x800aed34+i*4,'I')[0];cx=read(0x800aed68+i*4,'I')[0];cy=read(0x800aed9c+i*4,'I')[0];im=crop((u,v,size,size),page,(cx,cy));file=f'tile_{kind}.png';im.save(out/file);assets.append(dict(typeCode=kind,file=file,width=size,height=size,anchor=[size//2,size//2],uv=[u,v,size,size],tpage=page,clut=[cx,cy],sourceFunction='FUN_800fec20'))
(out/'assets.json').write_text(json.dumps(dict(resource=39,uploads=rects,assets=assets,sourceFunctions=['FUN_800ff8b8','FUN_800fec20']),indent=2))
contact=Image.new('RGB',(650,100),(65,65,65));draw=ImageDraw.Draw(contact)
for i,a in enumerate(assets):
 im=Image.open(out/a['file']);contact.paste(im,(i*50,0),im);draw.text((i*50,70),str(a['typeCode']),fill='white')
contact.save(out/'contact.png')
maps=json.loads((ROOT/'research/maps.json').read_text());rules=json.loads((ROOT/'research/full-rules.json').read_text())
(ROOT/'research/race-data.json').write_text(json.dumps(dict(maps=maps[16:18],scenarios=[s for s in rules['scenarios'] if s['mapId'] in [16,17]],deck=rules['decks'][8],cards=rules['cards'][45:52],sources=dict(starts='FUN_800b63f4 reverse tile scan type22',effects='FUN_800e9220 and FUN_800e87c0',rules='FUN_800df698')),indent=2))
print('Exported13race tile assets and maps16/17 data')
