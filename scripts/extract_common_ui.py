#!/usr/bin/env python3
"""Original common HUD, number, control and roulette atlas definitions."""
from extract_board_ui import *
from extract_assets import read_tim
out=ROOT/'extracted/original-ui/common';out.mkdir(exist_ok=True)
exe=(ROOT/'extracted/disc/SLPS_035.53').read_bytes();EXEBASE=struct.unpack_from('<I',exe,0x18)[0]
def er(addr,fmt):return struct.unpack_from('<'+fmt,exe,addr-EXEBASE+0x800)
VRAM[:]=[0]*(1024*512)
parts=members(resources[57]['offset']);upload(parts[0][0],320,256);upload(parts[1][0],0,510)
assets=[]
def export(name,uv,clut,source,**extra):
 im=crop(uv,21,clut);file=name+'.png';im.save(out/file);assets.append(dict(id=name,file=file,width=im.width,height=im.height,uv=list(uv),clut=list(clut),tpage=21,resource=57,sourceFunction=source,**extra));return im
for n in range(13):
 uv=er(0x800655f0+n*4,'4B');cx,cy=er(0x80065624+n*4,'2h');export(f'roulette_number_{n}',uv,(cx,510+cy),'FUN_8001fd0c',number=n)
for i in range(4):
 uv=er(0x800656c8+i*4,'4B');cx,cy=er(0x800656d8+i*4,'2h');export(f'roulette_quadrant_{i}',uv,(cx,510+cy),'FUN_8001fd0c')
for name,uv,clut in [('roulette_pointer',(0,152,56,16),(176,510)),('roulette_center',(0,96,56,56),(144,511)),('roulette_center_shadow',(160,0,56,56),(144,511)),('roulette_spoke',(152,202,104,6),(256,510)),('roulette_rim',(56,96,12,56),(192,510))]:export(name,uv,clut,'FUN_8001fd0c')
for style in range(4):
 w,h=er(0x800654f0+style*2,'2B');u,v=er(0x800654f8+style*2,'2B')
 for pal in range(3):
  clut=er(0x80065500+(style*3+pal)*4,'2h')
  for n in range(12):export(f'digits_style{style}_palette{pal}_{n}',(u+n*w,v,w,h),clut,'FUN_8001b39c',style=style,palette=pal,digit=n)
for i in range(4):export(f'arrow_{i}',er(0x8006575c+i*4,'4B'),(16,511),'FUN_80022ed4',direction=['up','down','left','right'][i])
for i in range(4):
 cx,cy=er(0x8006577c+i*4,'2h');export(f'control_label_{i}',er(0x8006576c+i*4,'4B'),(cx,510+cy),'FUN_80023320',mask=er(0x8006578c+i*4,'I')[0],button=er(0x8006579c+i*4,'I')[0])
characters=[]
for cid in range(13):
 rid=759+cid;parts=members(resources[rid]['offset']);record=dict(id=cid,resource=rid,sourceFunction='FUN_800ffbc0/FUN_800ffa30')
 for j,key in enumerate(['face','name']):
  im=read_tim(data,parts[j][0])[0];file=f'character_{cid:02}_{key}.png';im.save(out/file);record[key]=file
 characters.append(record)
