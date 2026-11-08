# Verified VAB/SPU audio extraction

Run `python3 scripts/extract_audio.py` after `scripts/extract_assets.py`.
No nonstandard Python dependencies. Output: `extracted/audio/manifest.json`,
`banks/*.vh`, `banks/*.vb`, `adpcm/*.adpcm`, and `wav/*.wav`.

## Results

- 714 VAB banks, 2,049 sample references, 1,081 unique raw ADPCM samples.
- All banks use version 7, and all declared sample extents match actual package lengths.
- Zero invalid ADPCM frames (predictor 0–4, shift 0–12, flags 0–7, 16-byte framing).
- 23 packages have noncanonical PK entry splits: 512 or 1,024 initial VB bytes are contained in entry 0. The extractor exports canonical VH and VB using the internal VAB header, preserving every byte.
- Every WAV was reopened to verify mono PCM16, 44,100 Hz, and expected frame length. Every raw ADPCM SHA-256 was rechecked.
- Five unit tests pass: signed nibble order, terminal padding exclusion, rejecting malformed frames (including trailing malformed frames), loop metadata, and the actual noncanonical bank split at `DATA.BIN+0x823000`.

## Evidence

`_SsVabOpenHeadWithMode` (`0x80054608`, decompiled C line 58449) establishes:

- Program count at VH+0x12; VAG count at VH+0x16.
- 128 program records, each 16 bytes, following the 32-byte header.
- Each program contributes 512 bytes of tone records.
- Size table begins at `VH + 32 + 128*16 + program_count*512`.
- 256 little-endian 16-bit table entries, in 8-byte units for version 7.
- Table entry 0 is a zero sentinel; entries 1 through VAG count describe samples.

Canonical header ends after the 512-byte size table. For this disc, concatenated
PK02 entries 0 and 1 equal the VAB's total size in every bank.

SPU arithmetic was checked against the [DuckStation SPU decoder](https://github.com/stenzek/duckstation/blob/master/src/core/spu.cpp), with [vgmstream's PS-ADPCM decoder](https://github.com/vgmstream/vgmstream/blob/master/src/coding/psx_decoder.c) as a format cross-check.

## Browser audition candidates

These are **unlabeled samples** selected from the first bank by length and signal statistics. Their original UI/gameplay roles have not been established or auditioned; do not label them as recovered "confirm", "attack", etc. Mapping them to new UI events is a remake design decision.

| WAV basename | VAG index in bank 0x54000 | Duration | Peak / RMS |
| --- | --- | --- | --- |
| `spu_00a445ecd205d45b.wav` | 1 | 81 ms | 31,339 / 5,284 |
| `spu_b9a064e727565a9b.wav` | 2 | 38 ms | 28,909 / 6,999 |
| `spu_0339d7057b8a06ab.wav` | 6 | 56 ms | 31,466 / 6,598 |
| `spu_c2852064f0f16a2e.wav` | 16 | 262 ms | 31,670 / 6,688 |
| `spu_782f2cdf169f3597.wav` | 17 | 77 ms | 28,672 / 2,708 |

## Limits

44,100 Hz is an **audition rate**, not a claim about the original sample playback pitch. Actual playback depends on tone/sequence settings and SPU pitch registers. Export stops after the first end-flag block, preserves loop points as metadata, and does not repeat loops. It does not apply ADSR, Gaussian interpolation, reverb, musical sequencing, or original mixer volume. XA streams in DATA2.BIN remain outside this extractor. Raw VH/VB/ADPCM and provenance offsets are preserved for later reconstruction.
