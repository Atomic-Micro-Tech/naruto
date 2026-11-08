#!/usr/bin/env python3
"""Recover every original BOARD character animation, including4direction walk."""
from extract_board_ui import *
from extract_assets import read_tim
out=ROOT/'extracted/original-ui/board-characters';out.mkdir(exist_ok=True)
names=json.loads((ROOT/'extracted/original-ui/characters.json').read_text());records=[]
for cid in range(13):
 static=members(resources[681+cid]['offset']);pack=members(resources[694+cid]['offset']);animations=members(members(pack[0][0])[0][0]);dynamic=members(pack[1][0]);character=dict(id=cid,name=names[cid]['name'],staticTextureResource=681+cid,animationResource=694+cid,directions={'up':9,'down':10,'left':11,'right':12},idle=22,animations=[])
 for aid,(offset,size) in enumerate(animations):
  VRAM[:]=[0]*(1024*512)
  for page,(o,z) in enumerate(static):upload(o,320+64*page,0)
  _,_,_,_,pal=read_tim(data,static[0][0]);colors=struct.unpack('<16H',pal['data']);VRAM[245*1024:245*1024+16]=colors
  if aid>=22:upload(dynamic[aid-22][0],384,144)
  branches=members(offset);sequence=[]
  for q,z in members(branches[0][0]):
   frame,duration,dx,dy=struct.unpack_from('<4h',data,q);sequence.append(dict(frame=frame,duration=duration&255,offsetX=dx,offsetY=dy,sourceOffset=hex(q)))
  frames=[];images=[]
  for fid,(q,z) in enumerate(members(branches[1][0])):
   count=struct.unpack_from('<I',data,q)[0];assert count==1,(cid,aid,fid,count)
   vals=struct.unpack_from('<10H',data,q+4);u=vals[0]&255;v=vals[0]>>8;x=(vals[1]&255)-127;y=(vals[1]>>8)-127;w,h=vals[4:6];page=vals[7]>>14;bits=[4,8,16,16][vals[3]>>7&3];assert bits==4
   im=crop((u,v,w,h),5+page,(0,245),bits);images.append(im)
   frames.append(dict(id=fid,u=u,v=v,width=w,height=h,offsetX=x,offsetY=y,texturePageIndex=page,rotation=vals[6],scaleX=vals[8],scaleY=vals[9],attribute=((vals[3]>>7&3)<<24)|((vals[3]>>5&3)<<28)|((vals[2]>>15)<<30),sourceOffset=hex(q)))
  minx=min(f['offsetX'] for f in frames);miny=min(f['offsetY'] for f in frames);maxx=max(f['offsetX']+f['width'] for f in frames);maxy=max(f['offsetY']+f['height'] for f in frames);fw=maxx-minx;fh=maxy-miny;sheet=Image.new('RGBA',(fw*len(frames),fh))
  for fid,(im,f) in enumerate(zip(images,frames)):sheet.alpha_composite(im,(fid*fw+f['offsetX']-minx,f['offsetY']-miny))
  filename=f'character_{cid:02}_animation_{aid:02}.png';sheet.save(out/filename)
  character['animations'].append(dict(id=aid,sprite=filename,frameWidth=fw,frameHeight=fh,frameCount=len(frames),anchorX=-minx,anchorY=-miny,sequence=sequence,frames=frames,sourceOffset=hex(offset),transformsBaked=False,role={9:'walk_up',10:'walk_down',11:'walk_left',12:'walk_right',22:'idle'}.get(aid,'unclassified')))
 records.append(character)
metadata=dict(characters=records,sourceFunctions=['FUN_8001a648','FUN_8001a770','FUN_800ffd48','FUN_800fff3c','FUN_800bee54','FUN_800227f0','FUN_80022aa8'],timer=dict(incrementPerUpdate=16,speed=8,threshold='sequence.duration * speed',advanceWhen='counter > threshold',afterAdvance='counter %= max(threshold,1)',loopFlag=32768),directions=dict(right=1,left=2,down=4,up=8),notes='Pixel rectangles are exact. Normalized sheets preserve source anchor but do not bake rotation/scalex/scaley. Walking9..12 hasidentity transforms. Dynamic22..25 uses texturepackage memberanimationID-22 overlaid atpage1,v144.')
(out/'characters.json').write_text(json.dumps(metadata,indent=2));contact=Image.new('RGB',(600,13*80),(65,65,65));d=ImageDraw.Draw(contact)
for i,c in enumerate(records):
 d.text((0,i*80),f'{i} {c["name"]}',fill='white')
 for j,aid in enumerate([9,10,11,12,22]):
  a=c['animations'][aid];im=Image.open(out/a['sprite']).crop((0,0,a['frameWidth'],a['frameHeight']));contact.paste(im,(160+j*85,i*80),im);d.text((160+j*85,i*80+60),str(aid),fill='white')
contact.save(out/'contact.png');print('Exported13characters×26animations,',sum(a['frameCount'] for c in records for a in c['animations']),'source frames')
