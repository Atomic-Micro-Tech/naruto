#!/usr/bin/env python3
"""Resource inventory and content-verified reuse for Naruto-Online exports."""
import argparse
import hashlib
import json
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = 'resource-library.json'
# JSON can contain relative paths; identical bytes in different folders are not
# necessarily interchangeable. Reuse only standalone binary assets by content.
REUSABLE = {'.png', '.wav', '.bin'}


def load(path):
    return json.loads(path.read_text())


def digest(data):
    return hashlib.sha256(data).hexdigest()


def inside(root, relative):
    path = (root / relative).resolve()
    if Path(relative).is_absolute() or not path.is_relative_to(root.resolve()):
        raise ValueError(f'Asset path outside library: {relative}')
    return path


def persist(root, registry):
    target = root / REGISTRY
    data = (json.dumps(registry, ensure_ascii=False, indent=2) + '\n').encode()
    if target.exists() and target.read_bytes() == data:
        return
    temp = target.with_suffix('.json.tmp')
    temp.write_bytes(data)
    temp.replace(target)


def index_records(records, source_disc, resource_info):
    groups = defaultdict(list)
    resources = defaultdict(set)
    for rel, rec in sorted(records.items()):
        ext = Path(rel).suffix.lower()
        key = f'sha256:{rec["sha256"]}:{ext[1:]}' if ext in REUSABLE else f'path:{rel}'
        groups[key].append(rel)
        for rid in rec['resourceIds']:
            resources[rid].add(rel)
    assets = {}
    for key, paths in sorted(groups.items()):
        assets[key] = dict(canonicalPath=paths[0], existingPaths=paths,
                           reusable=Path(paths[0]).suffix.lower() in REUSABLE,
                           sha256=records[paths[0]]['sha256'],
                           resourceIds=sorted({r for p in paths for r in records[p]['resourceIds']}),
                           arenaIds=sorted({a for p in paths for a in records[p]['arenaIds']}))
    by_resource = {str(rid): dict(resource_info.get(str(rid), {}), paths=sorted(paths))
                   for rid, paths in sorted(resources.items())}
    return dict(schemaVersion=1, sourceExecutableSha256=source_disc,
                identity='SHA-256 of exported bytes + file extension; resource ID alone is not an asset identity',
                resourceIdsMeaning='Original resource dependencies/references; does not imply entire resource was exported',
                arenaIdsMeaning='Arena export packages referencing this file, not proof of runtime use in every match',
                fileCount=len(records), assetCount=len(assets), resourceCount=len(by_resource),
                duplicateFileCount=sum(len(v)-1 for v in groups.values()),
                files=dict(sorted(records.items())), assets=assets, resources=by_resource)


def build_registry(root):
    root = root.resolve()
    previous = load(root / REGISTRY) if (root / REGISTRY).exists() else None
    manifest = load(root / 'manifest.json')
    dependencies = defaultdict(set)
    def dep(path, *ids):
        dependencies[path].update(i for i in ids if isinstance(i, int))
    dep('image/arena1/map_00.png', 344)
    dep('image/arena1/map_00.json', 630)
    for folder, filename in [('board','assets.json'),('common','assets.json'),('hud','layout.json')]:
        meta = load(root / 'sprite' / folder / filename)
        for a in meta['assets']:
            rid = a.get('resource', a.get('source', {}).get('resource'))
            dep(f'sprite/{folder}/{a["file"]}', rid)
            dep(f'sprite/{folder}/{filename}', rid)
        for c in meta.get('characters', []):
            for field in ['face','name']:
                dep(f'sprite/{folder}/{c[field]}', c['resource'])
            dep(f'sprite/{folder}/{filename}', c['resource'])
    for c in load(root / 'sprite/board-characters/characters.json')['characters']:
        ids = [c['staticTextureResource'], c['animationResource']]
        for anim in c['animations']:
            dep('sprite/board-characters/' + anim['sprite'], *ids)
        dep('sprite/board-characters/characters.json', *ids)
    for c in load(root / 'image/cards/cards.json'):
        dep('image/cards/' + c['file'], c['resource'])
        dep('image/cards/' + c['messageFile'], 477, 775)
        dep('image/cards/cards.json', c['resource'], 775)
    dep('image/cards/messages.json', 775)
    dep('image/cards/rendering.json', 477, 775)
    for p in (root / 'texture/font').iterdir():
        dep(p.relative_to(root).as_posix(), 477)
    for p in (root / 'image/results').iterdir():
        dep(p.relative_to(root).as_posix(), 41)
    originals = load(ROOT / 'extracted/manifest.json')['resources']
    for t in load(root / 'texture/textures.json'):
        dep('texture/' + t['png'], t['resource'])
        dep('texture/textures.json', t['resource'])
    image_history = root / 'metadata/image/conversions.json'
    if image_history.exists():
        for item in load(image_history)['conversions']:
            dep('metadata/image/conversions.json', *item['resourceIds'])
    for p in load(root / 'texture/packed/manifest.json'):
        for r in originals:
            if r['offset'] <= p['offset'] < r['offset'] + r['size']:
                dep('texture/packed/' + p['id'] + '.png', r['id'])
                dep('texture/packed/manifest.json', r['id'])
    if (root / 'metadata/audio/catalog.json').exists():
        catalog = load(root / 'metadata/audio/catalog.json')
        for entry in catalog['tracks'] + catalog['samples']:
            dep(entry['path'], *entry['resourceIds'])
            dep('metadata/audio/catalog.json', *entry['resourceIds'])
            dep('metadata/audio/render-report.json', *entry['resourceIds'])
            dep('metadata/audio/conversion-history.json', *entry['resourceIds'])
    else:
        for b in load(root / 'audio/index.json')['banks']:
            dep('audio/index.json', b['resource'])
            for program in b['programs']:
                for t in program['tones']:
                    if t.get('sample'):
                        dep('audio/samples/' + t['sample'] + '.wav', b['resource'])
        for j in load(root / 'audio/render-jobs.json'):
            dep(j['path'], j['resource'])
            dep('audio/render-jobs.json', j['resource'])
            dep('audio/render-report.json', j['resource'])
    records = dict(previous['files']) if previous else {}
    for item in manifest['files']:
        rel = item['path']
        if rel in ('README.md','manifest.json'):
            continue
        ids = set(dependencies[rel])
        raw = re.fullmatch(r'audio/source/resource_(\d+)(?:_sequence_\d+)?\.(vh|vb|seq)', rel)
        if raw:
            ids.add(int(raw[1]))
        old = records.get(rel, {})
        records[rel] = dict(path=rel, source=item['source'], bytes=item['bytes'], sha256=item['sha256'],
                            resourceIds=sorted(ids | set(old.get('resourceIds', []))),
                            arenaIds=sorted({manifest['arena']} | set(old.get('arenaIds', []))))
    for rel, rec in records.items():
        data = inside(root, rel).read_bytes()
        if len(data) != rec['bytes'] or digest(data) != rec['sha256']:
            raise ValueError(f'Asset differs from manifest/registry: {rel}')
    disc_hash = digest((ROOT / 'extracted/disc/SLPS_035.53').read_bytes())
    if previous and previous.get('sourceExecutableSha256', previous.get('sourceDiscSha256')) != disc_hash:
        raise ValueError('Registry belongs to another executable/disc edition')
    resource_info = {str(r['id']): dict(offset=r['offset'], size=r['size'], container='extracted/disc/DATA.BIN') for r in originals}
    registry = index_records(records, disc_hash, resource_info)
    persist(root, registry)
    return registry


