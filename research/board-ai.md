# Native CPU policy recovery

`board-ai.mjs` translates bounded policies from `decompiled/BOARD.c`; it is not a complete port of the board CPU state machine. `extract_board_ai.py` reproducibly extracts preference tables and character parameters from the user's EXE and BOARD overlay into `board-ai.json`. Hashes and source addresses are included there. Additional main getter decompilation is in `decompiled/BOARD_AI_MAIN.c`.

Run `python3 research/extract_board_ai.py` and `node --test research/board-ai.test.mjs`. The tests cover table boundaries, signed sorting, RNG consumption, decision boundaries, register/byte quirks, directed paths and elimination. They are source-translation checks, not an end-to-end original-console replay comparison.

## Inputs and integration

State follows `board-effects.mjs`: `{rngState, modeFlags, defeatCounters, players, tiles}`. Player fields used here: `position`, `direction`, `chakra`, `flags` (CPU0x100, scroll0x200, crystals0x1000..0x8000), `status` (possession0x20), `actorStatus` (inactive1), `team`, `inventory`. Tile fields: `typeCode`, `owner`, one-based `level`, `hp`, `effect`, `repairCounter`, `purchasePrice`, `upgradeBase`, five `rents`, four directional `neighbors`, `x`, `y`. Keep neighbor255 in its original slot. Do not collapse or sort these slots.

Decision helpers return a choice and, when random, `rngState` and `draws`; update the caller's RNG only at the original decision event. They do not mutate input state. `promoteCounterOrder` is an explicitly mutating array utility. `resolveBankruptcy` returns copied players/tiles plus logical events and victory.

| API | Required context | Source |
| --- | --- | --- |
| `characterCpuParameters(data, characterId)` | EXE-derived character table | main162e4..169a4; BOARD800b5790 |
| `cpuPurchaseOrRemoteUpgrade(state, actor, {reserveByte,candidateTiles})` | Original remote-upgrade menu candidate order | 800c7f7c |
| `cpuOwnedBarrierAction(state, actor, {reserveByte,menuActions,decisionByte})` | Original eight action IDs; persistent decision byte | 800ce628 |
| `cpuChanceChoice(state, actor, {cards,priority,priorityTable,crystalTileIds,currentActor})` | Three offered cards, table=`data.cardPriorities` | 800c7574 |
| `cpuDiscardChoice({cards,priority,priorityTable,rngState})` | Four inventory/overflow slots, table=`data.discardPriorities` | 800c7870 |
| `cpuDefenderChoice(state, defender, tileId, {previousChoice})` | Original persistent choice when a human branch leaves it unchanged | 800b94e8 + main8001a18c |
| `cpuCombatOrder({side,techniques,ranged,defenderChoice,rngState})` | Side0 attacker/1 defender, records `{costs:[normal,ranged],powers:[normal,ranged],flags}`; exact defenderChoice from main8001a18c | 8011e0a4/210/4a8/744 |
| `cpuCombatChoice({side,order,aiSkill,selectionRanks,availabilityMask,combatFlags,rngState})` | `aiSkill`=character combatChoiceSkill, ranks=`data.combatSelectionRanks` | 8011e99c +8011ee00 |
| `cpuCombatReaction({side,order,policy,techniques,selectedIndex,opponentCounter,chakra,combatFlags,divisor,availabilityMask,rngState})` | divisor=`data.combatReactiveDivisors[characterId][side]`; call at original reactive update, not every UI repaint | 8011eb74/870 |
| `cpuBoardJutsu(state, actor, options)` | Four available jutsu IDs/255, priority, frequency, table=`data.jutsuPriorities`, targets in original order, signed16 relationships, alreadyAttempted, competingScore | 800c88f0 case3 |
| `cpuRouteProbe(state, actor, {goalType,start,direction,rejectJunction,crystalTileIds})` | Original entry-direction slot and current player.direction | 800ce440 |
| `cpuLandingCandidate(state, actor, {candidates,direction,crystalTileIds,initialScore})` | Eight original movement-preview `{tile,direction}` entries; carried register if necessary | 800cca18 |
| `cpuRouteGeometry(state, actor, {directions,crystalTileIds,mapId})` | Four original route directions | 800ccd3c prepass |
| `cpuChooseRoute(state, actor, {routes,allCrystals,barrierCount})` | Four slots with geometry, landing/probe results and original directed defenderDistance where needed | 800ccd3c scoring |
| `resolveBankruptcy(state, {currentActor,queuesSettled,previousWinner})` | Original elimination mode1; outstanding money/animation callbacks must be settled | 800e0b3c |

