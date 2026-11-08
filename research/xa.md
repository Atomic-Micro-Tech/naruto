# Streamed XA audio recovery

`python3 scripts/extract_xa.py` exports **722 real clips**, totaling **2,998.1867 seconds** (about 50 minutes), from the original raw MODE2/2352 disc. Every real clip is **mono, 4-bit XA ADPCM at 37,800 Hz**. WAVs preserve that native rate. No PlayStation game code or emulator executes during extraction.

## Exact resource lookup

The ISO directory places DATA2.BIN at LBA 32447 with 81,264 logical 2048-byte sectors. Its actual raw sectors contain XA audio plus interleaving/padding. Dumping only 2048 bytes from each Form2 sector discards valid audio payload.

XASECT.BIN contains a u32 count 86 followed by 86 records of 8 bytes:

- u32 first field: sector offset relative to DATA2.BIN.
- u32 second field: group length in **2336-byte units**, including the repeated subheader, Form2 user payload and EDC, excluding the 16-byte sync/sector header.
- `start + size / 2336` exactly equals the next group's start for all 85 transitions. Final group ends at sector 81264.

`FUN_80019468(id)` adds `XASECT[id >> 4].sector` to the DATA2 base. `FUN_800194d0(id)` returns `id &15`, the XA channel. All stream file numbers are 1. Therefore export ID is **group×16+channel**.

Crucial correction to earlier notes: EXE byte table at RAM **0x80064d58–0x800652af** holds **the number of audio sectors per clip**, not volume or channel. `FUN_800194b8(id)` reads the full ID index, without masking, and multiplies by 16. This gives the physical interleaved read span. Its 1368 entries contain 722 nonzero lengths, which match every real clip's counted sectors exactly.

The family/group lookup at 0x80064d1c is preserved in the manifest. `FUN_800193a0(g,kind,slot)` computes:

```text
clipID = groupTable[(g &255)+(kind &255)] *16 + (slot &255) -1
```

The `g`/`kind` meanings depend on the call site. Do not label these files by character, story line, music track, or UI action without tracing the specific caller. They are streamed clips; many appear consistent with short voice recordings, but no automatic speech transcription or music classification has been performed.

## Thirteen dummy slots

There are 28,121 sectors with the XA audio flag and 735 channel EOF markers. Thirteen channels have a single EOF-marked sector, but their declared clip lengths are 0 in the EXE. These are placeholder slots, not audio used by the game. Their final three sound groups contain repeated executable/string-like garbage, including reserved predictors and mismatched redundant headers.

The extractor skips these 13 slots and records their IDs, exact sector LBAs and raw hashes in `manifest.json.skipped`. It does **not** turn garbage into sound by clamping invalid codec headers. All 28,108 sectors for the 722 real clips pass strict subheader, coding and predictor validation.

## Decoder and fidelity

The decoder is original, offline codec code in `scripts/xa_decode.c`, called from Python through a temporarily compiled shared library. It supports 4/8-bit and mono/stereo layouts; only 4-bit mono occurs in this disc. A C compiler (`cc`) is required. The Python reference decoder is kept for tests.

- 18 sound groups per sector, 128 bytes per group; 28 samples per sound unit.
- 4-bit mono has 4032 samples per audio sector; `4032/37800 ==16/150` seconds, agreeing with the disc's 16-sector interleave at double-speed reading.
- Predictor history is independent per file/channel and resets at each indexed clip start.
- Reserved coding bits, emphasis, unknown predictors, header-copy mismatches, changing format mid-clip, missing EOF and inconsistent declared lengths raise errors.
- Reserved shift values 13–15 follow the documented shift 9 behavior; they do not occur in the real clips here.

Exported PCM uses separately truncated predictor products, matching the arithmetic documented in the currently inspected DuckStation CDROM decoder. An optional `ffmpeg` arithmetic mode combines the products and adds 32 before shifting. The two decoders' rounding is intentionally distinguished: an early real sector differs by at most 72 PCM units between those modes. This is small but means the exported PCM must not be described as a byte-exact FFmpeg decode.

Native 37,800 Hz WAV playback also does **not** reproduce the console's 44,100 Hz interpolation filter, CD gain/mix registers, exact stream startup/interrupt timing or simultaneous SPU playback. Those remain integration work for a true 1:1 audio path. Original ADPCM bytes remain recoverable from the unmodified disc using the manifest's sector lists.

## Files and validation

