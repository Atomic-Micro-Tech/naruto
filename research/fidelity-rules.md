# Rules recovered from executable and board overlay

This is a bounded, source-derived rules library, **not a complete1:1 remake**. No emulator is used. The helpers deliberately report unresolved effects instead of filling gaps with invented outcomes. Binary extraction is reproducible with `python3 research/extract_full_rules.py`; verification runs with `node --test research/faithful-rules.test.mjs`.

## Extracted data

`full-rules.json` records the source EXE SHA256 and addresses. It contains52 valid cards (entry52 is the `0xffffffff` sentinel),18 deck slots with two64-byte pools each,14 board ninjutsu skill costs,48 scenario table slots including29 no-roster templates, and three campaign sequences of10/3/6 stages. Deck slots9–17 are zero-filled reserved data, not distinct designed decks. Duplicate card IDs in a deck are intentional weights. Both pool copies are identical in this executable.

Card table at `0x80055cec`, stride16: type, usage flag, signed value, **message ID**. The final field239–290 is passed to `FUN_80100dcc` by `FUN_8010e820`; it must not be interpreted as a texture/resource ID. Flag1 means immediate; flag2 is usable at board menu context2; flag0 type8/9 is usable in context4 and type10/11 in context5 (`FUN_8010f3e0`). Inventory capacity is3 (`0x800139fc`, `13a48`, `13b10`, `13bf0`).

Scenario layout is verified by `FUN_80012eac`: map+0, setting+1, deck+2, initial/target/basebonus u32+4/+8/+12, initial player skill+16, separate global setting+17, four mask/value pairs+18, roulette12bytes+34, four5-byte character/loadout records+46. The16 bytes+66 are copied by `FUN_80016258` into per-player control fields; their semantics remain unknown, so the extractor calls them `unknownControlBytes`. They are not board ninjutsu IDs. Rule masks OR together; values populate every set bit's parameter slot in order.

## Implemented verified helpers

| Helper | Source | Behavior |
|---|---|---|
| `ps1Random` | main `rand`0x80035d78 | u32 LCG multiply0x41c64e6d, add0x3039; return bits16–30 |
| `shuffleDeck` | main0x80015b7c | Exactly length×4 swaps of slot(i%length) with rand()%length |
| `insertCard`, `returnCard`, `drawFirstCard` | main0x800159bc/15adc/15768 | Insert rejects append; return into floor(n/2)+rand()%floor(n/2); draw removes first and reshuffles |
| `drawChanceCard` | BOARD0x8010d3a8 +0x800ec574 | Choose one of first3, remove, shuffle, insert at front; immediate cards reinsert a duplicate before final first-card draw/shuffle |
| `canUseCard`, `addInventoryCard` | BOARD0x8010f3e0 + main0x80013a48 | Usage contexts and first-empty3-slot inventory |
| `barrierChains` | BOARD0x800be0e4 | Walk only neighbor slot0 with equal owner, at most5 links; assign chain field and skip corresponding table indices |
| `barrierRent` | BOARD0x800b770c | chain0/1/2/3/4 multiplies base by1/1.2/1.5/1.8/2 with integer truncation; default including5 returns0 |
| `sourceBonus` | BOARD0x800bdc4c | basebonus+floor(sum(current owned barrier rents)/2) |
| `repairAtBonus` | BOARD0x800edd68 case1 | Each owned barrier counts completed bonuses separately; every second repairs1hp up to level+1 |
| `chanceEffect` | BOARD0x800ec574 +0x800f2a9c | Exact flat chakra, level-weighted property tax, random-player transfer, all-player transfer, skill delta and inventory category plans |
| `sourceVictory` | BOARD0x800edd68 case2/3 | Conditional source victory masks0x2000/0x200/8/4/0x20/team/default in original branch order |
| `clearCrystalsAfterBonus` | BOARD0x800edd68 case2 | Clear crystal high-nibble of visitor and same-team players |
| `shouldAwardScroll` | BOARD0x800edd68 case10 | With no holder: first award after everyone has a bonus or visitor has two; later unheld scroll awarded on next qualifying source visit |
| `transferScroll` | BOARD0x800e70c8 case6 | Clear previous flag0x200, set recipient flag, reset recipient scroll counter |
| `upgradePrice` | BOARD0x800e3e74 | Jump1/2/3/4 levels costs base×1/4/8/16 |
| `useBoardCard`, `rouletteForStatus` | BOARD0x800d15a8,0x800ea18c/0x800f3658 | Forced next movement, skip-turn counter, two-roll roulette ranges |
| `teleportPlan` | BOARD0x800ec574/800e7b38 and animation mutation | Exact card destinations and moved players; UI and event execution remain caller responsibilities |

