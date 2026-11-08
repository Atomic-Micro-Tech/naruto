#!/usr/bin/env python3
"""Original top BOARD HUD sprites and settled layout, FUN_801052e8."""
from extract_board_ui import *
out=ROOT/'extracted/original-ui/hud';out.mkdir(exist_ok=True);assets=[]
def export(name,uv,page,palette,function='FUN_801052e8',**extra):
 im=crop(uv,page,palette);im.save(out/(name+'.png'));assets.append(dict(id=name,file=name+'.png',width=im.width,height=im.height,source=dict(resource=38,uv=uv,tpage=page,clut=palette,function=function),**extra));return im
for player in range(4):export(f'panel_player_{player}',(176,0,72,48),24,(player*16,241),attribute=0x40000000,offset=[8,0])
for i in range(5):
 uv=read(0x8013a558+i*2,'2B')+(8,16);cx,cy=read(0x8013a564+i*4,'2h');tx,ty=read(0x8013a578+i*4,'2h');page=(448+tx)//64+((256+ty)//256)*16
 export(f'crystal_{i}',uv,page,(cx,cy+241),collected=i<4)
for i in range(2):
 uv=read(0x8013a58c+i*4,'4B');cx,cy=read(0x8013a594+i*4,'2h');export(f'team_label_{i}',uv,23,(cx,cy+241))
export('scroll',(80,216,16,16),24,(64,241),'FUN_80105970',offset=[56,32])
export('condition_glow',(0,160,56,32),23,(192,243),'FUN_80105bcc',offset=[8,8],anchor=[28,16])
for i in range(4):
 uv=read(0x800aee90+i*8,'4h');cx,cy=read(0x800aeeb0+i*4,'2h');tx,ty=read(0x800aeec0+i*4,'2h');export(f'chakra_change_glow_{i}',uv,(448+tx)//64+((256+ty)//256)*16,(cx,cy+241),'FUN_80105c6c',offset=[56,16],scale=[12288,4096])
# Face/name assets and 8x16 digits are already recovered from their own resources.
layout=dict(resolution=[320,240],sourceFunctions=['FUN_80104b94','FUN_80105170','FUN_801052e8'],origin=dict(x='160 - playerCount * 36 + playerIndex * 72',y=16),entry=dict(initialY=-48,finalY=16,frames=8,delayFrames='playerIndex * 2'),drawOrder=['panel','face','name_or_team_label','scroll_if_owned','crystals','chakra','condition_glow'],elements=dict(panel=dict(offset=[8,0],file='panel_player_{playerIndex}.png',attribute=0x40000000),face=dict(offset=[0,0],file='../common/character_{characterId:02}_face.png'),name=dict(offset=[0,32],file='../common/character_{characterId:02}_name.png'),teamLabel=dict(offset=[0,32],periodFrames=180,visibleFirstFrames=90),crystal=dict(offset=[32,0],spacing=8,uncollectedAsset='crystal_4.png',count='scenario crystal count',normalModulation=[144,144,144]),chakra=dict(offset=[32,16],style=0,digits=5,digitWidth=8,alignment='right',zeroPadding=False,paletteNormal=0,paletteNegativeOrLoss=2),scroll=dict(offset=[56,32],flag=512)),assets=assets,notes='Source position and texture rectangles exact. Preview uses normal colors and does not reproduce PS1 semi-transparent panel blending or pulsing modulation.')
(out/'layout.json').write_text(json.dumps(layout,indent=2))
preview=Image.new('RGBA',(320,240));common=out.parent/'common'
for p,cid in enumerate([12,10]):
 x=160-2*36+p*72;y=16
 for file,dx,dy in [(out/f'panel_player_{p}.png',8,0),(common/f'character_{cid:02}_face.png',0,0),(common/f'character_{cid:02}_name.png',0,32)]:preview.alpha_composite(Image.open(file),(x+dx,y+dy))
 for j in range(2):preview.alpha_composite(Image.open(out/'crystal_4.png'),(x+32+j*8,y))
 for j,n in enumerate('1500'):preview.alpha_composite(Image.open(common/f'digits_style0_palette0_{n}.png'),(x+40+j*8,y+16))
preview.save(out/'two_players_settled.png');print('Exported',len(assets),'HUD sprites and exact layout')