- `extracted/xa/wav/xa_NNNN_gGG_cCC.wav`: 722 mono 16-bit WAVs, approximately 221 MiB total.
- `extracted/xa/manifest.json`: clip IDs, native format, duration, sector LBAs, source-sector hash, output hash and skipped slots.
- `extracted/xa/validation.json`: independent FFmpeg/PyAV comparison results and WAV integrity check.
- `tests/test_xa.py`: eight regression tests covering nibble order/sign, stereo interleave, 8-bit layout, independent prediction history, coding flags, invalid header rejection, reserved shifts and sector framing.

```sh
.venv/bin/python scripts/extract_xa.py
.venv/bin/python -m unittest discover -s tests -p test_xa.py -v
# Optional independent comparison (not needed for extraction/runtime):
.venv/bin/pip install av==15.1.0
.venv/bin/python research/validate_xa.py
```

External primary technical references: [PSX-SPX's reverse-engineered XA format](https://psx-spx.consoledev.net/cdromformat/#cdrom-xa-audio-adpcm-compression), [DuckStation's implemented CDROM decoder](https://github.com/stenzek/duckstation/blob/master/src/core/cdrom.cpp), [FFmpeg's implemented XA decoder](https://github.com/FFmpeg/FFmpeg/blob/master/libavcodec/adpcm.c). These are used to check codec layout/arithmetic; game-specific indexing comes directly from this disc and `SLPS_035.53.c`.

## Compact browser assets

`python3 scripts/prepare_xa_browser.py` preserves the original ADPCM sound groups, removing only sector framing and unused padding. It checks original sector hashes before packing. The 722 `extracted/xa/browser/raw/*.xadata` files total **64,760,832 bytes** (about 62 MiB), versus about 221 MiB for WAVs. Each file is one independently decoded clip, so the browser can fetch only the clips needed by the current scene.

`extracted/xa/browser/index.json` contains file paths, hashes, exact sample counts, format fields, the original family lookup table and dummy IDs. `xa-decoder.mjs` is a standalone JavaScript audio codec; it executes no game code and contains no console emulator.

```js
import {loadXA} from './xa/xa-decoder.mjs';
const base = new URL('./xa/', location.href);
const index = await (await fetch(new URL('index.json', base))).json();
// Run after a user gesture has resumed the AudioContext.
const buffer = await loadXA(audioContext, index.clips.find(c => c.id === wantedId), base);
const source = audioContext.createBufferSource();
source.buffer = buffer;
source.connect(audioContext.destination);
source.start();
```

`decodeXA(bytes, {channels, bits, rate})` returns interleaved signed 16-bit PCM and metadata; `toAudioBuffer(context, decoded)` converts it for Web Audio; `loadXA(context, entry, absoluteBaseURL, {signal})` fetches and decodes on demand. `gameClipId(groupTable, g, kind, slot)` implements the verified family lookup. Scheduling, interruptions, gain and simultaneous music belong in the game audio controller.

`node research/validate-xa-browser.mjs` compared all **113,331,456 PCM frames** from all 722 clips against the exported C decoder WAVs, byte for byte. Results are in `extracted/xa/browser/validation.json`. This comparison proves JS/C agreement at native rate, not hardware mixer equivalence.

## Verified callers and remaining trigger uncertainty

The following helpers were checked in the original executable's MIPS instructions, including table bytes at 0x80064d55 and 0x80064d56:

- `0x80019424(character, variant, callback)` selects `1280 + (character & 255) * 2 + (variant & 255)`. The base table byte is 80.
- `0x800193f0(index, callback)` selects `1312 + (index & 255)`. The base table byte is 82.
- `MENU.c`, `FUN_800ada3c`, title state 5 calls `0x80019424(FUN_8001a2f4(), 1, FUN_800af604)`. Character 0 therefore maps to ID 1281 (1.173333 seconds). The character getter reads 0x80089da9. Title initialization chooses among eligible characters, rather than unconditionally using character 0.
- The observed title confirmation code in `FUN_800af090` sets state **6 directly** and plays a separate SPU sequence. No transition into title state 5 has been established. Its XA call may be unused in this build; do not assign ID 1281 to the confirmation button without further evidence.
- `MENU.c`, `FUN_800c0a5c`, state 5 calls `0x800193f0(row * 7 + column, 0)` from its gallery grid. This gives an exact clip selection formula; surrounding UI state timing still belongs to the menu port.
- `BOARD.c`, `FUN_801188b8(slot)` calls `FUN_800193a0(FUN_80012954(), 2, slot, callback)`. The board's active speaker/family value must be supplied; slot alone is insufficient.

Title and main-menu sound-bank loaders use DATA resources `0x5c6 + character` and `0x5ba + character` respectively. These are separate SPU/VAB resources, not XA streams. Recovering all XA clips therefore does not by itself recreate title background music or the complete audio mix.
