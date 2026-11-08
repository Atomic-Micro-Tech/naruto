#!/usr/bin/env python3
"""Package recovered map0 assets and shared dependencies without changing originals."""
import csv, hashlib, io, json, shutil
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'arena1'
EX = ROOT / 'extracted'
load = lambda p: json.loads(p.read_text())
manifest = load(EX / 'manifest.json')
resources = {r['id']: r for r in manifest['resources']}
records = {}
resource_reasons = {}

def add_resource(rid, reason):
    resource_reasons.setdefault(rid, set()).add(reason)

def record(dest, source, category, **extra):
    b = dest.read_bytes()
    records[dest.relative_to(OUT).as_posix()] = dict(path=dest.relative_to(OUT).as_posix(), source=source,
        category=category, bytes=len(b), sha256=hashlib.sha256(b).hexdigest(), **extra)

def copy(src, rel, category):
    dest = OUT / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.read_bytes() != src.read_bytes():
        raise RuntimeError(f'Refusing to overwrite different file: {dest}')
    shutil.copy2(src, dest)
    record(dest, src.relative_to(ROOT).as_posix(), category)

def tree(src, rel, category):
    for p in sorted(src.rglob('*')):
        if p.is_file() and p.name != '.DS_Store':
            copy(p, Path(rel) / p.relative_to(src), category)

def write(rel, obj, source, category):
    dest = OUT / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + '\n')
    record(dest, source, category, derived=True)

# Map-exclusive assets. Arena1 means mapId0, not mapId1.
map0 = load(ROOT / 'research/maps.json')[0]
map_image = next(r for r in load(EX / 'maps/manifest.json') if r['id'] == 0)
copy(EX / 'maps/map_00.png', 'assets/maps/map_00.png', 'arena')
write('data/map_00.json', map0, 'research/maps.json#id=0', 'arena')
write('assets/maps/manifest.json', [map_image], 'extracted/maps/manifest.json#id=0', 'arena')
add_resource(344, 'Arena1 original tiled background; BOARD800f64b0')
add_resource(630, 'Arena1 topology and per-tile economy; BOARD800f7adc')

# Preserve source-relative metadata and all variants of common atlases.
for folder in ['board', 'common', 'hud', 'font', 'board-characters']:
    tree(EX / 'original-ui' / folder, 'assets/original-ui/' + folder, 'shared-board')
for rid in [38, 57, 477, 775]:
    add_resource(rid, 'Shared board/HUD/roulette/font/message resource')
chars = load(EX / 'original-ui/characters.json')
copy(EX / 'original-ui/characters.json', 'assets/original-ui/characters.json', 'shared-characters')
for c in chars:
    copy(EX / 'original-ui' / c['sprite'], 'assets/original-ui/' + c['sprite'], 'shared-characters')
    for key in ['rawSprite', 'portrait']:
        src = (EX / 'original-ui' / c[key]).resolve()
        copy(src, 'assets/' + src.relative_to(EX).as_posix(), 'shared-characters')
        for t in manifest['textures']:
            if t['png'] == src.relative_to(EX).as_posix(): add_resource(t['resource'], 'Shared character image')
for c in load(EX / 'original-ui/board-characters/characters.json')['characters']:
    for key in ['staticTextureResource', 'animationResource']:
        add_resource(c[key], 'Board character sprites/animation; shared selectable roster')
for c in load(EX / 'original-ui/common/assets.json')['characters']:
    add_resource(c['resource'], 'Shared character HUD face/name')
for c in load(EX / 'original-ui/font/cards.json'):
    add_resource(c['resource'], 'Shared card atlas library; actual occurrence depends on deck')

rules = load(ROOT / 'research/full-rules.json')
write('data/scenarios_using_map_00.json', [s for s in rules['scenarios'] if s['mapId'] == 0],
      'research/full-rules.json#scenarios[mapId=0]', 'configuration')
