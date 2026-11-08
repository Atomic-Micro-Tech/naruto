#!/usr/bin/env python3
"""Reproduce Party rule text and result badges from local disc data.

Run: .venv/bin/python scripts/extract_party_audit.py
Text transcription is manual, checked against the rendered original glyphs.
This exports research evidence, not an original-runtime screenshot.
"""
import argparse
import hashlib
import json
from pathlib import Path
import struct

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
BASE = 0x800ad450
TEXT = {
    130: 'ついか条件なし',
    131: 'チャクラがマイナスになった人からぬけていきます。',
    132: '決められたターンで終了。そのときのチャクラで順位を決めます。',
    133: '封印の書をもったまま決めた数のボーナスをおこなっても勝ち。',
    134: '封印の書をもったままクリアしなくてはならない。',
    651: 'ターン数',
    652: 'ボーナス',
    2292: 'パーティーモードで追加クリア条件『マイナスチャクラで脱落』が、えらべるようになりました。',
    2293: 'パーティーモードで追加クリア条件『決められたターンで終了』が、えらべるようになりました。',
    2294: 'パーティーモードで追加クリア条件『封印の書をもったままマップを周回で勝ち』がえらべるようになりました。',
    2295: 'パーティーモードで追加クリア条件『封印の書をもったままクリア』がえらべるようになりました。',
}


def extract(out):
    out.mkdir(parents=True, exist_ok=True)
    data = (ROOT / 'extracted/disc/DATA.BIN').read_bytes()
    board = (ROOT / 'extracted/overlays/overlay_1.bin').read_bytes()
    manifest = json.loads((ROOT / 'extracted/manifest.json').read_text())
    resource = manifest['resources'][41]
    start = resource['offset']
    assert data[start:start + 4] == b'PK02'
    assert struct.unpack_from('<I', data, start + 4)[0] == 2
    offsets = [start + struct.unpack_from('<I', data, start + 12 + i * 8)[0]
               for i in range(2)]

    def words(offset):
        magic, flags = struct.unpack_from('<II', data, offset)
        assert (magic, flags) == (0x10, 2), 'Expected packed-word TIM carrier'
        n, x, y, w, h = struct.unpack_from('<I4H', data, offset + 8)
        assert n == 12 + w * h * 2
        return w, h, struct.unpack_from(f'<{w * h}H', data, offset + 20)

    w, h, pixels = words(offsets[0])
    pw, ph, palette = words(offsets[1])
    assert (w, h, pw, ph) == (64, 208, 208, 1)
    sheet = Image.new('RGBA', (256, 6 * 80), (240, 240, 240, 255))
    labels = ['1位', '2位', '3位', 'ドベ', '勝ち', 'まけ']
    badges = []
    for i, label in enumerate(labels):
        u, v, width, height = struct.unpack_from('<4B', board, 0x8013a6b0 - BASE + i * 4)
        cx, cy = struct.unpack_from('<2h', board, 0x8013a6c8 - BASE + i * 4)
        assert cy == 0 and cx + 16 <= len(palette)
        assert u + width <= w * 4 and v + height <= h
        rgba = []
        for yy in range(height):
            for xx in range(width):
                index = pixels[(v + yy) * w + (u + xx) // 4] >> (((u + xx) % 4) * 4) & 15
                col = palette[cx + index]
                rgba.append(tuple(((col >> shift) & 31) * 255 // 31 for shift in (0, 5, 10))
                            + (0 if col == 0 else 255,))
        im = Image.new('RGBA', (width, height))
        im.putdata(rgba)
        sheet.alpha_composite(im.resize((width * 2, height * 2), Image.Resampling.NEAREST), (32, i * 80))
        ImageDraw.Draw(sheet).text((4, i * 80 + 8), str(i), fill='black')
        badges.append(dict(id=i, transcription=label, uv=[u, v, width, height],
                           clut=[cx, cy + 255], tpage=13))
    sheet.save(out / 'result-labels.png')

    fontdir = ROOT / 'extracted/original-ui/font'
    messages = json.loads((fontdir / 'messages.json').read_text())
    atlas = Image.open(fontdir / 'glyphs_12_color0.png').convert('RGBA')
    sheet = Image.new('RGBA', (640, len(TEXT) * 130), (245, 245, 245, 255))
    texts = []
    for row, (mid, transcription) in enumerate(TEXT.items()):
        x, y = 60, row * 130 + 5
        ImageDraw.Draw(sheet).text((4, y), str(mid), fill='black')
        stream = messages[mid]['glyphStream']
        for value in stream:
            command = value & 0xf000
            if command == 0xb000:
                continue
            assert command == 0, f'Unexpected control in message {mid}'
            if x + 24 > 630:
                x, y = 60, y + 26
            assert y + 24 <= (row + 1) * 130
            gid = value & 4095
            gx, gy = gid % 21 * 12, gid // 21 * 12
            im = atlas.crop((gx, gy, gx + 12, gy + 12))
            sheet.alpha_composite(im.resize((24, 24), Image.Resampling.NEAREST), (x, y))
            x += 26
        texts.append(dict(messageId=mid, transcription=transcription, glyphStream=stream))
    sheet.save(out / 'rule-text.png')
    inputs = ['extracted/disc/SLPS_035.53', 'extracted/overlays/overlay_0.bin',
              'extracted/overlays/overlay_1.bin', 'extracted/original-ui/font/messages.json',
              'extracted/original-ui/font/glyphs_12_color0.png']
    metadata = dict(
        sources=[dict(file=p, sha256=hashlib.sha256((ROOT / p).read_bytes()).hexdigest()) for p in inputs],
        resource41=dict(offset=start, timOffsets=offsets,
                        sha256=hashlib.sha256(data[start:start + resource['size']]).hexdigest()),
        evidence=dict(ruleText='MENU 800bcad4', notifications='MENU 800c25ac / 2194 + flag',
                      order='BOARD 800e1958', badges='BOARD 80110d68 / 8011186c / 80111aac',
                      uvTable='0x8013a6b0', clutTable='0x8013a6c8'),
        badges=badges, messages=texts,
        notes=['Japanese text manually transcribed from the original glyph images.',
               'Sheets use enlarged pixels and research line wrapping, not game screen layout.',
               'TIM mode2 carries indexed pixel words here; renderer selects 4-bit sampling.',
               'Badge ID3 means last place, not necessarily fourth place.',
               'Static source evidence; no PS1 execution or browser fidelity claim.'])
    (out / 'evidence.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + '\n')
    print(f'Exported 6 result badges and {len(TEXT)} original messages to {out}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=ROOT / 'research/party-casual')
    extract(parser.parse_args().output)
