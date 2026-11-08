# First Naruto campaign stage: original audio dispatch

This is a native JavaScript sequencer using extracted original SEQ/VAB audio, without a console CPU or emulator. `story1-audio.json` records source functions, exact event phases, default volumes, and all 82 intro SPU events. `scripts/extract_story1_audio.py` reproduces the asset pack; `scripts/map_story1_audio.py` reproduces the mapping. No browser-game files were edited.

## Integration

Copy `story1-audio.mjs` and the updated `music-player.mjs` together. Publish `extracted/story1-audio/` as the module's `baseURL`. Its index is 28 original banks / 193 sequences / 169 unique WAV samples, totalling 2,609,756 sample bytes. The pack contains `menu`, `board`, `combat`, `story0`, and the twelve original voice slots for each stage participant (character IDs 12 and 10). Character 12 references the same voice base as character 0. No new or synthesized instruments are included.

```js
import {Story1Audio} from './story1-audio.mjs';
const audio = new Story1Audio(context, {
  baseURL: 'assets/story1-audio/', muted: false,
  musicPlayer: existingMusicPlayer // optional; its assets/music base remains independent
});
await audio.preload(); // loads index and samples for menu, board, story0
const handlers = {5: event => audio.storySound(event)};
await audio.playEvent('board-music');
await audio.playEvent('roll');
await audio.playEvent('stop', {side: 0}); // native roulette side0 pan+64, side1 pan-64
await audio.playEvent('roll-impact', {hammerX: 190});
audio.setMuted(true); // output gain only; timing and channel occupancy continue
```

`playEvent` resolves to the source command. Without the optional `musicPlayer`, `command.music` / `command.fadeMusic` are returned for the caller; SFX still play. With it, BGM commands are applied to that player. `setMuted` and `stop` affect dispatcher SFX, not the injected BGM player; the parent owns that player's mute/stop. `stop()` cancels pending SFX loads, clears channels and resets the story ring. `dispose()` also disconnects owned nodes. For kind5 handlers, return `storySound(event)` directly: it synchronously returns false when all three native story channels are occupied so StoryRuntime retries the command. The ring is 5→6→7→5, not first-free-channel selection. Preload before entering the story to avoid download stalls.

## Source-derived event contract

Default SFX byte volume is 180 (native sequence volume 90), pan0, play once. Details below describe the exact phase that the caller must reproduce; calling an action once at an arbitrary high-level state change does not reproduce its timing.

| Event | Required phase/details | Source result |
|---|---|---|
| `menu-cursor`, `menu-confirm`, `menu-cancel`, `menu-disabled` | Cancel only for source menus ID≥2 and ID≠7 | Menu SEQ2/ch0, SEQ0/ch1, SEQ1/ch1, SEQ10/ch1 |
| `menu-open` | Sliding menu opens | Board SEQ2/ch3 |
| `roll` | Roulette starts spinning | Menu SEQ3/ch0, looping |
| `stop` | Hammers requested; `side:0/1` or explicit signed `pan` | Menu SEQ4/ch1; pan+64/-64 |
| `roll-freeze` | Original freeze callback | Stop channel0; no added sound |
| `roll-impact` | Each actual hammer impact; `hammerX` or `pan` | Menu SEQ5/ch0; pan trunc((x−160)/2) |
| `walk` | Once at step initialization; `jump`, `cpu`, `possessed`, `fast`, `suppressNormalSound` | Board12 for shared tile flag/jump; else10 for CPU/possessed/fast; else8; ch2 |
| `walk-land` | Step finish with `jump:true` | Board13/ch5 |
| `claim` | `phase:'prompt'` or `'confirm'` | Board24/ch1 prompt; generic Menu0/ch1 accepted choice |
| `upgrade` | `phase:'confirm'` | Generic Menu0/ch1 accepted choice only |
| `pay` | `phase:'negative-amount-display'` or `'reaction'` | Board21/ch1 effect3; Board22/ch4 separate actor animation transition |
| `bonus-tick` | Original bonus-count animation, `frame` global counter | Board5/ch2 on even frames only |
| `turn` | Original turn presentation; `readyToWin`, `scriptVoiceActive` | Board47/ch2 if ready, else7; skip during scripted voice |
| `battle-start` | `phase:'transition'` when previous main state3/4 | Board78/ch2 and BGM fade to0 over20/60s, then stop |
| `battle-start` | `phase:'combat-music'` in full combat state0x15 | BGM22, native volume100, loop |
| `battle-result` | `phase:'fade'` in result state10 | BGM fade20/60s then stop |
| `battle-result` | `phase:'music'`, boolean `defenderHpZero` in state20 | BGM24 if defender HP0, else25, native volume100, once |
| `board-music` | Stage0 board entry/return | BGM10, native volume90, loop |
| `character-voice` | Original `character:12/10`, `slot:0..11`, `channel:0..7`, optional `pan` | Original character pack, SEQ0, final volume byte255 |

