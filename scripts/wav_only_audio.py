#!/usr/bin/env python3
"""Finalize a gameplay bundle with WAV-only audio and a direct-play catalog.

SEQ/VAB are removed only after every associated rendered WAV and source sample
has been checked. Original extraction inputs outside this bundle are untouched.
"""
import hashlib
import json
import re
import wave
from collections import Counter
from pathlib import Path


def load(path):
    return json.loads(path.read_text())


def wav_info(path):
    with wave.open(str(path), 'rb') as wav:
        if wav.getcomptype() != 'NONE' or wav.getsampwidth() != 2 or wav.getnframes() <= 0:
            raise ValueError(f'Invalid PCM16 WAV: {path}')
        frames = wav.getnframes()
        raw = wav.readframes(frames)
        if len(raw) != frames * wav.getnchannels() * 2:
            raise ValueError(f'Truncated WAV: {path}')
        return dict(channels=wav.getnchannels(), sampleRate=wav.getframerate(), frames=frames)


def write_json(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    data = (json.dumps(obj, ensure_ascii=False, indent=2) + '\n').encode()
    if path.exists() and path.read_bytes() == data:
        return
    temporary = path.with_suffix('.json.tmp')
    temporary.write_bytes(data)
    temporary.replace(path)


def finalize_wav_only(root):
    root = Path(root).resolve()
    manifest = load(root / 'manifest.json')
    records = {r['path']: r for r in manifest['files']}
    old_index = root / 'audio/index.json'
    if not old_index.exists():
        catalog = load(root / 'metadata/audio/catalog.json')
        for entry in catalog['tracks'] + catalog['samples']:
            wav_info(root / entry['path'])
        unexpected = [str(p) for p in (root / 'audio').rglob('*') if p.is_file() and p.suffix.lower() != '.wav']
        if unexpected:
            raise ValueError(f'Non-WAV audio still present: {unexpected}')
        return dict(removed=0, wavFiles=len(catalog['tracks']) + len(catalog['samples']))

    index = load(old_index)
    jobs = load(root / 'audio/render-jobs.json')
    report_path = root / 'audio/render-report.json'
    if not report_path.exists():
        report_path = root / 'metadata/audio/render-report.json'
    report = load(report_path)
    reports = {(r['bank'], r['sequence']): r for r in report['reports']}
    banks = {b['id']: b for b in index['banks']}
    covered = {(j['resource'], j['sequence']) for j in jobs}
    resource_ids = {j['resource'] for j in jobs}
    tracks, samples = [], []

    def verify_wav(rel):
        path = root / rel
        rec = records[rel]
        if hashlib.sha256(path.read_bytes()).hexdigest() != rec['sha256']:
            raise ValueError(f'WAV differs from export manifest: {rel}')
        return wav_info(path)

    # Complete all validation BEFORE deleting any source audio.
    if {(j['bank'], j['sequence']) for j in jobs} != {
            (b['id'], i) for b in index['banks'] for i in range(len(b['sequences']))}:
        raise ValueError('Not every original sequence has a WAV render job')
    for job in jobs:
        rendered = reports[(job['bank'], job['sequence'])]
        if rendered['resource'] != job['resource'] or rendered['path'] != job['path']:
            raise ValueError(f'Render provenance mismatch: {job}')
        fmt = verify_wav(job['path'])
        tracks.append(dict(path=job['path'], bank=job['bank'], sequence=job['sequence'],
                           resourceIds=[job['resource']], kind=job['path'].split('/')[1],
                           seconds=fmt['frames']/fmt['sampleRate'], silent=rendered['silent'], **fmt))
    sample_resources = {}
    for bank in banks.values():
        for program in bank['programs']:
            for tone in program['tones']:
                if tone.get('sample'):
                    sample_resources.setdefault(tone['sample'], set()).add(bank['resource'])
    if set(sample_resources) != {s['id'] for s in index['samples']}:
        raise ValueError('Incomplete VAB sample inventory')
    for sample in index['samples']:
        rel = f'audio/samples/{sample["id"]}.wav'
        fmt = verify_wav(rel)
        if fmt['frames'] != sample['sample_count']:
            raise ValueError(f'Incomplete decoded VAB sample: {rel}')
        samples.append(dict(path=rel, id=sample['id'], resourceIds=sorted(sample_resources[sample['id']]),
                            loopStartSample=sample['loop_start_sample'], loopEndSample=sample['loop_end_sample'],
                            loopRepeat=sample['loop_repeat'], **fmt))
    to_remove = []
    for path in (root / 'audio').rglob('*'):
        if not path.is_file() or path.suffix.lower() == '.wav':
            continue
        rel = path.relative_to(root).as_posix()
        source = re.fullmatch(r'audio/source/resource_(\d+)(?:_sequence_(\d+))?\.(seq|vh|vb)', rel)
        if source:
            rid, seq, ext = int(source[1]), source[2], source[3]
            if rid not in resource_ids or (ext == 'seq' and (seq is None or (rid, int(seq)) not in covered)):
                raise ValueError(f'Audio has no verified WAV conversion: {rel}')
        elif rel not in ('audio/index.json','audio/render-jobs.json','audio/render-report.json'):
            raise ValueError(f'Unexpected non-WAV file, requires inspection: {rel}')
        if hashlib.sha256(path.read_bytes()).hexdigest() != records[rel]['sha256']:
            raise ValueError(f'Source audio changed since extraction: {rel}')
        to_remove.append(path)

    catalog = dict(format='wav', pathBase='Naruto-Online/', playback='Play tracks[].path directly; no SEQ/VAB runtime required',
                   loopNote='Rendered tracks are one pass, not seamless loops; sample loop metadata applies only to source samples',
                   tracks=tracks, samples=samples)
    write_json(root / 'metadata/audio/catalog.json', catalog)
    write_json(root / 'metadata/audio/render-report.json', report)
    # Keep source identity for audit without retaining or referencing removed files as assets.
    removed_audio = [dict(path=p.relative_to(root).as_posix(), sha256=records[p.relative_to(root).as_posix()]['sha256'])
                     for p in to_remove if p.suffix != '.json']
    if removed_audio:
        write_json(root / 'metadata/audio/conversion-history.json', dict(
            note='Removed source-format copies; replacement WAV paths are in catalog.json by resourceIds/sequence. Original extracted inputs remain outside this package.',
            removedSourceFiles=removed_audio))
    for path in to_remove:
        rel = path.relative_to(root).as_posix()
        path.unlink()
        records.pop(rel, None)
    for folder in sorted((root / 'audio').rglob('*'), reverse=True):
        if folder.is_dir() and not any(folder.iterdir()):
            folder.rmdir()
    for path in (root / 'metadata/audio').glob('*.json'):
        rel = path.relative_to(root).as_posix(); raw = path.read_bytes()
        records[rel] = dict(path=rel, source='scripts/wav_only_audio.py', category='metadata',
                            bytes=len(raw), sha256=hashlib.sha256(raw).hexdigest(), derived=True)
    # README may have been updated to describe the WAV-only package.
    readme = root / 'README.md'
    if 'README.md' in records:
        raw = readme.read_bytes()
        records['README.md'].update(bytes=len(raw), sha256=hashlib.sha256(raw).hexdigest())
    manifest.update(files=[records[k] for k in sorted(records)], fileCount=len(records),
                    totalBytes=sum(r['bytes'] for r in records.values()),
                    counts=dict(Counter(r['category'] for r in records.values())), audioFormat='wav')
    write_json(root / 'manifest.json', manifest)
    registry_path = root / 'resource-library.json'
    if registry_path.exists():
        registry = load(registry_path)
        registry['files'] = {k:v for k,v in registry['files'].items() if k not in {p.relative_to(root).as_posix() for p in to_remove}}
        write_json(registry_path, registry)
    from gameplay_asset_library import build_registry
    build_registry(root)
    return dict(removedAudioFiles=len(removed_audio), movedMetadataFiles=sum(p.suffix == '.json' for p in to_remove),
                wavFiles=len(tracks)+len(samples))


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1] / 'Naruto-Online')
    print(json.dumps(finalize_wav_only(parser.parse_args().root), indent=2))
