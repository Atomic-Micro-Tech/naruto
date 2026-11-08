#!/usr/bin/env python3
"""Pack original XA sound groups and a pure-JS codec for lazy browser audio.
No lossy re-encoding; strips sector headers/padding only. Does not edit Site.
"""
from pathlib import Path
import hashlib,json,shutil
from extract_xa import sector_payload,validate_groups
ROOT=Path(__file__).resolve().parents[1];out=ROOT/'extracted/xa/browser';(out/'raw').mkdir(parents=True,exist_ok=True)
m=json.loads((ROOT/'extracted/xa/manifest.json').read_text());entries=[]
with (ROOT/m['disc']).open('rb') as disc:
 for clip in m['clips']:
  raw=bytearray();source_hash=hashlib.sha256()
  for lba in clip['sector_lbas']:
   disc.seek(lba*2352);sector=disc.read(2352);source_hash.update(sector)
   payload=sector_payload(sector);validate_groups(payload,clip['bits']);raw.extend(payload)
  if source_hash.hexdigest()!=clip['raw_sector_sha256']:raise ValueError(f'Source disc mismatch for clip {clip["id"]}')
  name=f'raw/xa_{clip["id"]:04}.xadata';(out/name).write_bytes(raw)
  entries.append(dict(id=clip['id'],group=clip['group'],channel=clip['channel'],channels=clip['channels'],rate=clip['rate'],bits=clip['bits'],frames=clip['samples'],duration=clip['duration_seconds'],byteLength=len(raw),sha256=hashlib.sha256(raw).hexdigest(),file=name))
index=dict(format='XA sound groups,128bytes×18 per original audio sector',arithmetic='hardware per-product truncation',zeroLengthIds=[c['id'] for c in m['skipped']],groupTable=m['lookup']['group_table'],clips=entries)
(out/'index.json').write_text(json.dumps(index,separators=(',',':'))+'\n');shutil.copy2(ROOT/'research/xa-decoder.mjs',out/'xa-decoder.mjs')
print(f'Packed{len(entries)} XA clips; {sum(e["byteLength"] for e in entries):,} bytes; no additional compression/loss.')
