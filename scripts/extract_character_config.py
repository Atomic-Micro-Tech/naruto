#!/usr/bin/env python3
"""Map original 13 sprite TIMs to visually identified names/portrait art."""
from PIL import Image,ImageDraw
from pathlib import Path
import json,struct
ROOT=Path(__file__).resolve().parents[1]
sprites=['002f8098','002f8e58','002f9798','002fa198','002fadd8','002fcf18','002fdf18','002ff758','00300e18','00301b18','00302758','00303698','003045d8']
portraits=['008e9000','008f3800','008fe000','00908800','0095c800','00952000','0093d000','00932800','00913000','0091d800','00947800','00928000','0196901c']
names=['Naruto Uzumaki','Sasuke Uchiha','Sakura Haruno','Kakashi Hatake','Zabuza Momochi','Haku','Demon Brothers','Zori & Waraji','Iruka Umino','Konohamaru Sarutobi','Mizuki','Hiruzen Sarutobi','Naruto (goggles)']
data=(ROOT/'extracted/disc/DATA.BIN').read_bytes()
def members(o):
 return [(o+off,size) for off,size in [struct.unpack_from('<II',data,o+12+i*8) for i in range(struct.unpack_from('<I',data,o+4)[0])]]
out=ROOT/'extracted/original-ui';out.mkdir(exist_ok=True)
a=[];contact=Image.new('RGB',(650,13*100),(80,80,80));d=ImageDraw.Draw(contact)
for i,(s,p,n) in enumerate(zip(sprites,portraits,names)):
 im=Image.open(ROOT/f'extracted/textures/tim_{s}.png');po=Image.open(ROOT/f'extracted/textures/tim_{p}.png')
 desc=members(0x306e0c)[i][0]
 branch=members(members(members(desc)[0][0])[0][0])
 animation=[dict(zip(['frame','durationFrames','offsetX','offsetY'],struct.unpack_from('<4h',data,q))) for q,z in members(branch[0][0])]
 frames=[]
 for q,z in members(branch[1][0]):
  u,v,x,y=struct.unpack_from('<4B',data,q+4);w,h=struct.unpack_from('<HH',data,q+12)
  frames.append(dict(u=u,v=v,width=w,height=h,offsetX=x-127,offsetY=y-127,sourceOffset=hex(q)))
 minx=min(f['offsetX'] for f in frames);maxx=max(f['offsetX']+f['width'] for f in frames);miny=min(f['offsetY'] for f in frames);maxy=max(f['offsetY']+f['height'] for f in frames)
 fw=maxx-minx;fh=maxy-miny;sheet=Image.new('RGBA',(fw*len(frames),fh))
 for j,f in enumerate(frames):
  u,v,w,h=[f[k] for k in ['u','v','width','height']];piece=im.crop((u,v,u+w,v+h));sheet.alpha_composite(piece,(fw*j+f['offsetX']-minx,f['offsetY']-miny))
 filename=f'character_{i:02}_menu.png';sheet.save(out/filename)
 a.append(dict(id=i,name=n,sprite=filename,rawSprite=f'../textures/tim_{s}.png',portrait=f'../textures/tim_{p}.png',frameWidth=fw,frameHeight=fh,frameCount=len(frames),columns=len(frames),anchorX=-minx,anchorY=-miny,frames=frames,animation=animation,source=dict(spritePackageResource=773,spriteMember=i,spriteDataOffset='0x'+s,portraitDataOffset='0x'+p,descriptorOffset=hex(desc)),mappingEvidence='Character index selects package member in FUN_800b1ccc. Original packed frame rectangles and animation duration/offset records decoded; name and portrait matched visually.'))
 d.text((0,i*100),f'{i} {n}',fill='white');contact.paste(sheet,(0,i*100+20),sheet);po.thumbnail((120,95));contact.paste(po,(500,i*100),po)
(out/'characters.json').write_text(json.dumps(a,indent=2));contact.save(out/'characters-contact.png')
print('Exported 13 characters with original variable rectangles and animation records')
