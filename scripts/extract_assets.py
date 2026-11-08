#!/usr/bin/env python3
"""Extract SLPS-03553 resources without modifying the supplied raw disc.
PK02 layout is recovered from FUN_8001e50c / FUN_8001ec64.
TIMs use Sony's standard format. No palette guessing in the TIM export.
"""
import argparse, hashlib, json, struct, sys
from pathlib import Path
from PIL import Image, ImageDraw

ROOT=Path(__file__).resolve().parents[1]
U32=lambda b,o: struct.unpack_from('<I',b,o)[0]

def disc_files(path,out):
    out.mkdir(parents=True,exist_ok=True)
    with path.open('rb') as f:
        def sector(lba):
            f.seek(lba*2352)
            raw=f.read(2352)
            if len(raw)!=2352 or raw[:12]!=b'\0'+b'\xff'*10+b'\0' or raw[15]!=2:
                raise ValueError(f'Invalid MODE2 sector {lba}')
            return raw[24:2072]
        pvd=sector(16)
        if pvd[1:6]!=b'CD001': raise ValueError('ISO9660 PVD missing')
        root=pvd[156:190]; lba,size=U32(root,2),U32(root,10)
        directory=b''.join(sector(lba+i) for i in range((size+2047)//2048))[:size]
        pos=0;entries=[]
        while pos<len(directory):
            n=directory[pos]
            if not n: pos=(pos//2048+1)*2048;continue
            r=directory[pos:pos+n];pos+=n
            if r[25]&2:continue
            name=r[33:33+r[32]].decode('ascii').split(';')[0]
            if Path(name).name!=name:raise ValueError('Unsafe ISO name')
            lba,size=U32(r,2),U32(r,10)
            # DATA2 is XA audio: exporting 2048 bytes would discard Form2 payload.
            entries.append(dict(name=name,lba=lba,size=size))
            if name in ('DATA2.BIN','DUMMY.BIN'):continue
            with (out/name).open('wb') as dst:
                for i in range((size+2047)//2048):dst.write(sector(lba+i)[:min(2048,size-i*2048)])
        return entries

def block(b,p):
    n,x,y,w,h=struct.unpack_from('<I4H',b,p)
    if not (0<w<=1024 and 0<h<=512 and n==12+2*w*h and p+n<=len(b)):
        raise ValueError('Invalid TIM block')
    return dict(x=x,y=y,w=w,h=h,data=b[p+12:p+n]),p+n

def color(v):
    # STP preserved separately in raw TIM; transparent black only.
    return tuple(((v>>s)&31)*255//31 for s in (0,5,10))+(0 if v==0 else 255,)

def read_tim(b,o):
    if b[o:o+4]!=b'\x10\0\0\0':raise ValueError('No TIM')
    flags=U32(b,o+4)
    if flags & 0xffff not in (2,3,8,9):raise ValueError('Unsupported TIM')
    p=o+8;pal=None
    if flags&8:pal,p=block(b,p)
    pix,p=block(b,p);mode=flags&7;raw=pix['data']
    if mode==2:
        pixels=[color(v[0]) for v in struct.iter_unpack('<H',raw)];width=pix['w']
    elif mode==3:
        width=pix['w']*2//3
        pixels=[tuple(raw[y*pix['w']*2+x*3:y*pix['w']*2+x*3+3])+(255,) for y in range(pix['h']) for x in range(width)]
    else:
        palette=[color(v[0]) for v in struct.iter_unpack('<H',pal['data'])]
        required=16 if mode==0 else 256
        if len(palette)<required:raise ValueError('Incomplete CLUT')
        ids=[n for v in raw for n in (v&15,v>>4)] if mode==0 else raw
        pixels=[palette[v] for v in ids];width=pix['w']*(4 if mode==0 else 2)
    im=Image.new('RGBA',(width,pix['h']));im.putdata(pixels)
    return im,p,flags,pix,pal

def packages(b):
    out=[];p=0
    while (p:=b.find(b'PK02',p))>=0:
        o=p;p+=4
        try:
            count=U32(b,o+4)
            if not 0<count<4096:continue
            entries=[struct.unpack_from('<II',b,o+12+i*8) for i in range(count)]
            if any(off<12+count*8 or size==0 or o+off+size>len(b) for off,size in entries):continue
            out.append(dict(offset=o,tag=b[o+8:o+12].decode('ascii',errors='replace'),entries=[dict(offset=o+x,size=n) for x,n in entries]))
        except struct.error:continue
    return out

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--disc',type=Path,default=next(ROOT.glob('*.bin')));ap.add_argument('--output',type=Path,default=ROOT/'extracted');args=ap.parse_args()
    out=args.output;files=disc_files(args.disc,out/'disc')
    b=(out/'disc/DATA.BIN').read_bytes();pk=packages(b)
    resources=[]
    for i in range(0x2f00//8):
        lba,size=struct.unpack_from('<II',b,0x44+i*8);o=(lba-212)*2048
        if o<0 or o+size>len(b):raise ValueError(f'Resource {i} outside DATA.BIN')
        resources.append(dict(id=i,lba=lba,offset=o,size=size,magic=b[o:o+12].hex()))
    (out/'textures').mkdir(exist_ok=True);(out/'tim').mkdir(exist_ok=True)
    entries=[];p=0
    while (p:=b.find(b'\x10\0\0\0',p))>=0:
        o=p;p+=4
        try:im,end,flags,pix,pal=read_tim(b,o)
        except (ValueError,struct.error):continue
        stem=f'tim_{o:08x}';im.save(out/'textures'/f'{stem}.png');(out/'tim'/f'{stem}.tim').write_bytes(b[o:end])
        parent=next((r['id'] for r in resources if r['offset']<=o<r['offset']+r['size']),None)
        entries.append(dict(id=stem,offset=o,size=end-o,mode=flags,width=im.width,height=im.height,resource=parent,sha256=hashlib.sha256(b[o:end]).hexdigest(),png=f'textures/{stem}.png',palette_rows=pal['h'] if pal else 0))
    for page in range((len(entries)+79)//80):
        group=entries[page*80:(page+1)*80];sheet=Image.new('RGB',(1200,120*10),(34,39,45));draw=ImageDraw.Draw(sheet)
        for j,e in enumerate(group):
            im=Image.open(out/e['png']);im.thumbnail((144,96));x=(j%8)*150;y=(j//8)*120
            sheet.paste(im,(x+(150-im.width)//2,y),im);draw.text((x+3,y+97),e['id'][4:],fill='white');draw.text((x+3,y+108),f"{e['width']}x{e['height']} r{e['resource']}",fill='#a8b4c0')
        sheet.save(out/f'contact-{page:02}.jpg')
    manifest=dict(disc=args.disc.name,files=files,resources=resources,packages=pk,textures=entries)
    (out/'manifest.json').write_text(json.dumps(manifest,indent=2))
    print(f'{len(resources)} indexed resources, {len(pk)} PK02 packages, {len(entries)} TIM textures exported to {out}')

if __name__=='__main__':main()
