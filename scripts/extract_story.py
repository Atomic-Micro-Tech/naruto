#!/usr/bin/env python3
"""Recover original NARUTOSceneV001 animation/story tables and referenced assets.
No CPU emulation. Field evidence: decompiled/STORY_ENGINE.c, research/story.md.
"""
from pathlib import Path
import json,struct,hashlib,shutil
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
TABLES=[('sprites','6h'),('events','6h'),('positions','8h'),('colors','2h4B'),('scales','2h2f'),('blends','2h'),('palettes','2h'),('layers','14h'),('clips','4h'),('objects','6h'),('sequence','h')]

def parse_scene(blob):
    if blob[:16]!=b'NARUTOSceneV001\x1a':raise ValueError('Unknown scene signature')
    offsets=struct.unpack_from('<11I',blob,16);count=struct.unpack_from('<H',blob,60)[0]
    if any(o<64 or o>len(blob) for o in offsets):raise ValueError('Scene offset out of range')
    result={'sequenceCount':count,'tables':{},'tableOffsets':dict(zip([t[0] for t in TABLES],offsets))}
    # Physical tables may be empty and therefore share an offset; the next table
    # in physical order (not next strictly greater value) determines its extent.
    physical=[0,1,2,5,3,4,6,7,8,9,10]
    for pos,idx in enumerate(physical):
        name,fmt=TABLES[idx];start=offsets[idx];end=offsets[physical[pos+1]] if pos+1<len(physical) else len(blob)
        size=struct.calcsize('<'+fmt)
        if end<start or (end-start)%size:raise ValueError(f'{name}: invalid table extent')
        result['tables'][name]=[list(x) for x in struct.iter_unpack('<'+fmt,blob[start:end])]
    t=result['tables'];t['sequence']=[x[0] for x in t['sequence']]
    if len(t['sequence'])!=count:raise ValueError('Sequence count mismatch')
    if any(i<0 or i>=len(t['clips']) for i in t['sequence']):raise ValueError('Sequence reference invalid')
    for c in t['clips']:
        if c[2]<0 or c[3]<0 or c[2]+c[3]>len(t['layers']):raise ValueError('Clip layer span invalid')
    for layer in t['layers']:
        for j,key in enumerate(['events','positions','blends','colors','scales','palettes']):
            a,n=layer[2+j*2:4+j*2]
            if a<0 or n<0 or a+n>len(t[key]):raise ValueError(f'Layer {key} span invalid')
    return result

def parse_vram(blob):
    if blob[:16]!=b'NARUTOVRAM V000\x1a':raise ValueError('Unknown VRAM signature')
    count=struct.unpack_from('<I',blob,16)[0];p=20;vram=[0]*(1024*512);uploads=[]
    for i in range(count):
        x,y,w,h=struct.unpack_from('<2h2H',blob,p);p+=8;n=w*h*2
        x+=384
        if x<0 or x+w>1024 or y+h>512:raise ValueError('Story texture upload outside allocated VRAM')
        words=struct.unpack_from('<'+'H'*(w*h),blob,p);p+=(n+3)&~3
        for row in range(h):vram[(y+row)*1024+x:(y+row)*1024+x+w]=words[row*w:(row+1)*w]
        uploads.append(dict(xWords=x,y=y,widthWords=w,height=h))
    palettes=[];count=struct.unpack_from('<I',blob,p)[0];p+=4
    for i in range(count):
        n=struct.unpack_from('<I',blob,p)[0];p+=4
        palettes.append(list(struct.unpack_from('<'+'H'*n,blob,p)));p+=n*2
    if p!=len(blob):raise ValueError(f'Unexpected VRAM tail {len(blob)-p}')
    return vram,palettes,uploads

def rgba(v):
    return ((v&31)*8,((v>>5)&31)*8,((v>>10)&31)*8,0 if v==0 else 255)

