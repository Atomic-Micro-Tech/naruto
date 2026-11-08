#!/usr/bin/env python3
"""Export BOARD effect 1 (resource 649), retaining its original sprite commands.

No frame rasterization or replacement artwork: one PNG atlas and source metadata.
Re-running reuses registered PNG bytes, including exports shared by other arenas.
"""
import json
import struct
import zlib
from pathlib import Path
from gameplay_asset_library import digest, index_records, persist

ROOT = Path(__file__).resolve().parents[1]


def main():
    data = (ROOT / 'extracted/disc/DATA.BIN').read_bytes()
    resource = json.loads((ROOT / 'extracted/manifest.json').read_text())['resources'][649]
    assets = ROOT / 'Naruto-Online/assets'
    registry = json.loads((assets / 'resource-library.json').read_text())
    manifest = json.loads((assets / 'manifest.json').read_text())

    def members(offset):
        assert data[offset:offset + 4] == b'PK02'
        return [(offset + a, b) for a, b in (
            struct.unpack_from('<II', data, offset + 12 + i * 8)
            for i in range(struct.unpack_from('<I', data, offset + 4)[0]))]

    def register(path, content, **extra):
        sha = digest(content)
        if path.endswith('.png'):
            for entry in registry['files'].values():
                if entry['sha256'] == sha and entry['path'].endswith('.png'):
                    path = entry['path']
                    if (assets / path).read_bytes() != content:
                        raise ValueError(f'Registered shared asset changed: {path}')
                    break
        target = assets / path
        target.parent.mkdir(parents=True, exist_ok=True)
        if not target.exists() or target.read_bytes() != content:
            target.write_bytes(content)
        old = registry['files'].get(path, {})
        entry = dict(path=path, source='extracted/disc/DATA.BIN#resource=649',
                     bytes=len(content), sha256=sha,
                     resourceIds=sorted(set(old.get('resourceIds', [])) | {649}),
                     arenaIds=sorted(set(old.get('arenaIds', [])) | {1}))
        registry['files'][path] = entry
        manifest['files'] = [f for f in manifest['files'] if f['path'] != path]
        manifest['files'].append(dict(entry, category=path.split('/')[0], derived=True, **extra))
        return path

    parts = members(resource['offset'])
    tim = parts[0][0]
    assert struct.unpack_from('<II', data, tim) == (16, 8)
    clut_size, _, _, colors, rows = struct.unpack_from('<I4H', data, tim + 8)
    assert (colors, rows) == (16, 1)
    palette = struct.unpack_from('<16H', data, tim + 20)
    pos = tim + 8 + clut_size
    _, _, _, width, height = struct.unpack_from('<I4H', data, pos)
    width *= 4
    raw = data[pos + 12:pos + 12 + width * height // 2]
    rgba = [bytes([*((v >> shift & 31) * 255 // 31 for shift in (0, 5, 10)),
                   0 if v == 0 else 255]) for v in palette]
    scanlines = b''.join(b'\0' + b''.join(rgba[raw[i // 2] >> (i % 2 * 4) & 15]
                                       for i in range(y * width, (y + 1) * width))
                         for y in range(height))

    def chunk(kind, payload):
        return struct.pack('>I', len(payload)) + kind + payload + struct.pack('>I', zlib.crc32(kind + payload))

    png = (b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>2I5B', width, height, 8, 6, 0, 0, 0))
           + chunk(b'IDAT', zlib.compress(scanlines, 9)) + chunk(b'IEND', b''))
    atlas = register('texture/effects/seal.png', png, width=width, height=height)
    branches = members(members(members(parts[1][0])[0][0])[0][0])
    sequence = [dict(zip(('frame', 'duration', 'offsetX', 'offsetY'), struct.unpack_from('<4h', data, o)))
                for o, _ in members(branches[0][0])]
    frames = []
    signed = lambda n: n - 65536 if n >= 32768 else n
    for offset, size in members(branches[1][0]):
        count = struct.unpack_from('<I', data, offset)[0]
        assert size == 4 + count * 20
        sprites = []
        for i in range(count):
            v = struct.unpack_from('<10H', data, offset + 4 + i * 20)
            assert v[7] >> 14 == 0 and (v[3] >> 7 & 3) == 0
            sprites.append(dict(u=v[0] & 255, v=v[0] >> 8, x=(v[1] & 255) - 127,
                                y=(v[1] >> 8) - 127, width=v[4], height=v[5],
                                rotation=v[6], scaleX=signed(v[8]), scaleY=signed(v[9]),
                                blend=v[3] >> 5 & 3, translucent=bool(v[2] >> 15)))
        frames.append(sprites)
    meta = dict(resourceId=649, effectId=1, atlas='/' + 'assets/' + atlas,
                sourceFunctions=['FUN_80116ae8', 'FUN_800c5978', 'FUN_800227f0', 'FUN_80022aa8'],
                fps=30, barrierStep=39, sequence=sequence, frames=frames,
                notes='Original pixels and sprite commands; 30 presentation updates/s follows naruto_basic.mp4. PS1 blend approximated with Phaser additive blending.')
    register('sprite/effects/seal.json', (json.dumps(meta, indent=2) + '\n').encode())
    registry['resources']['649'] = dict(resource, paths=[])
    persist(assets, index_records(registry['files'], registry['sourceExecutableSha256'], registry['resources']))
    manifest['files'].sort(key=lambda f: f['path'])
    for category in ('texture', 'sprite'):
        manifest['counts'][category] = sum(f['category'] == category for f in manifest['files'])
    (assets / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    print(f'Exported seal: {len(sequence)} steps, {len(frames)} frames, atlas {width}x{height}')


if __name__ == '__main__':
    main()