`jump` means `(sourceTile.byte5 & destinationTile.byte5) !== 0`, rather than any visually perceived leap. `suppressNormalSound` is the native alternate-presentation condition `DAT8013eaac!=0 && board[0x537]!=0`; it does not suppress the jump branch. `fast` is the held input bit0x40; `cpu` player flags+0xa bit0x100, `possessed` player status+c bit0x20. `readyToWin` must come from the actual chakra+bonus, crystals and scroll checks; it is not simply proximity to the finishing tile.

Unknown events and insufficiently specified phases return `{unresolved:...}` and are recorded in `audio.unresolved`; they never substitute a fabricated sound. In particular, no distinct ownership-commit sound, dedicated upgrade visual-effect sound, complete combat choreography, or stage-ending jingle has been asserted. Character slot semantic labels remain unverified.

## Evidence and important corrections

Stage0's campaign record at main EXE0x80058758 selects scenario0. Scenario0 at0x80057798 has music byte10. `80012eac→80013464→80013488` carries it to `BOARD:800b1e88`; `800182a8` reads raw volume180 from table0x800653ac, and `8001811c` shifts it right by1. The playable music is original resource1252 (bank10), not one of intro dialogue music selectors.

Actual bank2 menu sounds are resource1465 (`800172ec`), not resource1464. The earlier music index's `menu-sfx` ID names resource1464 and remains a compatibility alias only; use this new `menu` bank for verified UI/roulette calls. Board bank3 is resource1447 (`80018890`); combat bank3 is1446 (`80018c00`); story0 bank3 is1454 (`800190fc`, table0x80065480).

`80018300` replaces a numbered channel's sequence. `80018468` sets a byte volume shifted right1. `80018508→80019b9c→80019ab0` performs signed pan by attenuating one side of the original byte volume, then shifting each side. `nativePan` implements that integer order; this is not an equal-power StereoPanner. Updated `MusicPlayer.setSequenceStereoVolume(left,right)` applies separate levels before PsyQ's final squared voice-volume curve. Scalar `setSequenceVolume` clears the stereo override. `preload(bank)` is now public and caches decoded original sample buffers.

Story handler `800279c4` plays kind5 from the active story bank, byte volume185, signed event argument as pan, using channels5/6/7. Intro scene175 contains82 kind5 effects,60 XA instructions,8 music commands,0 kind6 commands. Outro scene166 contains0 kind5 effects,4 XA instructions,2 music commands,0 kind6 commands. JSON timelines preserve the source exchange-sort ordering, including equal-time ties, and record logical script ticks, not wall-clock seconds: dialogue/XA waits can extend elapsed playback.

Kind6 is **controller rumble, not audio**: `80027c80` selects a PSQ resource; `8001f4b8/8001f568` validates/starts the vibration script, `8001fbd8→8002e8a4` writes actuator values, and `8002e160` calls `PadSetAct`. Do not attach guessed sound to kind6.

## Validation and remaining fidelity limits

`node research/story1-audio.test.mjs`: all193 sequences terminate under one-shot validation; all259 note-ons have valid referenced original samples where tones select them; all82 intro sequence indices and signed pan arguments are valid. Fixtures check exact integer pan, stereo gain, source phases, ring replacement/backpressure, mute, cancellation and BGM dispatch. `node research/music-player.test.mjs` still passes all39 older music sequences and its pitch/ADSR/controller/lifecycle cases. The earlier Safari offline audio fixture passed four original banks; `music-browser-validation.json` preserves that observation. The new dispatcher itself has unit/asset validation; no new browser-audition claim is made here.

WebAudio scheduling, envelope interpolation, browser resampling, missing hardware reverb and missing shared 24-voice SPU allocation retain the limitations documented in `music-player.md`. Story channel occupancy uses the scheduled SEQ end timestamp, so lookahead does not release the wait early and envelope tails do not extend it. Exact audio DSP equivalence has not been claimed.
