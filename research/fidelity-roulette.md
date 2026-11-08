# Original roulette timing and unresolved route distance

`faithful-roulette.mjs` is a pure JavaScript port of the logical roulette widget, shared by board and combat. No emulator is used. It is intentionally separate from rendering, audio, particle simulation, and the rest of the game state. The regression tests exercise recovered timing and fixed-point boundaries; they are not a full-game fidelity claim.

## Integration contract

1. For an ordinary board roll, call `prepareBoardRoll(scenarioFaces, player)` to apply the temporary status faces. Player fields are `rouletteStatus` (original byte+0x26), `playerStatus` (byte+0xc), and `forcedMove` (byte+0x21).
2. Call `startBoardRoulette(faces, rngState, {targetValue:null})`. For combat, supply the twelve generated combat faces directly. An optional CPU target value enables the original automatic stop check.
3. Call `advanceBoardRoulette(wheel)` once per original widget update. Browser paint frequency is not the timing unit. Wheel state and arrays must be retained between calls.
4. Human input calls `stopBoardRoulette(wheel)` **after** that tick's advance. This starts the hammer animation only when phase2 is ready and the wheel is not automatic. It does not immediately freeze the selected face.
5. `rouletteValue(wheel)` reads the current face; it becomes final on the second hammer impact. Phase6 marks the end of the result and exit sequence. `finishBoardRoll(wheel, player)` applies ordinary movement-roll status consumption and returns the movement amount. Combat callers use the value directly and must not consume board status.

Forced movement is a separate dispatcher action in the source; menu construction replaces ordinary action0 with forced action1 whenever a movement value is held. `prepareBoardRoll(faces, player, true)` bypasses the wheel, returns the held movement amount and clears `forcedMove`. It consumes no roulette RNG or status count. The browser adapter enforces that replacement; the lower-level helper keeps the explicit bypass argument.

All helper calls return fresh objects. `events` reports transitions occurring during that call; batched advances use zero-based tick offsets within the call. Phases match the source:0/1 opening,2 ready,3 hammers,4 result countdown,5 exit,6 complete.

## Verified source behavior

| Behavior | Source |
| --- | --- |
|64 swaps: face[i%12] with face[rand()%12], then one rand()%4096 initial angle | BOARD8010ae10; main80020bf4 |
|Opening tween lasts10updates; opening callback setsphase2 | BOARD8010ae10,8010bf0c; main8002128c,800215d8 |
|Logical angle advances180 units per update modulo4096 | main8001fc80 |
|Selected index=floor((angle&4095)/341)%12; angles4092–4095 selectindex0 | main80020dac/80020d70 |
|Freeze clears spin and snapsangle down to a multiple of341 | main80020c90 |
|Three hammer tweens have duration3 and delays0,2,4 | BOARD8010b084; main80021178,80021238 |
|Delay ticks return before updating elapsed; elapsed increments before duration comparison | main80020f88,80021500 |
|Impacts occur3,5,7 widgetupdates after request; second freezes; third resetscountdown60 | BOARD8010bfa8 |
|Scale decreases128 per resulttick, floor128; thirdimpact resetsprogress4096; resultcountdown60 thenexit8updates | BOARD8010b4a8,8010bfa8 |
|CPU target uses FIRST matchingface; forwardangle difference divided by180; starts hammers when quotient is3; earlyreturn skips tweens ontrigger tick | main80020e40; BOARD8010b4a8 |
|Widget updates before board state handles human input | BOARD800b50ac calls8010b4a8 before800f3658 |
|Ordinary roll decrements nonzero low-nibble status count after wheel completion; before movement, bit2 low-range status takes precedence over clearing exhausted high nibble | BOARD800f3658 near800f467c |
|Forced-move action reads+0x21 directly, clearsit, and enters movement without roulette/status decrement | BOARD800ea18c menuaction1 |

The CPU target is a stopping trigger, not a guarantee that the target value is selected. The source's five-update hammer delay can overshoot the face used by its three-update trigger. The test preserves this rather than forcing the target outcome.

The initial shuffle and angle use exactly65 PsyQ LCG draws. Starting hammers consumes two positional jitter draws. The three impacts consume41,41 and42 additional draws:20 particles with two draws each, one label draw, and a second label on the third impact (8010bfa8 ->8010c1c0/8010c5c4). The widget now preserves all191 draws without rendering the particles. Logical angle, impact timing and value selection are separate from those visual draws. This establishes the widget's RNG accounting, not full-session RNG parity across unrecovered scene effects. The browser drives board, combat and scroll widgets on a60Hz logical clock and pauses ticks while hidden or in a modal.

Additional recovered decompilations are in `decompiled/ROULETTE_MAIN.c` and `decompiled/ROULETTE_BOARD.c`. Ghidra mislabels the tween flag constant0x20000020 as `gte_ldrgb` in8002128c; the generic tween dispatcher treats that value as its easing flag.

## Distance sentinel: confirmed native stack dependency

The remaining combat-distance routine800b83fc calls800b78e4. It is a geometric/junction algorithm with map-specific paths and a cap30, rather than ordinary graph shortest distance. Native MIPS validation confirms that a suspicious sentinel-index read is real, not just an artifact of Ghidra's C output:

```text
800b78e4 addiu sp,sp,-0xc8
800b793c li v1,0xff
800b7940 sw v1,0x60(sp)       # best candidate index initially255
...
800b82a8 addiu v1,sp,0x10
800b82ac lw a0,0x60(sp)
800b82b0 nop
800b82b4 addu v0,v1,a0
800b82b8 lbu a2,0x0(v0)      # no sentinel guard before array read
800b82bc li a0,0xff
800b82c0 beq a2,a0,0x800b835c # checks read BYTE, not candidate index
```

When no earlier candidate replaced255, the read is at calleeSP+0x10+255 = **callerSP+0x47**. Caller800b83fc allocates0x90 bytes. Its local byte array at+0x40 initializes bytes0/1 only in the map7 path, leaving byte+0x47 stale. If that byte accidentally names a relevant junction, a later parallel-array read also accesses callerSP+0x4f. The original routine therefore can depend on preexisting stack contents on this path. Replacing this with a bounds-checked255 sentinel would be a deliberate behavior change; assuming zero or255 is not justified by these instructions.

The exact map0 ring specialization has since been added in story1-route.mjs and verified for all484 tile pairs; its branch never reaches this junction dependency. No deterministic exact general-map distance port was added. A future native extractor must supply and preserve the relevant caller stack state, or report an indeterminate result on the uninitialized-read path. A BFS fallback must remain labeled as a fidelity gap. The present bounded work instead recovers the fully specified roulette logic above.