geometry=dict(sourceFunction='FUN_8001fd0c',rotationUnits=4096,xScaleNumerator=575,xScaleDenominator=512,numberVertices=er(0x80065668,'16h'),spokeVertices=er(0x80065688,'16h'),outerVertices=er(0x800656a8,'16h'),outerQuads=[er(0x80065658+i*4,'4B') for i in range(4)],centerVertices=er(0x800656e8,'8h'),rimVertices=er(0x800656f8,'8h'),numberAngleStart='rotation+0x155',numberAngleStep=341,outerAngle='rotation+0x1ff',centerAngle='(rotation+0x155)*2',numbersSubmittedReverse=True,notes='Original textured quads, not a flat wheel bitmap. Left/right variants mirror number/spoke vertices. PS1 submits larger OT depth first, reverses submissions within a depth.')
(out/'assets.json').write_text(json.dumps(dict(resource=57,atlasRect=[320,256],clutRect=[0,510],assets=assets,characters=characters,rouletteGeometry=geometry),indent=2))
items=[a for a in assets if not a['id'].startswith('digits_')];contact=Image.new('RGB',(640,((len(items)+7)//8)*130),(65,65,65));d=ImageDraw.Draw(contact)
for i,a in enumerate(items):
 im=Image.open(out/a['file']);im.thumbnail((78,100));x=i%8*80;y=i//8*130;contact.paste(im,(x,y),im);d.text((x,y+102),a['id'].replace('roulette_',''),fill='white')
contact.save(out/'contact.png');print('Exported',len(assets),'common UI sprites and13HUD face/namepairs')
# Render the recovered textured quads at rotation0 for inspection/integration.
# This is an offline affine-triangle compositor, not a CPU/GPU emulator.
import math
W,H=320,288;center=(160,144)
def vertices(values):return list(zip(values[::2],values[1::2]))
def rotate(points,angle):
 a=angle*math.tau/4096;c=round(math.cos(a)*4096);s=round(math.sin(a)*4096)
 return [(center[0]+(((x*c-y*s)>>12)*575>>9),center[1]+((x*s+y*c)>>12)) for x,y in points]
def quad(canvas,texture,pts):
 # PS1 quads split along vertices1--2, each triangle affine textured.
 tw,th=texture.size;uv=[(0,0),(tw-1,0),(0,th-1),(tw-1,th-1)];src=texture.load();dst=canvas.load()
 for ids in [(0,1,2),(1,2,3)]:
  a,b,c=[pts[i] for i in ids];ta,tb,tc=[uv[i] for i in ids];den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1])
  if not den:continue
  for y in range(max(0,math.floor(min(a[1],b[1],c[1]))),min(H,math.ceil(max(a[1],b[1],c[1]))+1)):
   for x in range(max(0,math.floor(min(a[0],b[0],c[0]))),min(W,math.ceil(max(a[0],b[0],c[0]))+1)):
    w0=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/den;w1=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/den;w2=1-w0-w1
    if min(w0,w1,w2)<-0.0001:continue
    u=round(ta[0]*w0+tb[0]*w1+tc[0]*w2);v=round(ta[1]*w0+tb[1]*w1+tc[1]*w2);pixel=src[max(0,min(tw-1,u)),max(0,min(th-1,v))]
    if pixel[3]:dst[x,y]=pixel
wheel=Image.new('RGBA',(W,H));outer=rotate(vertices(geometry['outerVertices']),511)+[center]
for j in reversed(range(4)):quad(wheel,Image.open(out/f'roulette_quadrant_{j}.png'),[outer[i] for i in geometry['outerQuads'][j]])
for j in reversed(range(12)):quad(wheel,Image.open(out/'roulette_rim.png'),rotate(vertices(geometry['rimVertices']),341+j*341))
for j in reversed(range(12)):quad(wheel,Image.open(out/'roulette_spoke.png'),rotate(vertices(geometry['spokeVertices'])[:4],341+170+j*341))
quad(wheel,Image.open(out/'roulette_center_shadow.png'),rotate(vertices(geometry['centerVertices']),0));quad(wheel,Image.open(out/'roulette_center.png'),rotate(vertices(geometry['centerVertices']),682));wheel.save(out/'roulette_base_angle0.png')
numbers=Image.new('RGBA',(W,H));values=[1,2,2,3,3,3,4,4,4,5,5,6]
for j in reversed(range(12)):quad(numbers,Image.open(out/f'roulette_number_{values[11-j]}.png'),rotate(vertices(geometry['numberVertices'])[:4],341+j*341))
numbers.save(out/'roulette_numbers_scenario0_angle0.png');wheel.alpha_composite(numbers);wheel.save(out/'roulette_scenario0_angle0.png')
geometry['preview']={'base':'roulette_base_angle0.png','numbers':'roulette_numbers_scenario0_angle0.png','complete':'roulette_scenario0_angle0.png','size':[W,H],'center':center,'note':'Recovered original quads rasterized offline atrotation0; triangle edge rules and modulation have not been pixel-diff tested againstPS1.'}
record=json.loads((out/'assets.json').read_text());record['rouletteGeometry']=geometry;(out/'assets.json').write_text(json.dumps(record,indent=2))
