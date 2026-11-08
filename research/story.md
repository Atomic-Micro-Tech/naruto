# Original story scenes and dialogue

`python3 scripts/extract_story.py` recovers all **125 NARUTOSceneV001 resources**, the **26 story texture sets** used by the story loader's two resource families, **451 referenced original message streams**, and **19 campaign configuration entries**. It executes no PS1 instructions. The additional executable decompilation is in `decompiled/STORY_ENGINE.c`; `scripts/ghidra/StoryEngine.java` reproduces it from the existing Ghidra executable project. That decompilation has several incomplete switch recoveries, explicitly supplemented below by inspected MIPS addresses.

## Resource selection

`STORY.c/FUN_800ae840` reads the intro selector through `80012914`, or the outro selector through `80012934`, and calls `80023f10(sceneId, 2, 0, 0, phase, 0)`. Here phase 0 is before the board and phase 1 is the corresponding later story scene. This does not establish a complete victory/progression implementation.

The executable tables at `0x8006d6dc` and `0x8006d6f4`, used in `80024464` and `80024b70`, give:

| Data | Phase 0 | Phase 1 |
| --- | --- | --- |
| Animation scene resource | 175 + sceneId | 166 + sceneId |
| VRAM resource | 300 + sceneId | 291 + sceneId |
| Text base address | `0x800657cc + sceneId*4` | `0x80065814 + sceneId*4` |

The generic formats also cover animation resources 67–191, paired with VRAM resources 192–316. Only story VRAM resources 291–316 are exported as PNGs by this script. Other resource types use different destination VRAM base offsets and need their corresponding loader context.

`80012454` reads 12-byte campaign records at `0x80058758 + campaign*0x84 + stage*12`. Byte 2 is the intro selector; byte 3 is the outro selector; byte 4 is the XA family selector. Value 255 is a missing-scene sentinel. There are ten, three and six valid stage records in the three campaign families. Raw records are retained, including four music selectors at bytes 8–11. `80012974` selects one of those four music entries. The caller's transitions must handle missing scenes; the extractor never invents a scene for selector 255.

## Binary scene tables

Signature: 16 bytes `NARUTOSceneV001\x1a`. Eleven little-endian u32 offsets at +0x10 are resource-relative; the number of root sequence entries is u16 at +0x3c. Physical table order is not the same as the header order. Empty tables share their start with the following table.

| Header index | JSON table | Record layout |
| --- | --- | --- |
| 0 | sprites | six s16: bit depth, default palette, VRAM x in words, VRAM y, width in pixels, height |
| 1 | events | six s16: tick, value, flags, argument, x offset, y offset |
| 2 | positions | eight s16: tick, interpolation flag, x, y, incoming control x/y, outgoing control x/y |
| 3 | colors | s16 tick, s16 interpolation flag, four u8 channels; first three are RGB modulation |
| 4 | scales | s16 tick, s16 interpolation flag, float32 x/y scales |
| 5 | blends | s16 tick, s16 blend selector |
| 6 | palettes | s16 tick, s16 palette index |
| 7 | layers | fourteen s16: kind, reserved/unknown, then six start/count pairs for events, positions, blends, colors, scales, palettes |
| 8 | clips | four s16: duration in logical ticks, unknown, first layer, layer count |
| 9 | objects | six s16: clip index, clip-rectangle enabled, left, top, right, bottom |
| 10 | sequence | s16 clip indices in root playback order |

`80024b70` installs these pointers; `80028c08` resolves the sequence and object clips. Root visual layers (kinds 0–2) select objects by event value. Event flag 4 instead selects message text. A value of -1 hides the layer. Within an object clip, kind 0 selects sprite IDs; kinds 1 and 2 are colored polygon layers. Flags 1 and 2 pass through to the native sprite flip bits. The sprite offset in the event is scaled before adding the position key; PNG anchors are top-left, `[0,0]`.

`8002af18`, `8002b1d4`, `8002b57c`, `8002b880`, `8002b914` and `8002bbb0` evaluate event, movement, scale, blending, color and palette tracks respectively. Movement uses a step, integer linear interpolation, or a cubic Bézier, according to the next key's interpolation flag and the current/next control points. Fixed-point multiplication follows `80022044`, with 12 fractional bits. The standalone sampler preserves this arithmetic for the covered sprite path.

## Exact message and voice lookup

`80029ff0` selects `messageBase[phase*18 + sceneId] + localTextId`, then uses the original message engine. Glyph streams in `messages.json` are copied from resource 775; they are not translated, OCR-derived or replaced with new prose. The original font atlases and renderer format are already available in `extracted/original-ui/font/`.

`80026338` builds a chronological event queue from root layer kinds 3–6. An event's aggregate tick is its local tick plus the sum of **previous root clip durations minus one**. The queue sorts by aggregate tick. These event kinds are:

| Layer kind | Native handler | Meaning |
| --- | --- | --- |
| 3 | `8002833c`, preparation in `80028440` | XA voice slot |
| 4 | `80027edc` | Music start/change/fade control; encoded selector and argument retained |
| 5 | `800279c4` | SPU sequence effect, using bank 3 and channels 5–7 |
| 6 | `80027c80` | Secondary script/effect resource; full command semantics not ported here |