def export_sprites(scene,blob,out):
    out.mkdir(parents=True,exist_ok=True);vram,palettes,uploads=parse_vram(blob);sprites=[];t=scene['tables']
    overrides={}
    for layer in t['layers']:
        if layer[0]!=0:continue
        for e in t['events'][layer[2]:layer[2]+layer[3]]:
            for key in t['palettes'][layer[12]:layer[12]+layer[13]]:overrides.setdefault(e[1],set()).add(key[1])
    for sid,(bits,pal,x,y,w,h) in enumerate(t['sprites']):
        item=dict(id=sid,bits=bits,palette=pal,xWords=x,y=y,width=w,height=h,anchor=[0,0],paletteVariants={})
        candidates=overrides.get(sid,set())|({pal} if pal>=0 else set())
        if not candidates:item['unresolved']='No palette: requires caller-provided palette key'
        for pi in sorted(candidates):
            if pi<0 or pi>=len(palettes):continue
            if bits not in (4,8):raise ValueError('Unknown sprite bit depth')
            factor=16//bits;pixels=[];ax=x+384
            tx=ax//64*64;ty=y//256*256;u=(ax%64)*factor;v=y%256
            for yy in range(h):
                for xx in range(w):
                    sx=(u+xx)&255;sy=(v+yy)&255;word=vram[(ty+sy)*1024+tx+sx//factor]
                    pixels.append(rgba(palettes[pi][word>>(sx%factor*bits)&((1<<bits)-1)]))
            im=Image.new('RGBA',(w,h));im.putdata(pixels);name=f'sprite_{sid:03}_p{pi:02}.png';im.save(out/name)
            item['paletteVariants'][str(pi)]=name
            if pi==pal:item['file']=name
        sprites.append(item)
    return dict(sprites=sprites,palettes=palettes,uploads=uploads,stp='Original bit15 retained in palette words; PNGs are opaque except word0. PS1 blend modes must be applied by renderer.')

def timeline(scene,message_base):
    t=scene['tables'];out=[];start=0
    for seq,clipid in enumerate(t['sequence']):
        clip=t['clips'][clipid];events=[]
        for lid in range(clip[2],clip[2]+clip[3]):
            layer=t['layers'][lid]
            for eid in range(layer[2],layer[2]+layer[3]):
                frame,value,flags,arg,x,y=t['events'][eid]
                e=dict(frame=frame,aggregateFrame=start+frame,layerId=lid,layerType=layer[0],eventId=eid,value=value,flags=flags,arg=arg,x=x,y=y)
                if layer[0]<3:
                    e['kind']='hidden' if value==-1 else 'message' if flags&4 else 'object'
                    if e['kind']=='message' and message_base is not None:e['messageId']=message_base+value
                    elif e['kind']=='object':e['objectId']=value
                else:e['kind']={3:'xaVoice',4:'musicControl',5:'spuSequence',6:'scriptEffect'}.get(layer[0],'unknown')
                events.append(e)
        out.append(dict(index=seq,clipId=clipid,durationTicks=clip[0],aggregateStart=start,events=sorted(events,key=lambda e:(e['frame'],e['layerId'],e['eventId']))));start+=clip[0]-1
    return out

def extract():
    out=ROOT/'extracted/story';out.mkdir(exist_ok=True);(out/'scenes').mkdir(exist_ok=True)
    m=json.loads((ROOT/'extracted/manifest.json').read_text());data=(ROOT/'extracted/disc/DATA.BIN').read_bytes();exe=(ROOT/'extracted/disc/SLPS_035.53').read_bytes()
    def ram(a,n):return exe[a-0x80010000+0x800:a-0x80010000+0x800+n]
    def resource(rid):r=m['resources'][rid];return data[r['offset']:r['offset']+r['size']]
    bases=struct.unpack('<36I',ram(0x800657cc,144));group_table=list(ram(0x80064d1c,60));scene_entries=[];scenes={}
    for rid in range(67,192):
        blob=resource(rid);scene=parse_scene(blob);scene.update(resourceId=rid,vramResourceId=rid+125,sha256=hashlib.sha256(blob).hexdigest())
        scene['timeline']=timeline(scene,None);scenes[rid]=scene
        file=f'scenes/scene_{rid:03}.json';(out/file).write_text(json.dumps(scene,separators=(',',':'))+'\n');scene_entries.append(dict(resourceId=rid,file=file,sequenceCount=scene['sequenceCount']))
    story=[]
    for outcome,first,count in [(0,175,17),(1,166,9)]:
        for scene_id in range(count):
            rid=first+scene_id;scene=scenes[rid];tl=timeline(scene,bases[outcome*18+scene_id]);assetdir=f'assets/scene_{rid:03}';assets=export_sprites(scene,resource(rid+125),out/assetdir)
            assets.update(resourceId=rid+125,sha256=hashlib.sha256(resource(rid+125)).hexdigest(),sceneResourceId=rid)
            (out/assetdir/'sprites.json').write_text(json.dumps(assets,separators=(',',':'))+'\n')
            story.append(dict(outcome=outcome,sceneId=scene_id,sceneResourceId=rid,vramResourceId=rid+125,messageBase=bases[outcome*18+scene_id],timeline=tl,sprites=f'{assetdir}/sprites.json'))
    campaign=[]
    for family in range(3):
        for stage in range(11):
            r=ram(0x80058758+family*0x84+stage*12,12)
            if r[0]==255:break
            entry=dict(campaign=family,stage=stage,scenarioId=r[0],introSceneId=r[2],outroSceneId=r[3],xaFamily=r[4],musicSelectors=list(r[8:12]),raw=list(r),scenes=[])
            for outcome,sid in enumerate([r[2],r[3]]):
                scene=next((s for s in story if s['outcome']==outcome and s['sceneId']==sid),None)
                if scene is None:
                    if sid==255:entry['scenes'].append(dict(outcome=outcome,sceneId=255,status='sentinel: no scene resource'));continue
                    raise ValueError('Campaign story scene reference missing')
                voices=[]
                for clip in scene['timeline']:
                    for event in clip['events']:
                        if event['kind']=='xaVoice':
                            xid=group_table[r[4]+outcome]*16+(event['value']&255)-1
                            voices.append(dict(sequenceIndex=clip['index'],eventId=event['eventId'],aggregateFrame=event['aggregateFrame'],slot=event['value'],xaId=xid))
                entry['scenes'].append(dict(outcome=outcome,sceneId=sid,sceneResourceId=scene['sceneResourceId'],voices=voices))
            campaign.append(entry)
    used_messages=sorted({e['messageId'] for s in story for c in s['timeline'] for e in c['events'] if 'messageId' in e})
    bank=resource(775);count=struct.unpack_from('<H',bank,4)[0];messages=[]
    for mid in used_messages:
        if not 0<=mid<count:raise ValueError('Message reference outside bank')
        off,n=struct.unpack_from('<HH',bank,8+mid*4);stream=struct.unpack_from('<'+'H'*n,bank,8+count*4+off*2)
        messages.append(dict(id=mid,glyphStream=list(stream)))
    (out/'messages.json').write_text(json.dumps(messages,separators=(',',':'))+'\n')
    # Concrete voice IDs are contextual: two campaigns can select the same scene.
    xa_ids={x['id'] for x in json.loads((ROOT/'extracted/xa/browser/index.json').read_text())['clips']}
    for c in campaign:
        for s in c['scenes']:
            for v in s.get('voices',[]):
                if v['xaId'] not in xa_ids:raise ValueError('Story XA event references absent clip')
    (out/'index.json').write_text(json.dumps(dict(sourceFunctions=['80023f10','80024464','80024b70','80026338','80026e24','80028c08','80029ff0','80028440'],sceneResources=scene_entries,storyScenes=story,campaign=campaign,messageResource=775,messageBaseTable=list(bases),xaGroupTable=group_table),indent=2)+'\n')
    for module in ['story-scene.mjs','story-runtime.mjs','story-renderer.mjs']:shutil.copy2(ROOT/'research'/module,out/module)
    print('Recovered',len(scenes),'scene tables;',len(story),'story asset sets;',len(campaign),'campaign entries')
if __name__=='__main__':extract()
