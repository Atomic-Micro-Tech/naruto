# Native original music playback

`music-player.mjs` interprets the extracted PsyQ SEQ event arrays and schedules the original VAB PCM samples through Web Audio. It does not execute PS1 instructions or use an emulator. No substitute instruments, oscillator sounds, or generated music are used.

```js
import {MusicPlayer} from './music-player.mjs';
const context = new AudioContext();
const music = new MusicPlayer(context, {baseURL: 'assets/music/'});
await music.load();                     // index only; samples load per selected bank
await context.resume();                // invoke from a user gesture
await music.play(0, {sequence: 0, loop: true});
music.setSequenceVolume(63);            // original 0..127 sequence gain BEFORE voice square
music.setVolume(0.5, {fadeSeconds: 1});  // optional master-output level after voice square
music.setMuted(true);                  // leaves sequence clock and sample playback running
music.stop();                          // cancels pending load and stops/disconnects voices
```

Constructor options also accept an already-loaded `index`, `destination` (default `context.destination`), `fetch`, normalized `volume` (default `100/127`), `lookahead` seconds (default `0.15`) and `onEvent` callback. `output` is the master GainNode. `play` returns a Promise resolving to `true`, or `false` when cancelled by a newer play/stop. `load` is idempotent. `dispose` additionally disconnects the output. Use a separate instance sharing the context for menu effects: `play('menu-sfx', {sequence: 0, loop: false})`. There are seven original menu SEQs.

`playing`, `current`, `unresolved` and `clock` expose playback/diagnostic state. `unresolved` contains unsupported effects instead of silently inventing behavior. The master gain is a convenience API after the squared per-voice volumes. `setSequenceVolume(raw0to127, {fadeSeconds: 0})` instead inserts the integer sequence level before pan and squaring, preserving the native gain calculation. It accepts an optional 60 Hz integer fade and exposes its target as `sequenceVolume`. `sequenceFade` records the convenience fade state. The game-level caller owns the final stop/transition; this setter never stops the track. The original game's byte-domain fade in `FUN_8001756c` evaluates remaining steps N..1, then stops when flag `8007186b` is set, so the exact original fade/stop should be driven by the caller rather than inferred from this convenience API.

## Source-derived behavior

- `_SsInitSoundSeq` (`8004cb28`) initializes each channel's program to its channel number, volume 127, pan 64, rounds the initial BPM to nearest (half ties downward), and computes a rounded fixed-point step at the selected tick rate. `_SsGetMetaEvent` (`8004c758`) truncates subsequent BPM. `SequenceClock` implements the 60 Hz `_SsSeqPlay` (`8004de88`) countdown, delta values multiplied by ten from `_SsReadDeltaValue` (`8004ca78`), event ordering and tempo changes. All 39 extracted SEQs are in the supported high-PPQN mode.
- `_SsContNrpn2` (`8004b578`) treats CC99=20 as a saved stream pointer and CC99=30 as loop end. `_SsContDataEntry` (`8004ad28`) sets repeat count from CC6 while a loop is armed. Count 127 repeats indefinitely. The saved pointer is after the next delta: the first event at the repeated position is immediate for the indefinite-loop case. `_SsContNrpn1` (`8004b478`) ignores CC98 when the high value is 20 or 30. Thus the title's CC98=127 does **not** establish an internal loop; its repetition comes from EOF (`8004df84`). `loop:false` deliberately disables repeated playback, including internal loops, for preview/one-shot use.
- `_SsNoteOn` (`8004c928`) treats velocity zero as note-off. `_SsVmSelectToneAndVag` (`80053a18`) selects all tones whose inclusive min/max range contains the note. Empty programs and missing note ranges create no voice. Key-off and bend apply to the current program, including other channels using that program; this is not ordinary independent-channel MIDI behavior.
- `_SsContExpression` (`8004b248`) sets VAB **program volume**. It is not an additional per-channel expression multiplier. CC7 and CC10 update active voices belonging to that program. `_SsVmSetVol` (`80053ae8`) clamps zero volume/pan to one for existing voices, while future note-ons use the channel's actual stored value.
- `_SsVmKeyOnNow` (`80052b88`) combines velocity, channel volume, VAB volume, program volume and tone volume with integer division. Tone, program and channel pan attenuate one side independently; the final sequence voice volumes are squared. `voiceGains` reproduces this calculation with an optional integer sequence-level gain argument (default 127). Bank pan is not part of this routine.
- `SsPitchFromNote` (`8005239c`) uses the original 12-entry semitone and 128-entry fine-tune lookup tables at `8006d53c` and `8006d554`, including integer rounding and the 0x3fff ceiling. `_SsSetPitchBend` (`8004c478`) ignores the low MIDI byte. `_SsVmPBVoice` (`80053058`) uses the upper byte and tone-specific negative/positive ranges, with asymmetric negative rounding. Pitch bend changes currently sounding voices; a later note-on starts at its original pitch.
- NRPN attribute 15 selects reverb type, and attribute 16 sets depth. `SsUtSetReverbType` (`8004fcb8`) rejects values above 9, so common 12/32 commands are no-ops in this executable. Actual supported reverb changes remain explicit diagnostics. All 672 extracted tone records have zero vibrato/portamento settings.
- VAB ADSR1/ADSR2 bits are decoded as in `_SsUtResolveADSR` (`8004bb78`). The envelope model advances integer level/counter states at 44.1 kHz using the register behavior documented in the [PSX-SPX SPU reference](https://psx-spx.consoledev.net/soundprocessingunitspu/). Sample loops use the original ADPCM loop-start/end/repeat metadata; no loop is invented for a nonlooping sample.

## Fidelity limits

This is a native sample player, not a bit-identical SPU DSP implementation. Web Audio supplies resampling; it does not use the console's Gaussian interpolation. Envelope amplitude is evaluated on the register-driven integer model but submitted as piecewise Web Audio ramps (0.25 ms for the first 10 ms, then up to 4 ms). Hardware reverb, DAC/mixer clipping and the exact 24-voice allocator/voice stealing are not reproduced. No replacement reverb is fabricated. Browser timer throttling can delay the lookahead scheduler in background tabs. Real game-level music selectors/fades must come from the story/game caller; bank IDs are resource IDs minus 1242, not invented track names.

The native tempo countdown is source-derived, but end-to-end audio has not been compared against a console recording. Existing source WAV files are offline-decoded original SPU ADPCM. They are labeled 44.1 kHz as the pitch-register base; tone center/fine shift and the original pitch lookup determine the actual musical pitch.

## Verification

`node research/music-player.test.mjs` checks original pitch-table fixtures (including the negative bend asymmetry), stereo volume arithmetic, 60 Hz event boundaries, NRPN and EOF loops, ADSR fixtures, all 39 finite SEQ traversals, sample presence for every sounding note, mute/lifecycle and cancellation of pending asynchronous playback.

The corpus has 23,002 note-on events: 22,851 select original samples and 151 select empty programs or no matching note range. The latter remain silent, as required by the original selection routine. Every finite sequence reaches EOF; total one-pass duration is 63,673 native ticks. `extracted/music/runtime-validation.json` records per-bank/sequence durations.

`research/music-audio-validation.html` performs actual OfflineAudioContext renders of bank 0, bank 3, bank 26 and menu effect 0, checking finite, non-silent output and reporting peak/RMS/clipped frames. Serve the repository root and open this page to repeat the render check. This page is a research fixture, not part of the game UI.
