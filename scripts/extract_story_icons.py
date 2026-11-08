#!/usr/bin/env python3
"""Exact core controller/continuation sprites: resource57, FUN_80022ccc."""
from pathlib import Path
import json,struct,sys
sys.path.insert(0,str(Path(__file__).resolve().parent))
from extract_assets import read_tim,color
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];data=(ROOT/'extracted/disc/DATA.BIN').read_bytes();exe=(ROOT/'extracted/disc/SLPS_035.53').read_bytes();m=json.loads((ROOT/'extracted/manifest.json').read_text());r=m['resources'][57];o=r['offset'];vram=[0]*(1024*512)
for i,(x,y) in enumerate([(320,256),(0,510)]):
 off,size=struct.unpack_from('<II',data,o+12+i*8);_,_,_,pix,_=read_tim(data,o+off);w,h=pix['w'],pix['h'];words=struct.unpack('<'+'H'*(w*h),pix['data'])
 for row in range(h):vram[(y+row)*1024+x:(y+row)*1024+x+w]=words[row*w:(row+1)*w]
out=ROOT/'extracted/story/icons';out.mkdir(exist_ok=True);icons=[]
for i in range(7):
 u,v,w,h=struct.unpack_from('<4B',exe,0x65708-0x10000+0x800+i*4);tx,ty=struct.unpack_from('<2h',exe,0x65724-0x10000+0x800+i*4);cx,cy=struct.unpack_from('<2h',exe,0x65740-0x10000+0x800+i*4);tx=(tx+320)//64*64;ty=(ty+256)//256*256;cy+=510
 pal=[color(vram[cy*1024+cx+j]) for j in range(16)];pixels=[]
 for yy in range(h):
  for xx in range(w):
   sx=(u+xx)&255;sy=(v+yy)&255;word=vram[(ty+sy)*1024+tx+sx//4];pixels.append(pal[word>>(sx%4*4)&15])
 image=Image.new('RGBA',(w,h));image.putdata(pixels);file=f'icon_{i}.png';image.save(out/file);icons.append(dict(id=i,file=file,width=w,height=h,uv=[u,v,w,h],tpageOrigin=[tx,ty],clut=[cx,cy]))
(out/'index.json').write_text(json.dumps(dict(resourceId=57,sourceFunctions=['8001a57c','80022ccc'],icons=icons,drawOffsetY=-1,bob=dict(periodVblanks=120,offsets=[0,-1],switchEveryVblanks=60)),indent=2)+'\n');print('Exported7 original controller/continuation icons')
