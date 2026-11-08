# Native story runtime and compositor

The story module now runs the recovered animation sequences, original dialogue control stream and XA voice queue. It uses ordinary JavaScript and Web Audio; no console instructions execute. `story-scene.mjs` now evaluates polygon kinds 1/2 as well as sprites. `story-renderer.mjs` composites the original PNGs and font glyphs in a 320×240 software framebuffer.

## Integration

```js
import {StoryRuntime, createWebAudioStoryAdapter} from './story-runtime.mjs';
import {StoryRenderer} from './story-renderer.mjs';
import {loadXA} from './xa-decoder.mjs';
const audio = createWebAudioStoryAdapter(context, xaIndex,
  entry => loadXA(context, entry, xaBaseURL), {destination: muteGain});
const runtime = new StoryRuntime({
  scene, messageBase: selectedStory.messageBase, messages,
  voices: selectedCampaignScene.voices, audio,
  handlers: {4: musicControl, 5: spuEffect, 6: secondaryEffect},
});
const renderer = new StoryRenderer(canvas, {
  sprites: spriteManifest, images: imageMap, atlases: fontMap, icons: iconMap,
});
// One call per original vertical blank, normally 60 calls per second.
const snapshot = runtime.vblank({confirm: newlyPressedConfirm});
renderer.render(snapshot);
```

`imageMap` maps PNG basenames to loaded images. `fontMap` maps strings such as `12:0` to original font atlases. `iconMap` maps numeric controller-icon IDs to images from `extracted/story/icons/`. These seven icons are extracted by `scripts/extract_story_icons.py` from resource 57 and executable tables used by `80022ccc`. Icon 0 is the original red Circle confirmation symbol. It is placed at x=290, y=206 or 205, accounting for the native -1 offset and one-pixel 60-vblank bob.

All coordinates are already absolute screen pixels. The first dialogue is at **(32,178)**; do not add a dialogue-box origin. The font is 12 pixels with 13-pixel horizontal advance. The original story resets text speed to zero in `STORY.c/FUN_800ade44`.

`runtime.snapshot` is ready immediately. `runtime.confirm()` only releases an existing page/end wait; pressing confirm while text is revealing does not reveal the rest instantly. `runtime.skip()` stops the voice and completes the module; the parent scene controller owns the original surrounding fade/exit states. `snapshot.done` completes after the last visual sequence and current voice have finished. The caller owns campaign results, winning conditions and stage selection.

## Source-derived behavior

Additional font source is in `decompiled/STORY_FONT.c`, reproducible with `scripts/ghidra/StoryFont.java`.

- `80026e24` advances active sequence counters on alternate callbacks. Flags 1/2/4/8 freeze them. Finished sequences remain active and clamped at their last tick.
- `8001ad94` calls `8001add8` twice per logical text tick. The implementation preserves its cursor-before-control inspection, speed counter, delay counter, page state 1, scroll state 3 and end state 4.
- `80029ff0` reconstructs text from logical age on every draw. It uses per-sequence page/end acknowledgements; hiding the text layer clears those acknowledgements.
- `80028afc` gives end acknowledgement priority over page acknowledgement. End acknowledgement stops XA; page acknowledgement releases the text page wait without stopping XA.
- `80026338` collects events and uses an exchange sort. `buildQueue` preserves its equal-time ordering effects.
- `8002833c` starts a prepared voice; `80028440` waits for the current voice to finish before preparing its successor, freezing animation immediately before the next scheduled voice when necessary.
- `80019ab0` supplies signed linear panning, not equal-power panning. `800194d8` applies the 8-bit volume and 7-bit CD gain. `xaPanGains` reproduces these integer calculations. Stereo gains at pan 0 are both 127/128; at pan 16 they are 111/128 and 127/128.
- Confirm cancellation uses the five update steps in `800192c8`/`80017b50`/`8001756c`, scheduled by the Web Audio adapter at its configurable `tickRate` (default 60). Muting routes through the caller's gain node and does not remove voice timing.

All **451 recovered story message streams** use ordinary glyphs, newline controls, and three page-break controls. Those streams therefore require no invented text or unsupported substitutions. The general layout helper additionally supports color, delay, callback marker, icon and caller-provided dynamic number/message expansion. Unrecognized controls remain explicit in `layout.unresolved`.

## Polygon and sprite rendering

`8002a7bc` emits one polygon vertex per kind-1 or kind-2 child layer, including its own position/color tracks. Kind 2 scales vertex coordinates by the root object scale; kind 1 preserves their local scale. Both receive the root event offset and root position. `8002a97c` triangulates the resulting vertex list; the sampler drops only the degenerate closing triangles. Kind 2 draws behind sprites, kind 1 in front, matching the ordering table submission order.

The compositor implements original palette references, palette animation, transparent color zero, STP-selective texture blending, RGB5 color modulation, both sprite flip bits, clipping rectangles and Gouraud polygon colors. Four blend selectors use half-add, saturated add, saturated subtract and quarter-add. A shared triangle edge receives only one blend.

STP is reconstructed from each palette word and the original decoded PNG's RGB5 color. The extractor's 26 story palettes contain no ambiguous nontransparent colors with conflicting STP bits; the compositor rejects such a palette instead of guessing. All source palette words remain available.

## Limits and explicit hooks

The module covers dialogue and visual sequence playback, not the entire story overlay. Music (kind 4), SPU effects (kind 5) and secondary effect scripts (kind 6) dispatch to supplied handlers. A handler may return a Promise to pause until ready, `false` to retry, or any other value to finish. Missing handlers are recorded in `snapshot.unresolved`; with `strictCommands:true` they pause playback. The default allows visual/story integration while exposing those gaps.

The software compositor has not been compared pixel-for-pixel against original console captures. Fixed-point scene transforms, palette selection and blend arithmetic are implemented, but GPU raster-edge interpolation, dithering and GTE projection rounding may still differ. Web Audio playback also does not reproduce PS1's CD interpolation filter or physical seek latency. These limitations must remain visible when describing 1:1 progress.

## Validation

```sh
node research/story-runtime.test.mjs
node research/story-renderer.test.mjs
node research/validate-story.mjs
```

Deterministic virtual-audio tests play all **25 campaign-referenced story scenes** to completion and verify the complete original XA ID ordering. Additional fixtures cover delayed audio preparation, confirm during typing, original long-message page/scroll behavior and XA pan gains. Renderer fixtures verify STP-selective blending and a shared triangle edge. Exhaustive visual sampling covers all 26 story assets, including the additional unreferenced scene family member, with no missing sprite/palette variants. Actual rendered first-stage samples were visually inspected for the Hokage mountain introduction and Naruto/Iruka dialogue.

These are source-derived and local invariant tests, not a complete original-console execution trace. `extracted/story/runtime-validation.json` and `validation.json` contain the results.
