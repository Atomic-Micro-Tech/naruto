#!/usr/bin/env python3
"""Original main-menu helper bubble geometry and its original glyph messages."""
from extract_original_ui import *
out=ROOT/'extracted/original-ui/menu-help';out.mkdir(exist_ok=True);parts=[]
def add(name,uv,xy,size=None,quad=False):
 im=crop_sprite(uv,(448,256),(272,246),4,(0,0),(0,0));filename=name+'.png';im.save(out/filename);parts.append(dict(id=name,file=filename,source=dict(resource=49,tpage=23,clut=[272,246],uv=uv),position=xy,size=size or im.size,texturedQuad=quad));return im
add('pointer',(124,196,16,16),[-14,8])
for name,uv,xy in [('top_left',(124,212,8,8),[0,0]),('top_right',(140,212,8,8),[184,0]),('bottom_left',(124,220,8,8),[0,40]),('bottom_right',(140,220,8,8),[184,40])]:add(name,uv,xy)
for name,uv,xy,size in [('top',(132,212,8,8),[8,0],[176,8]),('bottom',(132,220,8,9),[8,40],[176,8]),('left',(244,8,8,8),[0,8],[8,32]),('right',(244,0,9,8),[184,8],[8,32])]:add(name,uv,xy,size,True)
canvas=Image.new('RGBA',(206,48));ImageDraw.Draw(canvas).rectangle((22,8,197,39),fill=(248,248,248,255))
for p in parts:
 im=Image.open(out/p['file']).resize(p['size'],Image.Resampling.NEAREST);canvas.alpha_composite(im,(p['position'][0]+14,p['position'][1]))
canvas.save(out/'bubble.png')
fontdir=out.parent/'font';atlas=Image.open(fontdir/'glyphs_12_color0.png');messages=json.loads((fontdir/'messages.json').read_text());mids=json.loads((fontdir/'font.json').read_text())['menuMessageIDs'];rendered=[]
for menu_id,mid in enumerate(mids[:8]):
 target=canvas.copy();x=18;y=4;controls=[];stream=messages[mid]['glyphStream'];i=0
 while i<len(stream):
  value=stream[i];command=value&0xf000
  if command==0:
   gid=value&4095;gx=gid%21*12;gy=gid//21*12;target.alpha_composite(atlas.crop((gx,gy,gx+12,gy+12)),(x,y));x+=13
  elif command==0x2000:x=18;y+=13
  elif command in [0x3000,0x5000,0xc000]:i+=1;controls.append([hex(command),stream[i],x,y])
  elif command==0xb000:pass
  else:controls.append([hex(command),x,y])
  i+=1
 file=f'help_{menu_id}.png';target.save(out/file);rendered.append(dict(menuId=menu_id,messageId=mid,file=file,controls=controls))
metadata=dict(sourceFunctions=['FUN_800b0eb4','FUN_800b1080','FUN_800b1200'],origin=[112,160],fileOrigin=[98,160],textOrigin=[116,164],textColorMode=0,textGlyphSize=12,textAdvance=13,textLineAdvance=13,fill=dict(position=[8,8],size=[176,32],rgb=[248,248,248]),parts=parts,rendered=rendered,notes='Original atlas components and quad extents exact. Offline resized edge previews use nearest scaling; GPU edge sampling unverified. Original message timing/control substitutions omitted from static previews.')
(out/'scene.json').write_text(json.dumps(metadata,indent=2));print('Exported original menu helper bubble and8 messages')