Functions accept one-based barrier levels; the original stores level minus one in bits8–11 of the tile status word. Original graph neighbor slot order and original tile order are essential. The old engine's graph-component/BFS multiplier is not equivalent to this routine. Original chain generation includes equal unowned owner codes too; ownership matters when rents are consumed.

The raw18-map neighbor audit found **no tile with slot0=255**. Consequently the existing extractor's removal of255 entries preserves slot0 for this disc, although preserving all four slots remains preferable for direction-indexed movement.

The exported source victory helper covers only that state. It does not replace other win checks throughout the game. `sealCount` names runtime byte+0x1d; scroll possession is the separate bit0x200. The scroll award helper assumes the caller already reached the relevant source state and is not inside a modal movement branch. `transferScroll` performs the state mutation only; it does not validate steal triggers.

Type1 chance tax uses the **sum of owned barrier levels**, not count. Type3 cards7/8 pay50/25 to each opponent; in team mode player and teammate each receive value×(n−2), while eligible opponents receive the opposite amount. Protection bit0 of player+0xd excludes recipients in this routine; it does not reduce the current player's initial amount. Type2 exists in the dispatcher but no type2 card occurs in the52-card table.

Chance events occur on **passing and landing**. Board state8 dispatches tile2 to the chance routine without requiring remaining movement0. Ordinary card effects resume movement if movement remains. Type5 held cards set the next movement count, consuming it when movement begins. Type7 sets skip-turn count on another player (self-target leaves it unchanged). Types13/14 set roulette status0x12/0x22, producing[1,2,3]×4/[4,5,6]×4; type15 sets0x32 for[10,11,12]×4. Low nibble is decremented after each roll; original roulette is restored after roll resolution, with status cleared at count0. Player status+0xc bit2 overrides these with[1,2,3]×4.

Teleport card10 grants all crystals and returns to source tile0; card11 chooses a crystal, card12 chooses a junction, card36 moves the user to a chosen eligible player's position. They clear the actor's status+0xd, reset direction, cancel remaining movement, and trigger the destination tile event after warp. Card35 summons all other players without protection bit0 (status&1) to the actor's tile, resets their directions, and ends its action without repeating the destination event. Exact post-animation mutation occurs inside `FUN_800db29c`; the pure plan does not reproduce its animation timing. The force-movement card-race path remains separate from `useBoardCard`.

Message rendering was traced to DATA resource0x307 loaded by main0x8001a4d8. Header u16+4 gives message count, records at+8 are{u16 wordOffset,u16 glyphCount}; u16 glyph stream starts8+count×4. Main0x8001a9cc renders glyph runs; glyph/font/control-token decoding has not been implemented here. Card message IDs239–290 are exact and can be used with that renderer once recovered.

## Verified facts awaiting full integration

- Source landing offers remote owned-barrier upgrades (BOARD0x800edd68 case8), including source stops without a completed collection. The source is not merely a turn-end tile.
- All14 ninjutsu skill costs are extracted. `FUN_800d9570` IDs0–5/7–9 charge their exact cost, clear tile status low4bits, then install effectid=id+1 via animation-time state at0x800dace8/related case9. IDs10–13 enter target selection. ID6 and downstream effect resolution still need tracing. Applying a guessed attack or blanket damage here would not be faithful.
- Scroll theft on co-location requires the non-holder visitor, holder on same tile, holder not protected by player+0xd bit0, movement-state guards, and sometimes inventory card20. Inventory card21 can prevent theft and is consumed (`FUN_800ba43c`). Barrier-capture theft has a separate path near0x800d7e..; do not implement universal theft merely from this helper.
- Team deltas are mirrored onto a same-team player in `FUN_800be5d8`; ordinary transfers cannot be modeled as only two independent wallets. Team crystal clearing and source victory reason are implemented separately.
- Card-race campaign stages use map16/17, deck8, initialchakra600, skill0, modeflags0x6000, roulette[1,1,1,2,2,2,3,3,3,4,4,4]. Deck8 is[45,46,46,46,47,47,47,48,48,49,50]. This recovers configuration, not all race movement/collision/damage logic.

## Remaining fidelity blockers

Full card-race state machine; exact ninjutsu effects and target rules; teleport animation/event integration; held-card targeting/protection expiration; complete seal acquisition/consumption and bankruptcy states; team synchronization beyond the helpers; NPC decision policies; animation/audio/dialogue sequencing; save/replay across every original RNG call; and scenario control-byte interpretation remain incomplete. Full game equivalence cannot be established by the isolated tests. Pool-index parameters in several newly decompiled helper functions were optimized/inferred as zero by Ghidra; pool0 behavior is supported, but pool1 call semantics need MIPS listing validation before claiming equivalence in special modes.

The additional decompilation is saved in `decompiled/RULE_HELPERS.c`. Existing `decompiled/BOARD.c` and main executable remain the source of truth; tests verify chosen independent numerical fixtures and invariants, not a full original-game trace.
