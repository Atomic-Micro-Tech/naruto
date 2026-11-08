#!/usr/bin/env python3
"""Extract six overlays and the original 39-entry scene dispatch table."""
from pathlib import Path
import hashlib
import json
import struct

ROOT = Path(__file__).resolve().parents[1]
data = (ROOT / 'extracted/disc/DATA.BIN').read_bytes()
exe = (ROOT / 'extracted/disc/SLPS_035.53').read_bytes()
scenes = []
for i in range(39):
    offset = 0x800558a8 - 0x80010000 + 0x800 + i * 28
    overlay, init, update, end = struct.unpack_from('<4I', exe, offset)
    name = exe[offset+16:offset+28].split(b'\0', 1)[0].decode('ascii')
    scenes.append(dict(id=i, name=name, overlay=overlay, init=hex(init), update=hex(update), exit=hex(end)))
out = ROOT / 'extracted/overlays'
out.mkdir(parents=True, exist_ok=True)
overlays = []
for i in range(6):
    lba, size = struct.unpack_from('<II', data, 0x44 + i * 8)
    offset = (lba - 212) * 2048
    blob = data[offset:offset+size]
    assert len(blob) == size
    (out / f'overlay_{i}.bin').write_bytes(blob)
    overlays.append(dict(id=i, offset=offset, size=size, loadAddress='0x800ad450',
                         sha256=hashlib.sha256(blob).hexdigest(), scenes=[s for s in scenes if s['overlay'] == i]))
(ROOT / 'research/scenes.json').write_text(json.dumps(dict(scenes=scenes, overlays=overlays), indent=2)+'\n')
print(f'Extracted {len(overlays)} overlays and {len(scenes)} scene records')
