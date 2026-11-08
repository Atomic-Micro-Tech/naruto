# Native pre-roll CPU arbitration

`story1-cpu-preroll.mjs` ports BOARD `800c88f0` menu cases 0/1, 3, 4 and 5. It is a pure decision helper, not a browser runtime. Tests: `node --test research/story1-cpu-preroll.test.mjs` (10 cases).

## Integration

Call `cpuPreRoll(state, actor, options)` on each CPU return to the pre-roll menu. State follows `board-effects.mjs`: `rngState`, `modeFlags`, players with `position`, `direction`, `chakra`, `flags`, `actorStatus`, `team`, `inventory` (three slots, empty 255) and `forcedMove`; tiles with `typeCode`, `owner`, `level`, `effect`, native four-slot `neighbors`, `purchasePrice`, `rents`. Preserve neighbor slots including 255. Adapt browser `pos` and `forcedRoll` to `position` and `forcedMove`.

Options: `params=preRollCpuParameters(boardAiData, characterId)`, `cards=fullRules.cards`, `availableJutsu` (four native slots, unavailable 255), `jutsuPriorityTable=boardAiData.jutsuPriorities`, `relationships` (actor's four original unsigned relationship bytes), `crystalCount`, `enabledPowerIds`, `jutsuUsed`, `cardUsed`, `policyState`. Obtain enabled power IDs from `scrollPowerOptions(state,actor).filter(x=>x.enabled).map(x=>x.id)` in `story1-scroll.mjs`.

Commit returned `rngState` even when the chosen action is roll. Preserve returned `policyState` between special actions in the same pre-roll menu; it clears on actual roll/forced movement. Result `kind` is `roll`, `forced-move`, `jutsu`, `scroll-power`, or `card`; result `payload` contains original card slot/target, power ID/target, or the existing `cpuBoardJutsu` result. This helper selects actions; existing effect helpers perform mutations and remove cards.

Source consumes one RNG at every menu policy entry, including repeat entries. Menu order is roll or forced movement, jutsu, scroll (only holder), then card (if inventory present). Each action has its own attempted flag; attempted failures do not retry before the actual roll. Source inventory is normalized by `800d050c` before menu policy; caller must supply the corresponding held-card state.

## Verified details

- Ordinary roll priority 250; successful card 350; scroll 1000. Card frequency is strict `frequency > rand()%10+1`; scroll frequency uses `>=` and can be forced by its score. Jutsu reuses the separately verified `board-ai.mjs` policy.
- Character 10, story0 CPU, has jutsu frequency 1 and card frequency 2. On map0 without type8 special targets, jutsu frequency 1 cannot pass the original gate. Its lack of jutsu use is therefore source behavior, not necessarily missing AI.
- Card-use table is BOARD `80139d38`, 5 rows of 60 bytes, distinct from chance selection table `80139c0c`. Scroll priority table is `80139e64`; lookup at `800ad8b8` is literally `[3,1,2,3]`.
- Targeted card IDs 19,27,29 require the rival's entire actor status byte to equal zero. Score is wallet + owned barrier count*100 + crystal count*2000 + scroll bit value; a nonteam holder also gets 10000. Per-target relationship RNG can zero the score. Team allies score zero.
- Forced movement cards 13..18 look ahead using the actor's fixed direction slot, stop at junctions, then consume a self/rival coin flip even when the lookahead cannot complete. Their special targets are selected using the actor's projected landing tile, preserving the source behavior.
- Scroll power0 execution requires rank bits equal 3, so it is never selected by this policy in a two-player match even when offered. Power1 candidate priority loop inspects only the first playerCount tiles; execution separately scans the entire board. Power2 values raw level rent, without chain multiplier. Power3 is forced at wallet >= -999.

## Explicit limitations

An invalid forced-card directional neighbor is reported rather than silently inventing a path. MIPS800c980c/800c9878 confirms direction255 reads runtime tile+0x100. This is the fourth arrow sprite flag low byte (arrow base0x94+3*0x24), not a neighbor. On fresh map0 all fourth neighbors are255; overlay storage8013b818+i*0x124+0x100 is0, and800f6db0 initializes only present arrow slots. Pass option `direction255TileByte:0` for this verified freshmap0 case. This makes the original lookup repeatedly read tileID0; it is not a reverse-route fallback. Other maps or reused arrow storage require the actual runtime byte and remain unsupported without it.

The extracted character card priorities are all 0..3. The source priority>=5 card branch uses uninitialized stack state; this helper rejects it. Power priority3 contains only 255 and has no match; source's sixth-byte lookup edge is not reproduced and does not affect story0. This port does not include menu tween/update frame RNG or claim whole-game RNG identity.
