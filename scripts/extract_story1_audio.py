#!/usr/bin/env python3
"""Original first-story audio packs. Uses existing verified VAB PCM extraction; no emulator."""
import json,struct,shutil,hashlib
from pathlib import Path
from extract_sequences import parse_seq
ROOT=Path(__file__).resolve().parents[1]
def extract():
 data=(ROOT/'extracted/disc/DATA.BIN').read_bytes();exe=(ROOT/'extracted/disc/SLPS_035.53').read_bytes();at=lambda a:a-0x80010000+0x800
 manifest=json.loads((ROOT/'extracted/manifest.json').read_text());audio=json.loads((ROOT/'extracted/audio/manifest.json').read_text())
 packages={p['offset']:p for p in manifest['packages']};banks={b['package_offset']:b for b in audio['banks']};samples={s['id']:s for s in audio['samples']}
 out=ROOT/'extracted/story1-audio';(out/'samples').mkdir(parents=True,exist_ok=True)
 voice_bases=struct.unpack_from('<14H',exe,at(0x80065408));story_bases=struct.unpack_from('<17H',exe,at(0x80065480))
 resources=[('menu',1465),('board',1447),('combat',1446),('story0',story_bases[0])]
 for character in [12,10]:
  for voice in range(12):resources.append((f'character-{character}-voice-{voice}',voice_bases[character]+voice))
 result=[];used=set()
 for id,resource in resources:
  sector,size=struct.unpack_from('<II',data,0x44+resource*8);offset=(sector-212)*2048;p=packages[offset];bank=banks[offset];vh=(ROOT/'extracted/audio'/bank['vh']).read_bytes();programs=[];group=0
  for program_id in range(128):
   rec=vh[32+program_id*16:48+program_id*16];count=rec[0]
   if not count:continue
   tones=[]
   for t in range(count):
    tr=vh[0x820+group*512+t*32:0x820+group*512+(t+1)*32];sample_id=int.from_bytes(tr[22:24],'little',signed=True);sample=next((s['id'] for s in bank['samples'] if s['vag_index']==sample_id),None)
    if sample:used.add(sample)
    tones.append(dict(priority=tr[0],mode=tr[1],volume=tr[2],pan=tr[3],center=tr[4],shift=tr[5],minNote=tr[6],maxNote=tr[7],vibrato=list(tr[8:10]),portamento=list(tr[10:12]),pitchBend=list(tr[12:14]),adsr1=int.from_bytes(tr[16:18],'little'),adsr2=int.from_bytes(tr[18:20],'little'),sampleIndex=sample_id,sample=sample))
   programs.append(dict(id=program_id,volume=rec[1],priority=rec[2],mode=rec[3],pan=rec[4],tones=tones));group+=1
  seqpart=p['entries'][2];sub=packages.get(seqpart['offset']);entries=sub['entries'] if sub else [seqpart]
  seqs=[dict(**parse_seq(data[e['offset']:e['offset']+e['size']]),sourceOffset=e['offset'],sourceSize=e['size'],sha256=hashlib.sha256(data[e['offset']:e['offset']+e['size']]).hexdigest()) for e in entries]
  result.append(dict(id=id,resource=resource,packageOffset=offset,sha256=hashlib.sha256(data[offset:offset+size]).hexdigest(),volume=vh[24],pan=vh[25],programs=programs,sequences=seqs))
 sampledata=[]
 for id in sorted(used):
  sample=samples[id];shutil.copyfile(ROOT/'extracted/audio'/sample['wav'],out/'samples'/f'{id}.wav');sampledata.append({k:sample[k] for k in ['id','sample_rate','sample_count','loop_start_sample','loop_end_sample','loop_repeat']})
 index=dict(banks=result,samples=sampledata,sourceFunctions={'menu':'800172ec','board':'80018890','combat':'80018c00','story0':'800190fc + table80065480','character':'800188f0 + table80065408'})
 (out/'index.json').write_text(json.dumps(index,separators=(',',':')))
 print(json.dumps(dict(banks=len(result),sequences=sum(len(b['sequences']) for b in result),samples=len(used),bytes=sum(p.stat().st_size for p in (out/'samples').glob('*.wav')))))
 return index
if __name__=='__main__':extract()
