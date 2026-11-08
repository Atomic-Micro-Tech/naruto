#!/usr/bin/env python3
"""Extract original PsyQ SEQ events + VAB tone programs for native browser playback.
SEQ layout/control bytes: SLPS_035.53.c _SsInitSoundSeq/_SsGetSeqData.
Music IDs: main 0x800652b0, resources1242..1272. No synthesized replacement music.
"""
import json,struct,shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def parse_seq(raw):
 if raw[:4]!=b'pQES' or int.from_bytes(raw[4:8],'big')!=1:raise ValueError('Not SEQv1')
 ppqn=int.from_bytes(raw[8:10],'big');tempo=int.from_bytes(raw[10:13],'big');pos=15;tick=0;status=None;events=[]
 def byte():
  nonlocal pos
  n=raw[pos];pos+=1;return n
 def vlq():
  n=0
  for _ in range(4):
   b=byte();n=n*128+(b&127)
   if not b&128:return n
  raise ValueError('Invalid delta')
 while pos<len(raw):
  tick+=vlq();b=byte()
  if b&128:status=b;b=byte()
  if status is None:raise ValueError('Missing running status')
  kind=status&240;channel=status&15
  if status==255:
   if b==47:events.append([tick,'end']);break
   if b!=81:raise ValueError(f'Unknown meta {b}')
   events.append([tick,'tempo',(byte()<<16)|(byte()<<8)|byte()]);continue
  if kind in (128,144,160,176,224):values=[b,byte()]
  elif kind in (192,208):values=[b]
  else:raise ValueError(f'Unknown event {status}')
  events.append([tick,status,*values])
 return dict(ppqn=ppqn,tempo=tempo,timeSignature=list(raw[13:15]),events=events,ticks=tick)
def main():
 data=(ROOT/'extracted/disc/DATA.BIN').read_bytes();manifest=json.loads((ROOT/'extracted/manifest.json').read_text());audio=json.loads((ROOT/'extracted/audio/manifest.json').read_text());packages={p['offset']:p for p in manifest['packages']};banks={b['package_offset']:b for b in audio['banks']};samples={s['id']:s for s in audio['samples']};out=ROOT/'extracted/music';(out/'samples').mkdir(parents=True,exist_ok=True);result=[];used=set()
 for resource in [*range(1242,1273),1464]:
  sector,size=struct.unpack_from('<II',data,0x44+resource*8);offset=(sector-212)*2048;p=packages[offset];bank=banks[offset];vh=(ROOT/'extracted/audio'/bank['vh']).read_bytes();programs=[];group=0
  for id in range(128):
   rec=vh[32+id*16:48+id*16];count=rec[0]
   if not count:continue
   tones=[]
   for t in range(count):
    tr=vh[0x820+group*512+t*32:0x820+group*512+(t+1)*32];sampleId=int.from_bytes(tr[22:24],'little',signed=True);sample=next((s['id'] for s in bank['samples'] if s['vag_index']==sampleId),None)
    if sample:used.add(sample)
    tones.append(dict(priority=tr[0],mode=tr[1],volume=tr[2],pan=tr[3],center=tr[4],shift=tr[5],minNote=tr[6],maxNote=tr[7],vibrato=list(tr[8:10]),portamento=list(tr[10:12]),pitchBend=list(tr[12:14]),adsr1=int.from_bytes(tr[16:18],'little'),adsr2=int.from_bytes(tr[18:20],'little'),sampleIndex=sampleId,sample=sample))
   programs.append(dict(id=id,volume=rec[1],priority=rec[2],mode=rec[3],pan=rec[4],tones=tones));group+=1
  seqpart=p['entries'][2];sub=packages.get(seqpart['offset']);entries=sub['entries'] if sub else [seqpart];seqs=[parse_seq(data[e['offset']:e['offset']+e['size']]) for e in entries]
  result.append(dict(id=resource-1242 if resource<1273 else 'menu-sfx',resource=resource,volume=vh[24],pan=vh[25],programs=programs,sequences=seqs))
 sampledata=[]
 for id in sorted(used):
  sample=samples[id];shutil.copyfile(ROOT/'extracted/audio'/sample['wav'],out/'samples'/f'{id}.wav');sampledata.append({k:sample[k] for k in ['id','sample_rate','sample_count','loop_start_sample','loop_end_sample','loop_repeat']})
 (out/'index.json').write_text(json.dumps(dict(banks=result,samples=sampledata,sequenceVolumes=list((ROOT/'extracted/disc/SLPS_035.53').read_bytes()[0x55bcc:0x55bcc+31])),separators=(',',':')))
 print(json.dumps(dict(banks=len(result),sequences=sum(len(b['sequences']) for b in result),samples=len(used),events=sum(len(s['events']) for b in result for s in b['sequences']))))
if __name__=='__main__':main()