For XA, `80028440` calls `800193a0(campaignXaFamily, phase, slot, callback)`. The raw first-voice preload path at `0x80026984–0x800269a8` uses the same formula. The resulting ID is `groupTable[family + phase]*16 + slot - 1`, where the table starts at `0x80064d1c`. Every exported campaign voice ID is checked against the real XA manifest. `index.json.campaign[].scenes[].voices` contains concrete IDs, sequence index, source event ID and logical aggregate tick.

First campaign, stage 0 uses intro resource **175**, VRAM **300**, text base **1663**, and four root clips lasting **126, 386, 343 and 1854 logical ticks**. Its 60 XA slots resolve to IDs **0–59**. The first text/voice events are:

| Sequence | Local tick | Message ID | XA ID |
| --- | --- | --- | --- |
| 0 | 31 | 1664 | 0 |
| 0 | 56 | 1665 | 1 |
| 0 | 80 | 1666 | 2 |
| 1 | 30 | 1667 | 3 |

The first later scene is resource 166 and uses XA IDs 64–67. This mapping is directly supported by data and code; it does not imply those scenes are already integrated with the browser's victory logic.

## Time, pauses and activation

`800288c8` activates sequence 0 and registers `80026e24` as an update callback. The callback toggles bit 0x100 and advances on alternate invocations. It increments only active sequences and clamps their frame counters to `duration - 1`. Flags 1, 2, 4 and 8 suppress advancement: skip/pause, pending audio/resource work, end-of-message wait, and page wait.

`STORY.c/FUN_800aeb58` renders all sequences up to the active sequence, retaining completed sequence layers. When the last active sequence completes, it activates the next only when that next sequence's counter is zero. Confirm input calls `80028afc`, which releases the page/message waits and may stop XA. `80029ff0` rebuilds and advances the glyph renderer by the current logical text age and displays a continuation icon at `(290,207)` when waiting.

Consequently, the exported durations and timestamps are **logical animation ticks, not wall-clock audio timestamps**. Dividing all timestamps by 30 and playing a fixed movie would lose the original dialogue waits and CD synchronization. A browser scheduler must port those states, sequence activation and input semantics before claiming original story playback timing.

## Texture decoding

`NARUTOVRAM V000\x1a` starts with a u32 upload count, then records with signed s16 x/y, u16 width/height in words and raw 16-bit VRAM pixels padded to a four-byte boundary. A u32 palette count follows; each palette has a u32 word count and that many 16-bit colors. Story textures upload at x + 384. Some records intentionally have x = -64, so treating x as unsigned corrupts those scenes.

Sprites are sampled with the native 256-pixel UV wrapping, 4/8-bit pixel mode and palette references. Negative default palette indices can be replaced by palette keyframes; exported `paletteVariants` covers every palette selected by the story sampler. An 8-bit sprite can legitimately use a 16-entry palette when all its pixel indices are below 16; the exporter validates actual indices rather than rejecting that combination.

Palette bit 15 is preserved in JSON. PNG pixels are transparent only for color word 0; native semitransparency, color modulation and blend formulas still belong to the renderer. Default PNGs alone are not a complete GPU reproduction.

## Runtime files and scope

- `extracted/story/index.json`: resource selection, all story root timelines, global message IDs, campaign mappings and concrete XA IDs.
- `extracted/story/scenes/scene_NNN.json`: exact numeric tables, source hashes and generic root event timelines.
- `extracted/story/assets/scene_NNN/sprites.json`: sprite dimensions, default/animated palettes, original palette words, upload rectangles and PNG filenames.
- `extracted/story/messages.json`: 451 referenced original message glyph streams.
- `research/story-scene.mjs`: pure JavaScript `sampleSequence(scene, sequenceIndex, logicalTick, {messageBase})`, `sequenceEvents`, `positionAt` and `mul12`. It returns sprite transforms, modulation/blend/flip fields and text IDs. It samples one active root sequence; the caller retains and samples earlier activated sequences at their clamped final tick.

The subsequent native runtime implements polygon geometry, the text/XA waiting scheduler, and software sprite/polygon/font compositing. See `research/story-runtime.md` and `research/story-runtime.mjs`. Music/SPU/effect handlers and complete campaign transitions remain caller responsibilities. GPU raster accuracy still requires original capture comparison. No browser-game files were changed.

Validation:

```sh
.venv/bin/python scripts/extract_story.py
.venv/bin/python -m unittest discover -s tests -p test_story.py -v
node research/validate-story.mjs
```

Five format/regression tests pass. Exhaustive sampling checks **20,903 logical frames**, **834,205 sprite instances** and **9,749 text instances**, with no missing selected sprite/palette PNGs. Polygon vertices are now assembled into drawable groups by the sampler; current counts are recorded in `validation.json`. Results are in `extracted/story/validation.json`. These checks validate extraction and local invariants; they are not an original-console timing or screenshot comparison.