## Preserved behavior

* Reserve threshold is `300 + ((unsignedByte + 1) / 180) * 300`, using floating comparison, not a hardcoded wallet floor or purchase-price multiple. Character raw board byte1 is multiplied by25 then narrowed to byte. Main800163a4 supplies that field. Main80016464/16524/166a4/16764 supply chance/discard/jutsu preference and jutsu frequency.
* Owned-barrier upgrading consumes one RNG draw even when the decision byte was already locked. It chooses the largest affordable jump while retaining the reserve, with costs base×1/4/8/16. Eight menu slots retain source ordering and ties.
* Chance preference card11 receives a missing-crystal adjustment. Card36 can set the persistent teleport target while being evaluated even when another card eventually wins. Discard policy3 chooses among all four slots with one draw.
* Attacker combat policy randomly chooses cost-first versus power-first; defender uses the persistent defender-choice field. Both use nested exchange sorting and one-in-eight counter promotion. Counters are flag4 in the original technique selection record, not character specialty. Promotion inserts tail entries at the front, reversing their order. The source reads past the list if every entry qualifies; the helper reports that unsupported state explicitly.
* Combat selection perturbs actual character choice skill by signed `rand()%5`, clamps0..11 and uses the recovered12-entry rank table. Rejection for defender flag4 updates skill on each retry. Selection then wraps through the sorted order against the original availability bitmask. Reactive combat only applies below1001chakra and without flag0x40; divisor1 consumes no RNG. An attacking counter facing a counter is demoted; a defender without a counter facing a counter is promoted.
* Jutsu attempts use `frequency > rand()%10+1` unless any type8 tile exists. Priority is signed for comparison but narrowed to a byte after selecting; negative own-barrier adjustments must retain this wrap. Target damage scores use original signed relationships, team/mode conditions and type8 RNG. The helper returns `actionPriority:255` only when the selected target is usable by this branch. It does not arbitrate the complete turn menu.
* The directed probe stops successfully at a junction unless requested to reject it. Connectors do not increment its100-step budget. Collected crystal stops return failure. Geometry uses vertical distance on map7, otherwise truncated Euclidean distance after the original directional lookahead. Slot2/3 retains the source's two-hop slot adjustment.
* Cheap enemy barriers in800cca18 retain the previous score register rather than assigning a default. The helper requires `initialScore` when no earlier candidate has established one. This is intentional and must not be replaced with an invented score.
* Route selection preserves trap penalties, crystal/scroll/scenario boosts, strict first maximum and possession's random rejection loop. `defenderDistance` is the original directed distance routine result, not Euclidean or graph BFS distance.
* Elimination starts after queued payments finish, for negative wallets only. Team mode initially examines only the current actor; once started it also handles other negative players. It clears player flags, sets inactive, resets owned type5 barriers to empty type4, and leaves inventory/status/skill fields intact. No surviving human with multiple CPUs yields winner255. A one-player survivor at zerochakra retains the previous winner byte; the helper requires that byte instead of inventing a result. Team defeat uses the first matching eliminated pair and first slot outside that pair.

## Remaining integration boundaries

The complete turn-menu scorer800c88f0 (cards/power/roll competition), specialized race-mode policies800c82c4, movement-preview candidate generation and its persistent caller registers are not ported here. `cpuBoardJutsu` is its case3 branch, so calling it before unrelated choices unconditionally changes original RNG/order. Caller must preserve original menu availability and state-machine event order.

The original defender-distance800b83fc/800b78e4 still has a documented sentinel read of caller stack bytes. No universal safe replacement is claimed. Route policy helpers demand the original distance/result where applicable. Main8001a18c's selection-state field is supplied by `cpuDefenderChoice`; human branches require its previous persistent value. Ordinary CPU defense selects cost-first in elimination mode or when carrying the scroll in scroll mode. Otherwise low-chain (<2) and raw rent<201 selects cost-first, else power-first. Type8 uses player0 and the301chakra boundary. Selection flags copy the raw technique flags; setup only adds bit0x80 for unaffordable choices. Scenario relationship bytes are exposed but their conversion into the signed relationship field is not asserted here.

Bankruptcy animation timing, ordinary-mode forced sales, scenario defeat counters, next-actor transition, and result-screen presentation are outside `resolveBankruptcy`. Combine its committed events with `recordScenarioDefeat` and the existing scenario/result helpers at the original transition. This is not proof of complete original CPU behavior or full1:1 fidelity.