write('data/story1_scenario.json', rules['scenarios'][0], 'research/full-rules.json#scenarios[0]', 'story1')
write('data/deck_00.json', rules['decks'][0], 'research/full-rules.json#decks[0]', 'story1')
write('data/cards.json', rules['cards'], 'research/full-rules.json#cards', 'shared-board')
copy(ROOT / 'research/techniques.json', 'data/techniques.json', 'shared-characters')
copy(ROOT / 'research/board-ai.json', 'data/board-ai.json', 'shared-characters')

# First chapter intro/outro and their complete referenced sprite folders/voices.
story = load(EX / 'story/index.json')
chapter = next(c for c in story['campaign'] if c['campaign'] == 0 and c['stage'] == 0)
scene_ids = {s['sceneResourceId'] for s in chapter['scenes']}
scene_meta = [s for s in story['storyScenes'] if s['sceneResourceId'] in scene_ids and s['sceneId'] == 0]
story_subset = {**story, 'campaign': [chapter], 'storyScenes': scene_meta,
    'sceneResources': [s for s in story['sceneResources'] if s['resourceId'] in scene_ids]}
write('assets/story/index.json', story_subset, 'extracted/story/index.json#campaign0.stage0', 'story1')
copy(EX / 'story/messages.json', 'assets/story/messages.json', 'shared-font')
if (EX / 'story/icons').exists(): tree(EX / 'story/icons', 'assets/story/icons', 'shared-story')
for s in scene_meta:
    rid = s['sceneResourceId']
    copy(EX / f'story/scenes/scene_{rid:03}.json', f'assets/story/scenes/scene_{rid:03}.json', 'story1')
    tree(EX / f'story/assets/scene_{rid:03}', f'assets/story/assets/scene_{rid:03}', 'story1')
    add_resource(rid, 'First-chapter scene timeline')
    add_resource(s['vramResourceId'], 'First-chapter scene texture/palette uploads')
xa_ids = {v['xaId'] for s in chapter['scenes'] for v in s['voices']}
xa = load(EX / 'xa/browser/index.json')
xa_subset = {**xa, 'clips': [c for c in xa['clips'] if c['id'] in xa_ids],
             'zeroLengthIds': [i for i in xa['zeroLengthIds'] if i in xa_ids]}
write('assets/xa/index.json', xa_subset, 'extracted/xa/browser/index.json#chapter1 voice IDs', 'story1-audio')
for c in xa_subset['clips']:
    copy(EX / 'xa/browser' / c['file'], 'assets/xa/' + c['file'], 'story1-audio')
    wavs = list((EX / 'xa/wav').glob(f'xa_{c["id"]:04}_*.wav'))
    assert len(wavs) == 1, c['id']
    copy(wavs[0], 'audio/dialogue/' + wavs[0].name, 'story1-audio')

# Original music remains SEQ + sampled instruments, not a fake flattened WAV.
music = load(EX / 'music/index.json')
music_ids = {10, 22, 24, 25, *chapter['musicSelectors']}
banks = [b for b in music['banks'] if b['id'] in music_ids]
used = {t['sample'] for b in banks for p in b['programs'] for t in p['tones'] if t.get('sample')}
write('assets/music/index.json', {**music, 'banks': banks, 'samples': [s for s in music['samples'] if s['id'] in used]},
      'extracted/music/index.json#board10,combat22,results24/25,chapter1 selectors', 'music')
for sample in used: copy(EX / f'music/samples/{sample}.wav', f'assets/music/samples/{sample}.wav', 'music')
for b in banks: add_resource(b['resource'], f'Music bank {b["id"]}')
tree(EX / 'story1-audio', 'assets/story1-audio', 'story1-audio')
sfx = load(EX / 'story1-audio/index.json')
for b in sfx['banks']: add_resource(b['resource'], f'Board/combat/first-chapter audio bank {b["id"]}')
copy(ROOT / 'research/story1-audio.json', 'data/story1-audio-events.json', 'provenance')

# Raw resources and their already-decoded TIM/packed-palette variants.
data = (EX / 'disc/DATA.BIN').read_bytes()
for rid, reasons in sorted(resource_reasons.items()):
    r = resources[rid]
    p = OUT / f'raw/resources/resource_{rid:04}.bin';p.parent.mkdir(parents=True, exist_ok=True)
    p.write_bytes(data[r['offset']:r['offset'] + r['size']])
    record(p, f'extracted/disc/DATA.BIN@{r["offset"]}', 'raw-resource', resourceId=rid, reasons=sorted(reasons))
