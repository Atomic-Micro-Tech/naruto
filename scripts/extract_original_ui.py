#!/usr/bin/env python3
"""Reconstruct original TITLE draw layers from MENU overlay's hardcoded tables.
No emulated CPU: offline decoded indexed pixels + original sprite rectangles.
See decompiled/MENU.c FUN_800adee8..FUN_800ae748 and FUN_800af218.
"""
from pathlib import Path
import json,struct,sys
from PIL import Image,ImageDraw
sys.path.insert(0,str(Path(__file__).resolve().parent))
from extract_assets import color
ROOT=Path(__file__).resolve().parents[1]
b=(ROOT/'extracted/disc/DATA.BIN').read_bytes();manifest=json.loads((ROOT/'extracted/manifest.json').read_text());out=ROOT/'extracted/original-ui';out.mkdir(exist_ok=True)
r=manifest['resources'][0];overlay=b[r['offset']:r['offset']+r['size']];BASE=0x800ad450

def shorts(addr,count):return struct.unpack_from('<'+'h'*count,overlay,addr-BASE)
def members(resource):
 r=manifest['resources'][resource];o=r['offset'];count=struct.unpack_from('<I',b,o+4)[0]
 return [(o+off,size) for off,size in [struct.unpack_from('<II',b,o+12+i*8) for i in range(count)]]
def tim_pixel_block(o):
 flags=struct.unpack_from('<I',b,o+4)[0];p=o+8
 if flags&8:p+=struct.unpack_from('<I',b,p)[0]
 n,x,y,w,h=struct.unpack_from('<I4H',b,p)
 return w,h,struct.unpack_from('<'+'H'*(w*h),b,p+12)
VRAM=[0]*(1024*512)
def upload(member,x,y):
 w,h,pix=tim_pixel_block(member[0])
 for row in range(h):VRAM[(y+row)*1024+x:(y+row)*1024+x+w]=pix[row*w:(row+1)*w]
uimembers=members(59);upload(uimembers[0],640,0);upload(uimembers[1],0,508)

