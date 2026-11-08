#!/usr/bin/env python3
"""Decode exact BOARD atlas rectangles and palettes recovered from original code."""
from pathlib import Path
import struct,json,sys
from PIL import Image,ImageDraw
sys.path.insert(0,str(Path(__file__).resolve().parent))
from extract_assets import color
ROOT=Path(__file__).resolve().parents[1];data=(ROOT/'extracted/disc/DATA.BIN').read_bytes();manifest=json.loads((ROOT/'extracted/manifest.json').read_text());resources=manifest['resources'];out=ROOT/'extracted/original-ui/board';out.mkdir(exist_ok=True,parents=True)
ro=resources[1];overlay=data[ro['offset']:ro['offset']+ro['size']];BASE=0x800ad450
VRAM=[0]*(1024*512)
def read(addr,fmt):return struct.unpack_from('<'+fmt,overlay,addr-BASE)
def members(o):return [(o+off,size) for off,size in [struct.unpack_from('<II',data,o+12+i*8) for i in range(struct.unpack_from('<I',data,o+4)[0])]]
def upload(o,x,y):
 flags=struct.unpack_from('<I',data,o+4)[0];p=o+8
 if flags&8:p+=struct.unpack_from('<I',data,p)[0]
 n,_,_,w,h=struct.unpack_from('<I4H',data,p);pix=struct.unpack_from('<'+'H'*(w*h),data,p+12)
 for row in range(h):VRAM[(y+row)*1024+x:(y+row)*1024+x+w]=pix[row*w:(row+1)*w]
def crop(uv,tpage,clut,bits=4):
 u,v,w,h=uv;tx=(tpage&15)*64;ty=(tpage>>4&1)*256;cx,cy=clut;factor=16//bits
 palette=[color(VRAM[cy*1024+cx+i]) for i in range(1<<bits)];pixels=[]
 for yy in range(h):
  for xx in range(w):
   sx=(u+xx)&255;sy=(v+yy)&255;word=VRAM[(ty+sy)*1024+tx+sx//factor];pixels.append(palette[word>>(sx%factor*bits)&((1<<bits)-1)])
 im=Image.new('RGBA',(w,h));im.putdata(pixels);return im
parts=members(resources[38]['offset']);rects=read(0x800aedd0,'12h')
for i,(o,s) in enumerate(parts):upload(o,rects[i*4],rects[i*4+1])
assets=[]
def sprite(name,uv,tpage,clut,source,anchor=None,bits=4,**extra):
 im=crop(uv,tpage,clut,bits);file=name+'.png';im.save(out/file);item=dict(id=name,file=file,width=im.width,height=im.height,anchor=anchor or [im.width//2,im.height//2],source=dict(function=source,resource=38,uv=list(uv),tpage=tpage,clut=list(clut),bits=bits),**extra);assets.append(item);return item
sprite('source',(128,0,48,48),24,(80,242),'FUN_800f6ec4',tileType=0)
sprite('chance',(224,120,32,32),24,(0,242),'FUN_800f6ec4',tileType=2,attribute=0x40000000)
sprite('vacant',(0,224,32,32),24,(208,242),'FUN_800f6ec4',tileType=4,attribute=0x40000000)
sprite('special_type7',(160,184,32,32),24,(304,244),'FUN_800f6ec4',tileType=7,attribute=0x40000000)
sprite('special_type8',(216,48,32,32),24,(112,244),'FUN_800f6ec4',tileType=8,attribute=0x40000000)
sprite('damaged',(128,168,16,16),24,(176,242),'FUN_800f6ec4',anchor=[0,16])
sprite('crystal_collected_glow',(192,152,64,64),24,(16,243),'FUN_800f6ec4',attribute=0x50000000)
sprite('link_dot',(248,0,8,8),24,(96,242),'FUN_800f6db0',attribute=0x50000000)
for i in range(4):
 tpage=read(0x800aeb9c+i*4,'I')[0];u=read(0x800aebac+i*4,'I')[0];v=read(0x800aebbc+i*4,'I')[0];cx=read(0x800aebcc+i*4,'I')[0];cy=read(0x800aebdc+i*4,'I')[0];size=read(0x800aebec+i*4,'I')[0]
 sprite(f'crystal_{i}',(u,v,size,size),tpage,(cx,cy),'FUN_800f6988',tileType=1,crystalIndex=i)
 u=read(0x800aebfc+i*4,'I')[0];v=read(0x800aec0c+i*4,'I')[0];cx=read(0x800aec1c+i*4,'I')[0];cy=read(0x800aec2c+i*4,'I')[0]
 sprite(f'crystal_{i}_overlay',(u,v,size,size),tpage,(cx,cy),'FUN_800f6988',crystalIndex=i)
for level,u in enumerate([0,128,160,192,224],1):
 for owner in range(4):sprite(f'barrier_p{owner}_level{level}',(u,216,32,40),24,(48,245+owner),'FUN_800bb004',anchor=[16,24],owner=owner,level=level)
for tiletype in [21]:
 i=tiletype-9;tpage=read(0x800aec98+i*4,'I')[0];u=read(0x800aeccc+i*4,'I')[0];v=read(0x800aed00+i*4,'I')[0];size=read(0x800aed34+i*4,'I')[0];cx=read(0x800aed68+i*4,'I')[0];cy=read(0x800aed9c+i*4,'I')[0]
 sprite(f'tile_type{tiletype}',(u,v,size,size),tpage,(cx,cy),'FUN_800fec20',tileType=tiletype)
(out/'assets.json').write_text(json.dumps(dict(uploads=dict(resource=38,table='0x800aedd0',rectangles=rects),assets=assets,coordinates='Sprite anchor placed at tile world position minus camera; draw larger z first.'),indent=2))
contact=Image.new('RGB',(600,((len(assets)+5)//6)*100),(70,70,70));d=ImageDraw.Draw(contact)
for i,a in enumerate(assets):
 im=Image.open(out/a['file']);x=i%6*100;y=i//6*100;contact.paste(im,(x,y),im);d.text((x,y+70),a['id'],fill='white')
contact.save(out/'contact.png');print('Extracted',len(assets),'exact board atlas sprites')