def reuse_or_copy(root, source, requested_path, *, arena_id, resource_ids=()):
    """Return actual root-relative asset path; caller MUST store it in arena metadata.

    No alias copy or symlink is created when a matching binary already exists.
    Different variants under one resource ID remain separate. Serial calls only.
    """
    root, source = Path(root).resolve(), Path(source)
    non_png_images = {'.tim', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.tga', '.tif', '.tiff', '.dds', '.ktx', '.avif', '.svg', '.ico'}
    if source.suffix.lower() in non_png_images or Path(requested_path).suffix.lower() in non_png_images:
        raise ValueError('Convert images to PNG before registering or copying them')
    if Path(requested_path).parts[0] in {'image', 'sprite', 'texture'} and Path(requested_path).suffix.lower() not in {'.png', '.json'}:
        raise ValueError('Image folders accept PNG assets and JSON metadata only')
    if Path(requested_path).suffix.lower() == '.png':
        from PIL import Image
        with Image.open(source) as im:
            if im.format != 'PNG':
                raise ValueError('PNG extension requires actual PNG content')
            im.verify()
    non_wav_audio = {'.seq', '.vh', '.vb', '.vab', '.vag', '.adpcm', '.xa', '.xadata', '.mp3', '.ogg', '.flac', '.aac', '.m4a'}
    if source.suffix.lower() in non_wav_audio or Path(requested_path).suffix.lower() in non_wav_audio:
        raise ValueError('Convert audio to WAV before registering or copying it')
    if Path(requested_path).parts[0] == 'audio' and Path(requested_path).suffix.lower() != '.wav':
        raise ValueError('The audio folder accepts WAV files only; keep metadata outside audio')
    if Path(requested_path).suffix.lower() == '.wav':
        from wav_only_audio import wav_info
        wav_info(source)
    registry = load(root / REGISTRY)
    data = source.read_bytes(); sha = digest(data)
    requested = inside(root, requested_path)
    ext = requested.suffix.lower()
    key = f'sha256:{sha}:{ext[1:]}'
    existing = registry['assets'].get(key) if ext in REUSABLE else None
    if existing:
        actual = existing['canonicalPath']
        if digest(inside(root, actual).read_bytes()) != sha:
            raise ValueError(f'Registered shared asset changed: {actual}')
        reused = True
    else:
        actual = requested.relative_to(root).as_posix()
        if requested.exists() and requested.read_bytes() != data:
            raise ValueError(f'Conflicting destination: {actual}')
        reused = requested.exists()
        if not reused:
            requested.parent.mkdir(parents=True, exist_ok=True)
            requested.write_bytes(data)
    records = registry['files']
    old = records.get(actual, {})
    records[actual] = dict(path=actual, source=old.get('source', str(source)), bytes=len(data), sha256=sha,
                          arenaIds=sorted(set(old.get('arenaIds', [])) | {arena_id}),
                          resourceIds=sorted(set(old.get('resourceIds', [])) | set(resource_ids)))
    persist(root, index_records(records, registry['sourceExecutableSha256'], registry['resources']))
    return dict(path=actual, reused=reused, sha256=sha)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=ROOT / 'Naruto-Online')
    args = parser.parse_args()
    registry = build_registry(args.root)
    print(json.dumps({k:registry[k] for k in ['fileCount','assetCount','resourceCount','duplicateFileCount']}, indent=2))
