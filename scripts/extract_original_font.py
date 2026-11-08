#!/usr/bin/env python3
"""Original packed font and glyph-stream messages, from FUN_8001bce8."""
from extract_board_ui import *
from extract_assets import read_tim
out=ROOT/'extracted/original-ui/font';out.mkdir(exist_ok=True)
VRAM[:]=[0]*(1024*512)
r=resources[477];o=r['offset'];upload(o,960,0)
_,_,_,_,pal=read_tim(data,o);words=struct.unpack('<256H',pal['data'])
for row in range(2):VRAM[(252+row)*1024+960:(252+row)*1024+1024]=words[row*64:(row+1)*64]
fonts={};metadata=[]
for size in [12,16]:
 columns=256//size;rows=256//size;perpage=columns*rows;count=perpage*4
 for mode in [0,1,2,3]:
  atlas=Image.new('RGBA',(columns*size,rows*4*size));glyphs=[]
  for gid in range(count):
   row=gid//columns;page=row//rows;uv=(gid%columns*size,(row*size+page*(256%size))&255,size,size);clut=(960+(mode&1)*32+(page&2)*8,252+(mode>>1));im=crop(uv,15|((page&1)<<4),clut);atlas.alpha_composite(im,(gid%columns*size,gid//columns*size));glyphs.append(im)
  file=f'glyphs_{size}_color{mode}.png';atlas.save(out/file);fonts[size,mode]=glyphs;metadata.append(dict(file=file,size=size,colorMode=mode,columns=columns,count=count,advance=13 if size==12 else 14))
r=resources[775];bank=data[r['offset']:r['offset']+r['size']];count=struct.unpack_from('<H',bank,4)[0];bankrecords=[]
for mid in range(count):
 offset,length=struct.unpack_from('<HH',bank,8+mid*4);stream=list(struct.unpack_from('<'+'H'*length,bank,8+count*4+offset*2));bankrecords.append(dict(id=mid,offsetWords=offset,length=length,glyphStream=stream))

def render_message(mid):
 stream=bankrecords[mid]['glyphStream'];x=y=0;maxx=0;mode=2;glyphdraw=[];controls=[];i=0
 while i<len(stream):
  value=stream[i];cmd=value&0xf000
  if cmd==0:
   gid=value&0xfff
   if gid<len(fonts[12,mode]):glyphdraw.append((fonts[12,mode][gid],x,y));x+=13;maxx=max(maxx,x)
   else:controls.append(dict(kind='unknownGlyph',value=gid,x=x,y=y))
  elif cmd==0x2000:x=0;y+=13
  elif cmd==0x5000:
   i+=1;value2=stream[i];mode=value2 if value2<3 else 2;controls.append(dict(kind='color',value=value2,x=x,y=y))
  elif cmd==0x3000:
   i+=1;controls.append(dict(kind='delay',value=stream[i],x=x,y=y))
  elif cmd==0xb000:controls.append(dict(kind='end',x=x,y=y))
  elif cmd==0x4000:controls.append(dict(kind='pageBreak',x=x,y=y));x=0;y+=26
  elif cmd==0x1000:controls.append(dict(kind='dynamicNumber',x=x,y=y));x+=39;maxx=max(maxx,x)
  elif cmd==0xd000:controls.append(dict(kind='dynamicMessage',x=x,y=y));x+=39;maxx=max(maxx,x)
  elif cmd==0xc000:
   i+=1;controls.append(dict(kind='controllerIcon',value=stream[i],x=x,y=y));x+=16;maxx=max(maxx,x)
  else:controls.append(dict(kind='unknown',value=value,x=x,y=y))
  i+=1
 canvas=Image.new('RGBA',(max(maxx,1),y+12))
 for im,x,y in glyphdraw:canvas.alpha_composite(im,(x,y))
 return canvas,controls
selected=list(range(239,291))
# Also exact first38 MENU helper messages from its pointer table.
menu_r=resources[0];menu=data[menu_r['offset']:menu_r['offset']+menu_r['size']]
menu_ids=list(struct.unpack_from('<37I',menu,0x800ad4a4-BASE))
selected+=list(dict.fromkeys(mid for mid in menu_ids if mid<count))
rendered=[]
for mid in dict.fromkeys(selected):
 im,controls=render_message(mid);file=f'message_{mid:04}.png';im.save(out/file);rendered.append(dict(id=mid,file=file,width=im.width,height=im.height,controls=controls,status='Static original glyphs; dynamicNumber/dynamicMessage/controllerIcon positions left transparent for runtime substitution.'))
(out/'font.json').write_text(json.dumps(dict(fontResource=477,messageResource=775,sourceFunctions=['FUN_8001bc04','FUN_8001bce8','FUN_8001a9cc'],atlases=metadata,rendered=rendered,menuMessageIDs=menu_ids),indent=2));(out/'messages.json').write_text(json.dumps(bankrecords,indent=2))
print('Exported',count,'original messages;',len(rendered),'message images; font12/16 pixel all4palette styles')

cards=[]
for cid in range(52):
 rid=425+cid;r=resources[rid];im,_,_,_,_=read_tim(data,r['offset']);file=f'card_{cid:02}.png';im.save(out/file);cards.append(dict(id=cid,file=file,width=im.width,height=im.height,messageId=239+cid,messageFile=f'message_{239+cid:04}.png',resource=rid,offset=r['offset'],sourceFunction='FUN_80100698: resource = cardId + 0x1a9'))
(out/'cards.json').write_text(json.dumps(cards,indent=2))
