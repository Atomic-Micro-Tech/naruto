#!/usr/bin/env python3
"""Rebuild original backgrounds: FUN_800f64b0, column-major 8x8 tiles."""
from extract_assets import *
b=(ROOT/'extracted/disc/DATA.BIN').read_bytes();manifest=json.loads((ROOT/'extracted/manifest.json').read_text());out=ROOT/'extracted/maps';out.mkdir(exist_ok=True)
entries=[]
for mapid in range(18):
 r=manifest['resources'][344+mapid];o=r['offset'];cols,rows=b[o+6:o+8];w,h=cols*8,rows*8
 assert b[o:o+6]==b'\x10\0\0\0\x09\0'
 assert U32(b,o+8)==524 and U32(b,o+532) in (64,w*h)
 assert r['size']==544+w*h
 palette=[color(v[0]) for v in struct.iter_unpack('<H',b[o+20:o+532])];raw=b[o+544:o+544+w*h]
 im=Image.new('RGBA',(w,h))
 for x in range(cols):
  for y in range(rows):
   i=(x*rows+y)*64;tile=Image.new('RGBA',(8,8));tile.putdata([palette[v] for v in raw[i:i+64]]);im.paste(tile,(x*8,y*8))
 im.save(out/f'map_{mapid:02}.png');entries.append(dict(id=mapid,resource=r['id'],offset=o,width=w,height=h,file=f'map_{mapid:02}.png'))
(out/'manifest.json').write_text(json.dumps(entries,indent=2));print('18 original map backgrounds decoded')