def crop_sprite(uv,tex,clut,bits,texture_origin=(640,0),clut_origin=(0,508)):
 u,v,w,h=uv;tx=(tex[0]+texture_origin[0])//64*64;ty=(tex[1]+texture_origin[1])//256*256;cx,cy=clut[0]+clut_origin[0],clut[1]+clut_origin[1];factor=16//bits
 palette=[color(VRAM[cy*1024+cx+i]) for i in range(1<<bits)]
 pixels=[]
 for yy in range(h):
  for xx in range(w):
   sx=(u+xx)&255;sy=(v+yy)&255;word=VRAM[(ty+sy)*1024+tx+sx//factor];index=word>>(sx%factor*bits)&((1<<bits)-1);pixels.append(palette[index])
 im=Image.new('RGBA',(w,h));im.putdata(pixels);return im

layers=[]
def table_group(name,count,xy,uv,clut,tex,bits,z,base=(0,0),pivot=False,texstride=4):
 for i in range(count):
  xyv=shorts(xy+i*4,2);uvv=shorts(uv+i*8,4);cv=shorts(clut+i*4,2);tv=shorts(tex+i*texstride,2)
  im=crop_sprite(uvv,tv,cv,bits);filename=f'title_{name}_{i:02}.png';im.save(out/filename)
  x,y=xyv[0]+base[0],xyv[1]+base[1]
  if pivot:x-=uvv[2]//2;y-=uvv[3]//2
  layers.append(dict(id=f'{name}_{i:02}',file=filename,x=x,y=y,width=im.width,height=im.height,z=z,source=dict(resource=59,xy_table=hex(xy),uv_table=hex(uv),clut_table=hex(clut),tpage_table=hex(tex),index=i,bits=bits,uv=uvv,clut=cv,texture_page=tv)))
# OT larger depth is drawn first. Groups are drawn in original reverse submission order.
table_group('background',4,0x800c68dc,0x800c689c,0x800c68bc,0x800c68cc,4,5)
table_group('background_repeat',4,0x800c68dc,0x800c689c,0x800c68bc,0x800c68cc,4,5,base=(320,0))
table_group('naruto',4,0x800c6810,0x800c682c,0x800c6864,0x800c6880,8,4,base=(256,0))
table_group('copyright',3,0x800c68ec,0x800c68f8,0x800c6910,0x800c691c,4,3,base=(32,412))
table_group('press_start',16,0x800c6a28,0x800c6928,0x800c69a8,0x800c69e8,4,2,base=(88,288),pivot=True)
table_group('logo',5,0x800c6798,0x800c67ac,0x800c67d4,0x800c67e8,8,0,base=(8,32),texstride=8)
scene=Image.new('RGBA',(640,480),(0,0,0,255))
for layer in sorted(layers,key=lambda x:-x['z']):scene.alpha_composite(Image.open(out/layer['file']),(layer['x'],layer['y']))
scene.save(out/'title_complete.png')
base=Image.new('RGBA',(640,480),(0,0,0,255));textlayer=Image.new('RGBA',(640,480))
for layer in sorted(layers,key=lambda x:-x['z']):(textlayer if layer['id'].startswith('press_start') else base).alpha_composite(Image.open(out/layer['file']),(layer['x'],layer['y']))
base.save(out/'title_base.png');textlayer.save(out/'title_press_start.png')
(out/'title-scene.json').write_text(json.dumps(dict(resolution=[640,480],resource=59,overlayResource=0,sourceFunction='FUN_800ade7c',layers=layers,blink=dict(periodFrames=90,visibleFrames=46),verified='Sprite coordinates, atlas indexes and palettes recovered from code; CRT/interlace and transition timing not screenshot-diff verified.'),indent=2))
print('Reconstructed',len(layers),'original TITLE draw layers')
# Original title menu popup, settled state (FUN_800aec68).
popup=[]
for i in range(3):
 uv=shorts(0x800c6ad8+i*8,4);tex=shorts(0x800c6af0+i*4,2);clut=shorts(0x800c6afc+i*4,2)
 im=crop_sprite(uv,tex,clut,4);file=f'title_option_{i}.png';im.save(out/file)
 popup.append(dict(id=i,file=file,x=96,y=264+i*32,width=im.width,height=im.height,uv=uv,tex=tex,clut=clut))
arrow=crop_sprite((192,144,48,32),(320,256),(0,3),4);arrow.save(out/'title_cursor.png')
for count in [2,3]:
 canvas=base.copy();d=ImageDraw.Draw(canvas);d.rectangle((64,240,244,240+count*32+48),fill=(0,0,128,255),outline='white',width=1)
 for layer in popup[:count]:canvas.alpha_composite(Image.open(out/layer['file']),(layer['x'],layer['y']))
 canvas.alpha_composite(arrow,(48,264));canvas.save(out/f'title_menu_{count}_options.png')
(out/'title-menu-scene.json').write_text(json.dumps(dict(resolution=[640,480],background='title_base.png',sourceFunction='FUN_800aec68',options=popup,window=dict(x=64,y=240,width=180,heightFormula='optionCount * 32 + 48',fill=[0,0,128],border=[255,255,255]),cursor=dict(file='title_cursor.png',x=48,y=264,rowHeight=32,horizontalAmplitude=6,periodFrames=30),optionCounts=[2,3]),indent=2))
# MENU graphics upload tables from FUN_800b39f0 and FUN_800b0728.
VRAM[:]=[0]*(1024*512)
menu_uploads=[]
for rid,table in [(44,0x800c6b34),(54,0x800c6d38),(49,0x800c6d48),(48,0x800c6d58)]:
 rects=shorts(table,8);parts=members(rid)
 upload(parts[0],rects[0],rects[1]);upload(parts[1],rects[4],rects[5])
 menu_uploads.append(dict(resource=rid,table=hex(table),texture=list(rects[:4]),clut=list(rects[4:])))
menu=Image.new('RGBA',(320,240),(0,0,0,255))
for i,(px,w) in enumerate([(768,256),(896,64)]):
 part=crop_sprite((0,0,w,240),(px,256),(0,509),8,(0,0),(0,0));menu.alpha_composite(part,(256*i,0))
menu.save(out/'mainmenu_background.png')
menu_assets=[]
for kind,count,uvtable,textable,cluttable,bits,torigin,corigin in [('icon',8,0x800c6d80,0x800c6da0,0x800c6dc0,8,(448,256),(0,244)),('label',8,0x800c6de0,0x800c6e00,0x800c6e20,4,(448,256),(0,244)),('header',6,0x800c6b94,0x800c6bc4,0x800c6bdc,4,(896,0),(0,240))]:
 for i in range(count):
  uv=shorts(uvtable+i*8,4) if kind=='header' else struct.unpack_from('<4B',overlay,uvtable-BASE+i*4)
  tex=shorts(textable+i*4,2);clut=shorts(cluttable+i*4,2);im=crop_sprite(uv,tex,clut,bits,torigin,corigin);file=f'mainmenu_{kind}_{i}.png';im.save(out/file)
  menu_assets.append(dict(kind=kind,id=i,file=file,width=im.width,height=im.height,source=dict(uv=uv,tex=tex,clut=clut,bits=bits,uvTable=hex(uvtable),textureOrigin=torigin,clutOrigin=corigin)))
# Native carousel at its settled default selection. Other supporting overlays
# (help text/control hints) are intentionally not included until decoded.
import math
options=[0,4,2,3,1];placements=[]
for j,choice in enumerate(options):
 theta=2*math.pi*j/len(options);x=160+int(140*math.cos(theta+math.pi/2));y=66+int(int(140*math.sin(theta+math.pi/2))/10)+int(-30*math.sin(theta+math.pi))-int(20*math.cos(theta+math.pi))
 if j==0:y-=2
 scale=1 if j==0 else min(1,((int(4096*math.sin(theta+math.pi*2.5))+4096)//3+0x667)/4096)
 intensity=(int(4096*math.sin(theta+math.pi*2.5))+4096)//107+52
 asset=next(a for a in menu_assets if a['kind']=='icon' and a['id']==choice)
 placements.append(dict(id=choice,file=asset['file'],centerX=x,centerY=y,scale=scale,intensity=intensity,sortY=int(140*math.sin(theta+math.pi/2))))
for a in sorted(placements,key=lambda a:a['sortY']):
 im=Image.open(out/a['file']);im=im.resize((round(im.width*a['scale']),round(im.height*a['scale'])),Image.Resampling.NEAREST)
 # PS1 modulation uses128 as neutral color.
 rr,gg,bb,aa=im.split();lut=[min(255,round(k*a['intensity']/128)) for k in range(256)];im=Image.merge('RGBA',(rr.point(lut),gg.point(lut),bb.point(lut),aa))
 menu.alpha_composite(im,(round(a['centerX']-im.width/2),round(a['centerY']-im.height/2)))
label=Image.open(out/'mainmenu_label_0.png');menu.alpha_composite(label,(160-label.width//2,144-label.height//2))
header=Image.open(out/'mainmenu_header_0.png');menu.alpha_composite(header,(8,18))
menu.save(out/'mainmenu_carousel_core.png')
(out/'mainmenu-scene.json').write_text(json.dumps(dict(resolution=[320,240],sourceFunctions=['FUN_800b0728','FUN_800b39f0','FUN_800b4084','FUN_800b5698'],uploads=menu_uploads,background='mainmenu_background.png',assets=menu_assets,defaultOptions=options,defaultPlacements=placements,selectedLabelCenter=[160,144],headerPosition=[8,18],status='Original background, all8 carousel icon/label pairs and6 headers recovered. Core preview lacks help text, control hints, header strip decoration; not a complete scene.'),indent=2))

path=out/'mainmenu-scene.json';record=json.loads(path.read_text());record['modeLabels']=['ストーリーモード','パーティーモード','ビンゴブック','お宝BOX','せってい','チームバトル','ミニゲーム','忍術指南書'];record['modeNames']=['Story Mode','Party Mode','Bingo Book','Treasure Box','Settings','Team Battle','Minigame','Ninjutsu Guidebook'];path.write_text(json.dumps(record,indent=2))
