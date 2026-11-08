#!/usr/bin/env python3
"""Preview packed VRAM TIM payloads with sibling palettes from TPK0 packages.
Interpretations are explicitly labeled candidates, not sprite layout recovery.
"""
from extract_assets import *
b=(ROOT/'extracted/disc/DATA.BIN').read_bytes();out=ROOT/'extracted/packed';out.mkdir(exist_ok=True)
manifest=json.loads((ROOT/'extracted/manifest.json').read_text());results=[]
for pk in manifest['packages']:
 if pk['tag']!='TPK0' or len(pk['entries'])<2:continue
 try:
  _,_,flags,pix,_=read_tim(b,pk['entries'][0]['offset'])
  _,_,_,pal,_=read_tim(b,pk['entries'][1]['offset'])
 except (ValueError,struct.error):continue
 if flags!=2 or pal['h']>16:continue
 colors=[color(v[0]) for v in struct.iter_unpack('<H',pal['data'])]
 for bits in (8,4):
  n=1<<bits
  if len(colors)<n:continue
  for k in range(min(len(colors)//n,20)):
   palette=colors[k*n:(k+1)*n];raw=pix['data'];ids=raw if bits==8 else [v for byte in raw for v in (byte&15,byte>>4)]
   im=Image.new('RGBA',(pix['w']*(2 if bits==8 else 4),pix['h']));im.putdata([palette[i] for i in ids])
   name=f"packed_{pk['offset']:08x}_{bits}bpp_pal{k:02}"
   im.save(out/(name+'.png'));results.append(dict(id=name,width=im.width,height=im.height,offset=pk['offset'],bits=bits,palette=k))
(out/'manifest.json').write_text(json.dumps(results,indent=2))
selected=[r for r in results if r['bits']==8 and r['palette']==0]
for p in range((len(selected)+59)//60):
 group=selected[p*60:(p+1)*60];im=Image.new('RGB',(1200,1000),(34,39,45));d=ImageDraw.Draw(im)
 for j,r in enumerate(group):
  thumb=Image.open(out/(r['id']+'.png'));thumb.thumbnail((148,108));x=j%8*150;y=j//8*125;im.paste(thumb,(x,y),thumb);d.text((x+2,y+109),r['id'][7:15],fill='white')
 im.save(out/f'contact-{p:02}.jpg')
print(len(results),'packed candidates;',len(selected),'8bpp first palettes')