selected_textures = [t for t in manifest['textures'] if t['resource'] in resource_reasons]
for t in selected_textures:
    copy(EX / t['png'], 'assets/' + t['png'], 'shared-atlas')
    tim = EX / 'tim' / (t['id'] + '.tim')
    if tim.exists(): copy(tim, 'raw/tim/' + tim.name, 'raw-texture')
write('data/textures.json', selected_textures, 'extracted/manifest.json#selected resources', 'provenance')
selected_packed = [p for p in load(EX / 'packed/manifest.json') if any(
    resources[r]['offset'] <= p['offset'] < resources[r]['offset'] + resources[r]['size'] for r in resource_reasons)]
for p in selected_packed: copy(EX / 'packed' / (p['id'] + '.png'), 'assets/packed/' + p['id'] + '.png', 'shared-atlas')
write('assets/packed/manifest.json', selected_packed, 'extracted/packed/manifest.json#selected resources', 'provenance')

# Separate raw sequence and VAB files make the archive reusable outside this project.
packages = {p['offset']: p for p in manifest['packages']}
audio_banks = {b['package_offset']: b for b in load(EX / 'audio/manifest.json')['banks']}
for b in banks + sfx['banks']:
    rid = b['resource'];r = resources[rid];p = packages[r['offset']];bank = audio_banks[r['offset']]
    for kind in ['vh', 'vb']:
        copy(EX / 'audio' / bank[kind], f'raw/audio/resource_{rid:04}.{kind}', 'raw-audio')
    entry = p['entries'][2];seqs = packages.get(entry['offset'], {}).get('entries', [entry])
    assert len(seqs) == len(b['sequences'])
    for i, seq in enumerate(seqs):
        dest = OUT / f'raw/audio/resource_{rid:04}_sequence_{i:03}.seq'
        dest.write_bytes(data[seq['offset']:seq['offset'] + seq['size']])
        record(dest, f'extracted/disc/DATA.BIN@{seq["offset"]}', 'raw-audio', resourceId=rid)

# Small self-contained decoder references; this folder is an asset bundle, not a game.
copy(ROOT / 'research/music-player.mjs', 'reference/music-player.mjs', 'reference')
copy(EX / 'xa/browser/xa-decoder.mjs', 'assets/xa/xa-decoder.mjs', 'reference')
player = ROOT / 'browser-game/dist/xa-player.js'
player_dest = OUT / 'reference/xa-player.js'
player_dest.write_text(player.read_text().replace('./assets/xa/', '../assets/xa/'))
record(player_dest, player.relative_to(ROOT).as_posix(), 'reference', derived=True,
       change='Only relative asset paths adapted to bundle layout')
write('data/resources.json', [dict(resources[r], reasons=sorted(resource_reasons[r])) for r in sorted(resource_reasons)],
      'extracted/manifest.json#selected resources', 'provenance')

