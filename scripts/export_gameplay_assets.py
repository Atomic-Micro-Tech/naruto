#!/usr/bin/env python3
"""Export recovered arena 1 gameplay assets, excluding story scenes/dialogue.

Run with .venv/bin/python scripts/export_gameplay_assets.py --render-audio.
The optional renderer uses installed Chrome's OfflineAudioContext, not a PS1 emulator.
"""
import argparse
import hashlib
import io
import json
import mimetypes
import struct
import subprocess
import tempfile
import threading
import wave
from collections import Counter
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from PIL import Image
from extract_sequences import parse_seq
from gameplay_asset_library import build_registry
from png_only_images import texture_metadata, finalize_png_only

ROOT = Path(__file__).resolve().parents[1]
EX = ROOT / 'extracted'


def load(p):
    return json.loads(p.read_text())


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=ROOT / 'Naruto-Online')
    parser.add_argument('--render-audio', action='store_true')
    parser.add_argument('--index-only', action='store_true', help='Index existing assets for reuse; do not copy or render')
    args = parser.parse_args()
    out = args.output.resolve()
    out.mkdir(parents=True, exist_ok=True)
    if args.index_only:
        registry = build_registry(out)
        print(json.dumps({k: registry[k] for k in ['fileCount', 'assetCount', 'resourceCount', 'duplicateFileCount']}, indent=2))
        return
    # Keep previously rendered assets in the manifest when re-exporting without rendering.
    existing_manifest = load(out / 'manifest.json') if (out / 'manifest.json').exists() else None
    records = {r['path']: r for r in existing_manifest['files']} if existing_manifest else {}

    def save(rel, data, source, **extra):
        path = out / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        if path.exists():
            if path.read_bytes() != data:
                raise RuntimeError(f'Refusing to overwrite different existing file: {path}')
        else:
            path.write_bytes(data)
        records[rel] = dict(path=rel, source=source, category=rel.split('/')[0],
                            bytes=len(data), sha256=hashlib.sha256(data).hexdigest(), **extra)

    def copy(src, rel):
        save(rel, src.read_bytes(), src.relative_to(ROOT).as_posix())

    def write(rel, obj, source):
        save(rel, (json.dumps(obj, ensure_ascii=False, indent=2) + '\n').encode(), source, derived=True)

    manifest = load(EX / 'manifest.json')
    resources = {r['id']: r for r in manifest['resources']}
    data = (EX / 'disc/DATA.BIN').read_bytes()
    texture_resources = {38, 41, 57, 477}
    copy(EX / 'maps/map_00.png', 'image/arena1/map_00.png')
    write('image/arena1/map_00.json', load(ROOT / 'research/maps.json')[0], 'research/maps.json#0')

    # Use only asset records, not diagnostic contact sheets or menu previews.
    for folder, metadata in [('board', 'assets.json'), ('common', 'assets.json'), ('hud', 'layout.json')]:
        src = EX / 'original-ui' / folder
        meta = load(src / metadata)
        if folder == 'board':
            meta['assets'] = [a for a in meta['assets'] if a.get('tileType') not in (7, 8, 21)]
        names = {a['file'] for a in meta['assets']}
        if folder == 'common':
            for c in meta['characters']:
                names.update([c['face'], c['name']])
                texture_resources.add(c['resource'])
            meta['rouletteGeometry'].pop('preview', None)
        for name in sorted(names):
            copy(src / name, f'sprite/{folder}/{name}')
        write(f'sprite/{folder}/{metadata}', meta, f'extracted/original-ui/{folder}/{metadata}')

    chars = load(EX / 'original-ui/board-characters/characters.json')
    for c in chars['characters']:
        texture_resources.update([c['staticTextureResource'], c['animationResource']])
        for anim in c['animations']:
            copy(EX / 'original-ui/board-characters' / anim['sprite'], 'sprite/board-characters/' + anim['sprite'])
    write('sprite/board-characters/characters.json', chars, 'extracted/original-ui/board-characters/characters.json')

    fontdir = EX / 'original-ui/font'
    font = load(fontdir / 'font.json')
    cards = load(fontdir / 'cards.json')
    card_messages = {c['messageId'] for c in cards}
    for c in cards:
        for key in ['file', 'messageFile']:
            copy(fontdir / c[key], 'image/cards/' + c[key])
        texture_resources.add(c['resource'])
    write('image/cards/cards.json', cards, 'extracted/original-ui/font/cards.json')
    write('image/cards/messages.json', [m for m in load(fontdir / 'messages.json') if m['id'] in card_messages],
          'extracted/original-ui/font/messages.json#card messages only')
    write('image/cards/rendering.json', [m for m in font['rendered'] if m['id'] in card_messages],
          'extracted/original-ui/font/font.json#card text rendering')
    for atlas in font['atlases']:
        copy(fontdir / atlas['file'], 'texture/font/' + atlas['file'])
    write('texture/font/font.json', {k: font[k] for k in ['fontResource', 'sourceFunctions', 'atlases']},
          'extracted/original-ui/font/font.json#glyph atlases')

    # Original result badges, at original resolution, without research-sheet labels.
    r = resources[41]
    offsets = [r['offset'] + struct.unpack_from('<I', data, r['offset'] + 12 + i * 8)[0] for i in range(2)]
    def words(offset):
        _, _, _, w, h = struct.unpack_from('<I4H', data, offset + 8)
        return w, struct.unpack_from(f'<{w*h}H', data, offset + 20)
    width, pixels = words(offsets[0])
    _, palette = words(offsets[1])
    badges = load(ROOT / 'research/party-casual/evidence.json')['badges']
    for badge in badges:
        u, v, w, h = badge['uv']; cx = badge['clut'][0]
        rgba = []
        for y in range(h):
            for x in range(w):
                idx = (pixels[(v+y)*width+(u+x)//4] >> (((u+x)%4)*4)) & 15
                color = palette[cx+idx]
                rgba.append(tuple(((color >> shift) & 31)*255//31 for shift in (0,5,10)) + (0 if color == 0 else 255,))
        im = Image.new('RGBA', (w, h)); im.putdata(rgba)
        buf = io.BytesIO(); im.save(buf, format='PNG')
        badge['file'] = f'badge_{badge["id"]}.png'
        save('image/results/' + badge['file'], buf.getvalue(), 'extracted/disc/DATA.BIN#resource41', derived=True)
    write('image/results/badges.json', badges, 'research/party-casual/evidence.json#badges')

    selected = [t for t in manifest['textures'] if t['resource'] in texture_resources]
    for t in selected:
        copy(EX / t['png'], 'texture/' + t['png'])
    write('texture/textures.json', texture_metadata(selected, EX), 'extracted/manifest.json#gameplay texture resources converted to PNG')
    packed = [p for p in load(EX / 'packed/manifest.json') if any(
        resources[r]['offset'] <= p['offset'] < resources[r]['offset'] + resources[r]['size'] for r in texture_resources)]
    for p in packed:
        copy(EX / 'packed' / (p['id'] + '.png'), 'texture/packed/' + p['id'] + '.png')
    write('texture/packed/manifest.json', packed, 'extracted/packed/manifest.json#gameplay texture resources')

    # Read native SEQ/VAB as conversion inputs; export only their WAV results.
    packages = {p['offset']: p for p in manifest['packages']}
    audio = load(EX / 'audio/manifest.json')
    source_banks = {b['package_offset']: b for b in audio['banks']}
    sample_meta = {s['id']: s for s in audio['samples']}
    exe = (EX / 'disc/SLPS_035.53').read_bytes()
    voice_bases = struct.unpack_from('<14H', exe, 0x80065408 - 0x80010000 + 0x800)
    requests = [(f'music-{i}', 1242+i) for i in [10,22,24,25]] + [('menu',1465),('board',1447),('combat',1446)]
    requests += [(f'character-{c}-voice-{v}', voice_bases[c]+v) for c in range(13) for v in range(12)]
    banks, used, jobs = [], set(), []
    for bank_id, rid in requests:
        res = resources[rid]; package = packages[res['offset']]; bank = source_banks[res['offset']]
        vh = (EX / 'audio' / bank['vh']).read_bytes()
        programs, group = [], 0
        for pid in range(128):
            rec = vh[32+pid*16:48+pid*16]
            if not rec[0]:
                continue
            tones = []
            for n in range(rec[0]):
                tr = vh[0x820+group*512+n*32:0x820+group*512+(n+1)*32]
                vag = int.from_bytes(tr[22:24], 'little', signed=True)
                sample = next((s['id'] for s in bank['samples'] if s['vag_index'] == vag), None)
                if sample:
                    used.add(sample)
                tones.append(dict(priority=tr[0], mode=tr[1], volume=tr[2], pan=tr[3], center=tr[4], shift=tr[5],
                                  minNote=tr[6], maxNote=tr[7], vibrato=list(tr[8:10]), portamento=list(tr[10:12]),
                                  pitchBend=list(tr[12:14]), adsr1=int.from_bytes(tr[16:18],'little'),
                                  adsr2=int.from_bytes(tr[18:20],'little'), sampleIndex=vag, sample=sample))
            programs.append(dict(id=pid, volume=rec[1], priority=rec[2], mode=rec[3], pan=rec[4], tones=tones))
            group += 1
        seqpart = package['entries'][2]
        entries = packages.get(seqpart['offset'], {}).get('entries', [seqpart])
        seqs = []
        for i, entry in enumerate(entries):
            raw = data[entry['offset']:entry['offset']+entry['size']]
            seqs.append(parse_seq(raw))
            folder = 'music' if bank_id.startswith('music-') else 'voice' if bank_id.startswith('character-') else 'sfx'
            volume = 90 if bank_id == 'music-10' else 100 if folder == 'music' else 127 if folder == 'voice' else 90
            jobs.append(dict(bank=bank_id, sequence=i, resource=rid, volume=volume,
                             path=f'audio/{folder}/{bank_id}_seq_{i:03}.wav'))
        banks.append(dict(id=bank_id, resource=rid, volume=vh[24], pan=vh[25], programs=programs, sequences=seqs))
    samples = []
    for sid in sorted(used):
        s = sample_meta[sid]
        copy(EX / 'audio' / s['wav'], f'audio/samples/{sid}.wav')
        samples.append({k:s[k] for k in ['id','sample_rate','sample_count','loop_start_sample','loop_end_sample','loop_repeat']})
    write('audio/index.json', dict(banks=banks, samples=samples), 'Original gameplay SEQ/VAB banks; voice table EXE80065408')
    write('audio/render-jobs.json', jobs, 'Original gameplay bank/sequence indices')
    if args.render_audio or any(not (out / j['path']).exists() for j in jobs):
        render_audio(out, jobs, save, write)

    readme = '''# Naruto-Online — aset gameplay arena 1

Arena 1 = map ID 0: latar 640×480, 22 petak. Paket ini berisi hasil ekstraksi lokal yang sudah tersedia, ditambah suara gameplay seluruh 13 karakter dan badge hasil. Tidak ada cutscene, timeline cerita, dialog XA, musik cerita, sprite menu pemilihan karakter, atau bank efek story0.

- `image/`: latar arena, ilustrasi/teks kartu, dan badge hasil pertandingan.
- `sprite/`: objek papan, penghalang empat pemain, HUD, roulette, serta 13 karakter × 26 animasi papan. JSON menyimpan frame, anchor dan durasi asli.
- `texture/`: atlas, font dan varian palet dalam PNG dari resource gameplay terpilih. Salinan TIM sudah dikonversi dan dihapus; `texture/textures.json` menunjuk PNG dengan hash/ukuran PNG serta identitas sumber untuk pelacakan. Atlas bersama dapat memuat bagian yang tidak digunakan dalam satu pertandingan.
- `audio/samples/`: sampel asli hasil decode ADPCM ke WAV PCM16 mono 44.1 kHz. Pitch pemutaran ditentukan tone/SEQ; sampel instrumen bukan lagu lengkap.
- `audio/music/`, `audio/sfx/`, `audio/voice/`: WAV stereo siap diputar, hasil render SEQ asli satu kali. Bank musik 10 = arena, 22 = pertarungan, 24/25 = hasil pertarungan. Bank menu juga dipakai roulette dan pilihan saat gameplay.
- `metadata/audio/catalog.json`: katalog pemutaran langsung WAV, ID resource, bank, slot suara dan durasi. Folder `audio/` hanya berisi WAV; salinan SEQ/VH/VB sudah dikonversi lalu dihapus. Metadata berada di luar folder audio.

Kartu disertakan sebagai library gameplay bersama (52 kartu), bukan klaim semua kartu dapat ditarik dari dek arena 1. Roster disertakan 13 karakter untuk pemakaian arena yang sama di Party; bukan hanya dua peserta cerita pertama. Sprite animasi belum membakar seluruh rotasi/skala/blending PS1; gunakan metadata animasi.

WAV hasil render memakai sequencer JavaScript asli proyek dan OfflineAudioContext Chrome, tanpa emulator PS1. Render satu kali menonaktifkan pengulangan SEQ, menyisakan ekor maksimal 5 detik lalu memangkas hening akhir. Lagu ini bukan rekaman console dan bukan loop WAV yang sudah disambung mulus. Reverb hardware, interpolasi Gaussian, allocator 24 suara dan mixer asli belum direplikasi persis. `metadata/audio/render-report.json` mencatat durasi, peak, diagnostik dan faktor penurunan gain untuk mencegah clipping PCM16.

Ini paket aset gameplay yang berhasil dipetakan, bukan klaim seluruh efek/animasi pertarungan game sudah diekstrak atau terbukti 1:1. Tidak ada aset pengganti buatan AI. `manifest.json` menyimpan asal, ukuran, hash SHA-256, dimensi PNG dan format WAV setiap berkas.

Ekspor ulang dari root repositori: `.venv/bin/python scripts/export_gameplay_assets.py`. WAV yang sudah ada dipakai ulang; jika belum tersedia, sequence dirender otomatis. `--render-audio` memaksa render ulang. Script menolak menimpa berkas yang isinya berbeda; gunakan `--output` ke folder baru untuk regenerasi. Sumber asli tidak diubah.
'''
    save('README.md', readme.encode(), 'scripts/export_gameplay_assets.py', derived=True)
    # Reopen every PNG and WAV, verify copied content and exclude story resources.
    assert 1454 not in {b['resource'] for b in banks}
    for rel, rec in records.items():
        path = out / rel
        assert hashlib.sha256(path.read_bytes()).hexdigest() == rec['sha256']
        if path.suffix == '.png':
            with Image.open(path) as im:
                rec['dimensions'] = list(im.size); im.verify()
        elif path.suffix == '.wav':
            with wave.open(str(path), 'rb') as wav:
                assert wav.getsampwidth() == 2 and wav.getnframes() > 0
                rec['audio'] = dict(channels=wav.getnchannels(), sampleRate=wav.getframerate(), frames=wav.getnframes())
    counts = dict(Counter(r['category'] for r in records.values()))
    result = dict(arena=1, mapId=0, storyIncluded=False, coverage='Recovered gameplay assets, not a complete original-game dependency graph',
                  counts=counts, files=[records[k] for k in sorted(records)], fileCount=len(records),
                  totalBytes=sum(r['bytes'] for r in records.values()))
    manifest_path = out / 'manifest.json'
    manifest_bytes = (json.dumps(result, ensure_ascii=False, indent=2) + '\n').encode()
    if not manifest_path.exists() or manifest_path.read_bytes() != manifest_bytes:
        temp = out / 'manifest.json.tmp'
        temp.write_bytes(manifest_bytes)
        temp.replace(manifest_path)
    from wav_only_audio import finalize_wav_only
    print(json.dumps(finalize_wav_only(out), indent=2), flush=True)
    print(json.dumps(finalize_png_only(out), indent=2), flush=True)


def render_audio(out, jobs, save, write):
    chrome = Path('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
    if not chrome.exists():
        raise RuntimeError('Installed Google Chrome is required for optional OfflineAudioContext rendering')
    done = threading.Event(); reports = []; errors = []; received = set()

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *args):
            pass

        def do_GET(self):
            paths = {'/': ROOT / 'scripts/render_gameplay_audio.html',
                     '/music-player.mjs': ROOT / 'research/music-player.mjs'}
            path = paths.get(self.path)
            if self.path.startswith('/audio/'):
                candidate = (out / self.path.lstrip('/')).resolve()
                if candidate.is_relative_to(out / 'audio'):
                    path = candidate
            if path is None or not path.is_file():
                self.send_error(404); return
            raw = path.read_bytes(); self.send_response(200)
            self.send_header('Content-Type', 'text/javascript' if path.suffix == '.mjs' else mimetypes.guess_type(path)[0] or 'application/octet-stream')
            self.send_header('Content-Length', str(len(raw))); self.end_headers(); self.wfile.write(raw)

        def do_POST(self):
            try:
                size = int(self.headers['Content-Length'])
                if not 0 < size <= 100_000_000:
                    raise ValueError('Invalid render size')
                raw = self.rfile.read(size)
                if self.path.startswith('/wav/'):
                    i = int(self.path[5:]); job = jobs[i]
                    with wave.open(io.BytesIO(raw), 'rb') as wav:
                        assert wav.getnchannels() == 2 and wav.getsampwidth() == 2 and wav.getframerate() == 44100
                    save(job['path'], raw, f'audio/index.json#bank={job["bank"]},sequence={job["sequence"]}', derived=True)
                    received.add(i)
                    if len(received) % 25 == 0:
                        print(f'Rendered {len(received)}/{len(jobs)} WAV sequences', flush=True)
                elif self.path == '/finished':
                    result = json.loads(raw)
                    if 'error' in result:
                        errors.append(result['error'])
                    else:
                        reports.extend(result['reports'])
                    done.set()
                else:
                    raise ValueError('Unexpected export endpoint')
                self.send_response(200); self.end_headers()
            except Exception as exc:
                errors.append(str(exc)); done.set(); self.send_error(500)

    server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        with tempfile.TemporaryDirectory(prefix='naruto-audio-chrome-') as profile:
            with tempfile.TemporaryFile() as log:
                proc = subprocess.Popen([str(chrome), '--headless', '--disable-gpu', '--no-first-run',
                    '--disable-background-networking', '--no-default-browser-check', '--disable-extensions',
                    '--disable-component-update', '--user-data-dir=' + profile,
                    f'http://127.0.0.1:{server.server_port}/'], stdout=log, stderr=log)
                try:
                    if not done.wait(600):
                        raise RuntimeError('Audio renderer timeout')
                    if errors:
                        raise RuntimeError('; '.join(errors))
                    assert len(received) == len(jobs) == len(reports), 'Incomplete audio render'
                finally:
                    proc.terminate()
                    try:
                        proc.wait(timeout=10)
                    except subprocess.TimeoutExpired:
                        proc.kill(); proc.wait()
    finally:
        server.shutdown(); server.server_close()
    write('audio/render-report.json', dict(renderer='Chrome OfflineAudioContext + research/music-player.mjs',
          sampleRate=44100, channels=2, bits=16, repeat=False, maxTailSeconds=5, reports=reports),
          'scripts/render_gameplay_audio.html')


if __name__ == '__main__':
    main()
