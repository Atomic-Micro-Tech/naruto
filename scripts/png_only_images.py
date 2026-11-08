#!/usr/bin/env python3
"""Validate TIM-to-PNG conversions, remove bundle TIMs, and rewrite metadata."""
import hashlib
import json
from collections import Counter
from pathlib import Path

from PIL import Image
from extract_assets import read_tim
from wav_only_audio import write_json


def load(path):
    return json.loads(path.read_text())


def texture_metadata(entries, image_root):
    """Paths are relative to texture/. Hash/size describe the PNG, not the TIM."""
    result = []
    for original in entries:
        item = dict(original)
        png = image_root / item['png']
        raw = png.read_bytes()
        with Image.open(png) as im:
            if im.format != 'PNG':
                raise ValueError(f'Not a PNG: {png}')
            width, height = im.size
            im.verify()
        if item.get('format') != 'png':
            item['sourceSha256'] = item.pop('sha256')
            item['sourceSize'] = item.pop('size')
            item['sourceMode'] = item.pop('mode')
        item.update(format='png', sourceFormat='tim', file=item['png'],
                    sha256=hashlib.sha256(raw).hexdigest(), size=len(raw), width=width, height=height)
        result.append(item)
    return result


def finalize_png_only(root):
    root = Path(root).resolve()
    manifest = load(root / 'manifest.json')
    records = {r['path']: r for r in manifest['files']}
    entries = load(root / 'texture/textures.json')
    by_id = {t['id']:t for t in entries}
    conversions = []
    # Verify all existing PNGs and every conversion BEFORE removing any TIM.
    for folder in ['image', 'sprite', 'texture']:
        for path in (root / folder).rglob('*'):
            if not path.is_file():
                continue
            if path.suffix == '.json':
                continue
            rel = path.relative_to(root).as_posix()
            if path.suffix == '.png':
                with Image.open(path) as im:
                    if im.format != 'PNG':
                        raise ValueError(f'Wrong image content: {rel}')
                    im.verify()
                if hashlib.sha256(path.read_bytes()).hexdigest() != records[rel]['sha256']:
                    raise ValueError(f'PNG differs from manifest: {rel}')
                continue
            if path.suffix != '.tim' or path.parent != root / 'texture/tim':
                raise ValueError(f'Unmapped non-PNG image needs conversion: {rel}')
            meta = by_id[path.stem]
            raw = path.read_bytes()
            sha = hashlib.sha256(raw).hexdigest()
            if sha != records[rel]['sha256'] or sha != meta.get('sourceSha256', meta['sha256']):
                raise ValueError(f'TIM differs from original: {rel}')
            decoded, end, _, _, _ = read_tim(raw, 0)
            if end != len(raw):
                raise ValueError(f'TIM has unparsed trailing data: {rel}')
            destination = root / 'texture' / meta['png']
            with Image.open(destination) as existing:
                rgba = existing.convert('RGBA')
                if decoded.size != rgba.size or decoded.tobytes() != rgba.tobytes():
                    raise ValueError(f'PNG does not match TIM decode: {destination}')
            conversions.append(dict(oldPath=rel, path=destination.relative_to(root).as_posix(),
                                    resourceIds=[meta['resource']], sourceSha256=sha,
                                    sha256=hashlib.sha256(destination.read_bytes()).hexdigest(),
                                    verification='RGBA pixels exactly match original TIM decoder output'))
    converted = texture_metadata(entries, root / 'texture')
    write_json(root / 'texture/textures.json', converted)
    history = root / 'metadata/image/conversions.json'
    if conversions:
        write_json(history, dict(format='png', pathBase='Naruto-Online/', conversions=conversions,
                                 note='oldPath is historical, not a live asset reference. PNGs retain the existing decoder output; GPU STP/blending behavior is not baked into these images.'))
    for conversion in conversions:
        (root / conversion['oldPath']).unlink()
        records.pop(conversion['oldPath'], None)
    tim_dir = root / 'texture/tim'
    if tim_dir.exists() and not any(tim_dir.iterdir()):
        tim_dir.rmdir()
    for rel in ['texture/textures.json', 'metadata/image/conversions.json', 'README.md']:
        path = root / rel
        if not path.exists():
            continue
        raw = path.read_bytes()
        records[rel] = dict(records.get(rel, {}), path=rel, source='scripts/png_only_images.py',
                            category=rel.split('/')[0], bytes=len(raw), sha256=hashlib.sha256(raw).hexdigest(), derived=True)
    manifest.update(files=[records[k] for k in sorted(records)], fileCount=len(records),
                    totalBytes=sum(r['bytes'] for r in records.values()),
                    counts=dict(Counter(r['category'] for r in records.values())), imageFormat='png')
    write_json(root / 'manifest.json', manifest)
    registry_path = root / 'resource-library.json'
    if registry_path.exists():
        registry = load(registry_path)
        removed = {c['oldPath'] for c in conversions}
        registry['files'] = {k:v for k,v in registry['files'].items() if k not in removed}
        write_json(registry_path, registry)
    from gameplay_asset_library import build_registry
    build_registry(root)
    return dict(removedTimFiles=len(conversions), pngFiles=sum(1 for p in root.rglob('*.png')))


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1] / 'Naruto-Online')
    print(json.dumps(finalize_png_only(parser.parse_args().root), indent=2))