readme = '''# Aset Arena 1

Arena 1 di sini adalah **map ID 0 / map_00**, bukan map ID 1. Latar asli berukuran **640 × 480**, dengan **22 petak**, dua kristal air, dan dua petak kartu. Bab 1 cerita menggunakan Naruto berkacamata (ID12) melawan Mizuki (ID10).

## Isi

- `assets/maps/map_00.png`: latar arena asli yang sudah disusun dari tile8×8; siap dibuka sebagai PNG.
- `data/map_00.json`: posisi/koneksi22petak, harga beli, tarif perlevel, biaya peningkatan, nilai jual dan ID kejadian.
- `assets/original-ui/board/`: sumber, kristal, kuil kartu, tanah kosong, penghalang4warna×5level dan metadata anchor/palet.
- `assets/original-ui/common/` dan `hud/`: roulette, angka, panah, label kontrol, potret/nama, panel chakra dan gulungan.
- `assets/original-ui/board-characters/`: semua13karakter×26animasi papan, termasuk jalan empat arah dan idle; JSON menyimpan frame, durasi dan anchor. Karakter selain12/10 adalah aset bersama untuk pertandingan bebas, bukan roster Bab1.
- `assets/original-ui/font/`: atlas font asli, pesan glyph, gambar kartu dan teks kartu. Library bersama mencakup kartu yang mungkin tidak muncul pada dek arena ini.
- `assets/textures/` dan `assets/packed/`: atlas asli dan varian palet yang sudah diekstrak untuk resource terpilih. Sebagian merupakan lembar atlas, bukan sprite terpotong.
- `assets/music/`: bank musik arena10, pertarungan22, hasil24/25 dan musik adegan Bab1; indeksSEQ beserta instrumenWAV.
- `assets/story1-audio/`: bank efek papan/pertarungan/menu dan suara Naruto12/Mizuki10 yang telah dipetakan.
- `assets/story/`: adegan pembuka175 dan penutup166 Bab1 beserta sprite, palet, timeline dan pesan. Ini tambahan cerita, bukan bagian latar arena.
- `audio/dialogue/`:64klip dialog Bab1 dalam WAV. `assets/xa/` menyimpan dataXA dan indeks padanannya.
- `raw/resources/`: byte resource asli dariDATA.BIN, termasuk latar344 dan data petak630.
- `raw/tim/` dan `raw/audio/`: TIM, SEQ dan VAB(.vh/.vb) yang tersedia untuk resource terkait.
- `data/`: konfigurasi Bab1, dek0, teknik, kartu, pemetaan audio dan provenance.
- `reference/`: pemutar/dekoder JavaScript yang tersedia sebagai referensi format, bukan aplikasi game.

## Membaca aset

Nama berakhiran`_00` memakai indeks asli berbasis nol. PNG mempertahankan hasil ekstraksi dan ukuran asli; gunakan nearest-neighbor bila diperbesar. Untuk animasi, baca`characters.json`: frame, offset, durasi, rotasi dan skala tetap perlu diterapkan. Sprite sheet belum membakar seluruh transformasi animasi PS1.

WAV pada folder musik/efek adalah sampel instrumen/suara. **Musik lengkap bukan satuWAV**: susun melalui eventSEQ dan parameter VAB pada`index.json`, atau gunakan berkas mentah di`raw/audio/`. FileWAV dialog sudah dapat diputar langsung.

## Cakupan dan verifikasi

Paket memuat aset arena pertama serta dependensi bersama yang **sudah berhasil diekstrak dan dipetakan** dari disc lokal. Tidak memuat seluruh aset game atau semua aset pertempuran yang belum dipetakan. Aset bersama tetap disertakan lengkap agar pilihan warna, karakter dan palet tidak hilang; itu tidak berarti semuanya muncul bersamaan di Bab1.

PNG tidak mereplikasi otomatis blending/STP, dither dan seluruh efek GPU asli. Pemetaan bank suara tidak membuktikan seluruh pemicu animasi/suara telah diketahui. Tidak ada aset baru yang dibuat dengan AI.

`manifest.json` mencatat sumber, kategori, ukuran dan SHA-256 tiap berkas. `data/resources.json` menyimpan IDresource dan offset asli. Jalankan`python3 scripts/package_arena1.py` dari repositori untuk menghasilkan kembali paket dari hasil ekstraksi lokal. File sumber tidak dipindahkan atau dihapus.
'''
(OUT / 'README.md').write_text(readme)
record(OUT / 'README.md', 'scripts/package_arena1.py', 'documentation', derived=True)
counts = Counter(x['category'] for x in records.values())
result = dict(arena=1, mapId=0, backgroundResource=344, topologyResource=630,
    dimensions=[640,480], tileCount=22, chapter1Characters=[12,10],
    coverage='All currently recovered/mapped map0 and selected shared dependencies; not an exhaustive original-game dependency graph',
    counts=dict(counts), fileCount=len(records), totalBytes=sum(x['bytes'] for x in records.values()),
    resourceCount=len(resource_reasons), xaClips=len(xa_subset['clips']),
    files=[records[p] for p in sorted(records)])
(OUT / 'manifest.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({k:v for k,v in result.items() if k != 'files'}, ensure_ascii=False, indent=2))
