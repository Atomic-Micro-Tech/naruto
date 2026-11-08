#!/usr/bin/env python3
"""Optional independent XA codec comparison. Requires PyAV15.1.0.
Compare every real sector against FFmpeg's adpcm_xa, preserving history.
Hardware and FFmpeg predictor rounding differ; compare FFmpeg mode exactly.
"""
from pathlib import Path
import array,hashlib,json,sys,wave
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'scripts'))
from extract_xa import Decoder,sector_payload
import av
m=json.loads((ROOT/'extracted/xa/manifest.json').read_text());d=Decoder();count=0;frames=0
with next(ROOT.glob('*.bin')).open('rb') as f:
 for clip in m['clips']:
  ctx=av.CodecContext.create('adpcm_xa','r');ctx.sample_rate=clip['rate'];ctx.layout='mono' if clip['channels']==1 else 'stereo';history=[0]*4
  for lba in clip['sector_lbas']:
   f.seek(lba*2352);p=sector_payload(f.read(2352));pcm=d.decode(p,clip,history,'ffmpeg')
   decoded=ctx.decode(av.Packet(p));assert len(decoded)==1
   frame=decoded[0];assert frame.samples==len(pcm)//clip['channels']
   expected=array.array('h');expected.frombytes(bytes(frame.planes[0])[:frame.samples*2])
   assert clip['channels']==1,'Extend planar->interleaved comparison before stereo validation'
   assert pcm==expected,(clip['id'],lba)
   count+=1;frames+=frame.samples
  path=ROOT/'extracted/xa'/clip['wav']
  assert hashlib.sha256(path.read_bytes()).hexdigest()==clip['wav_sha256']
  with wave.open(str(path)) as w:
   assert w.getnchannels()==clip['channels'] and w.getframerate()==clip['rate'] and w.getnframes()==clip['samples'] and w.getsampwidth()==2
report=dict(pyav_version=av.__version__,ffmpeg_libraries=av.library_versions,clips=len(m['clips']),sectors_compared=count,pcm_samples_compared=frames,ffmpeg_rounding_matches_exactly=True,all_exported_wav_headers_and_hashes_verified=True,exported_arithmetic='hardware (per-product truncation); not byte-identical to FFmpeg combined rounded arithmetic')
(ROOT/'extracted/xa/validation.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
