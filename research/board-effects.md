# Native logical board effects

`board-effects.mjs` ports committed logical mutations from this disc's `BOARD.c` and main executable. It does not claim a complete native game. `board-effects.test.mjs` has20 source-branch regression tests. Run `node --test research/board-effects.test.mjs`. `extract_board_effects.py` regenerates the cost/evidence manifest from the original executable; behavior names are audited annotations, not guessed binary fields.

## State adapter

State is `{players, tiles, modeFlags, ruleParameters, targetChakra, rngState, defeatCounters}`. Helpers return fresh state with an `events` array. Player fields are `position`, `chakra`, `skillPoints`, four `boardJutsu` IDs, three-slot `inventory` (empty255), `flags`, `status`, `actorStatus`, `team`, `persistentTeam`, `direction`, `facing`, `skipTurns`, `possessionAttempts`, `scrollSeals`, `debtTurns`, `scrollCounter`.

Keep bitfields distinct: `flags` is ushort+0xa (lap lowbyte, CPU0x100, scroll0x200, rank bits10/11, crystals bits12..15). `status` is byte+0xc (possession0x20); `actorStatus` is byte+0xd (inactive/eliminated1, junction2). `team` is overlay+0xe; non-team games use255 here. Persistent team byte read by800148dc is zero in unteamed games; the helper accepts separate `persistentTeam` to preserve this distinction.

Tile fields: `typeCode, owner, effect, hp, level, neighbors, rents, effectOwnerByte, repairCounter`. Level is1..5. Neighbors must retain original directional slot0 and255 sentinels; chain calculations do not use undirected BFS.

`scenarioInitialPlayers(scenario,{teams})` reproduces scenario/board initialization. Controller is human slot0, except map17 uses slot1. Mode0x10 additionally forces slot1human. Rank starts at slot index. `unknownControlBytes` are passed by80012eac to80016258, not team/controller/initial flag bits. Team mode requires the menu's explicit team assignments. Scenario `unknownSetting17` is verified source skill award (80012a9c/80012ac0). Tile22 start-position overrides are outside this helper. `initialBoardTiles` reproduces800f7adc then800f6ec4: ordinary packedword0xf020; type8 word0x0240 on a fresh game (owner0, HP4, human level3).

## Fourteen IDs

800bbe54 only permits techniques in the player's four-ID loadout, sufficient skill cost, and eligible targets. Its signed16-to-unsigned cost comparison is preserved. **ID6 is deliberately hidden unconditionally and has no cast branch**; implementing an invented usable effect would be unfaithful.

| ID | Cost | Committed behavior | Eligible target |
|---|---:|---|---|
|0|2|Temporary battleHP+1, effect1|Current non-source tile owned by caster, empty effect|
|1|3|Random landing warp, effect2|Current non-source tile, empty effect|
|2|3|Reverse landing direction, effect3|Current non-source tile, empty effect|
|3|3|Suppress enemy landing actions, effect4|Current type5 barrier, empty effect|
|4|6|Double next enemy toll, effect5|Current non-source tile owned by caster, empty effect|
|5|4|Temporary battleHP+2, effect6|Current non-source tile owned by caster, empty effect|
|6|4|Unavailable|None|
|7|6|Possession, effect8|Current non-source tile, empty effect|
|8|4|Skip next turn, effect9|Current non-source tile, empty effect|
|9|8|Force movement stop, effect10|Current non-source tile, empty effect|
|10|4|BarrierHP−1|Enemy type5, or type8 if CPUflag|
|11|4|BarrierHP−1|Same|
|12|8|BarrierHP−3|Same|
|13|6|BarrierHP−2|Same|

Sources: eligibility800bbe54, cast800d9570, target damage800dd7c0, animation commit800db29c. Team mode excludes allied target owners. Damage does not exclude existing effects. Destroyed type5 becomes type4 and resets packedword0xf020, retaining repair counter. Destroyed type8 becomes type7 and retains the packedword. IDs1/2/3/7/8/9 write caster<<4 into tile+d; owned defense/toll effects leave that byte alone. Casting commits after the original animation; caller enforces turn-menu action sequencing.

`boardEffectOnStep` takes remaining movement **after** the arrived-step decrement. Effect10 forces zero even when passing a non-connector. Others require remaining0. Warp rejects current tile/type6 with repeated PS1 RNG draws, resets direction/facing255, and requests destination landing; only one warp per turn. Reverse preserves direction255, toggles0/1, swaps facing1/2 or4/8, and marks junction actorStatus2. Effect4 only suppresses actions for nonowner and still enters toll/end dispatch. Effects3/4/8/9/10 clear effect and tile+d. Warp clears effect but preserves tile+d. See800f3658,800e2e8c,800f32b4,800c4388.

`prepareBarrierDefense` adds temporaryHP1/2. Type5 effects4/7 clear at setup. `consumeBarrierDefenseEffect` clears1/6 later before combat choices. `boardToll` consumes5, computes doubled displayed amount, and returns **signed16 pendingDeltas**, without applying chakra; the original asynchronous updater processes these queues. Team toll is excluded. Toll evidence800dc2e0 states1/2; persistent money setter8001387c clamps−9999..99999.

## Status and scroll

Possession is not a fixed number of turns. 800cee18 generates12faces as `i % max(2,5-attempts)+1`, increments attemptsbyte, and only recovery result1 clears status0x20 (800f3658 state5). `possessionRecoveryFaces` and `finishPossessionRecovery` preserve this. `consumeSkippedTurn` decrements the original skip byte at skipped-turn completion800e61f4. No generic tile-effect timeout is invented.

`attemptScrollTheft` models800ba43c: same tile, different active holder, ever-awarded true, no scripted travel, and either stopped or actor holds card20. First matching holder in slot order; no team exclusion. Protection21 consumes its first copy and actor20 if present, even when stopped and even before arrived-step eligibility. Otherwise success requires arrivedStep (board+0x92a), consumes20 if present, resets former-holder seal/debt counters, and commits transfer800e70c8. `awardScrollAfterBonus` awards only when nobody holds it and either all players completed a lap, actor completed two laps, or it had previously been awarded. It belongs after optional source-upgrade states, not before the source victory check.

`resolveBattleScroll` requires original defender-result word at board+0x5ce explicitly. HP<=0, holder, and word!=−1 trigger protection21 or loss/transfer. **Meaning of that eligibility word remains unresolved**; callers must not manufacture it from attack strength. Statistics counters, UI tutorial state, animation timing, and save writes are not modeled here.

## Source/team/scenarios

`completeSourceBonus` verifies popcount of player crystal bits against map crystal count; it increments the entire16bit flags word as the original does. A held scroll increments seals and increments debt counter if chakra was negative before payment. Every second source bonus repairs owned type5 HP by1 up to level+1 and resets its counter. Mode0x2000 wins before crystal clearing/payment. Otherwise actor/allied crystals clear; bonus is configured base plus half owned barrier rent sum; configured skill award increments with cap8. Persistent nonzero team synchronizes the first teammate's chakra. Victory is checked after payment and before optional upgrade/scroll-award phase. See800edd68/80109fec.

`scenarioVictory` is branch-specific: source-bonus delegates original flag-priority checks; barrier-destroyed checks mode0x100 counttype7; turn-end checks mode0x80 packed defeat counters; round-end requires last actor and exact configured round. `recordScenarioDefeat` records player0/1 capturing player2/3 barriers (excluding nonzero attack distance/specialBattle and type8), or eliminating player2/3. Defender2 increments high nibble; defender3 increments low nibble. This counter is **not crystal count**. Mode0x40 barrier-count win and full elimination/ending presentation are not yet integrated in this helper.

`type8Landing` follows800f2490. Human-controlled players immediately end turn; possession alone does not grant attack eligibility. CPU can attack if chakra meets minimum cost among all character techniques, or negative chakra with fifth technique available. 800b94e8 hardcodes defender0, attacker=currentCPU, attack distance0, defense cost=original directed distance×10. This is a defend-the-barriers scenario; human attacking their own type8 is not a missing action. Type8 destroyed count5 in scenario7 is failure for human defender, while source chakra objective remains a success path.

`sourceBoardRanks` preserves800b7464 signed16 chakra comparison. `sourceResultRanking` uses800e1958 full signed32 chakra minus10000 for inactive players, forced winnerINT_MAX, and the exact nested exchange loop. Equal values are not swapped directly but can reorder indirectly; JavaScript stable sort is not equivalent. Team forcedWinner255 reads an original out-of-bounds team byte; helper demands the observed byte rather than guessing. Result-screen presentation/tie resolution and campaign progression flags are separate from these ranking arrays.

Remaining fidelity limits: directed-distance800b83fc stack-sentinel behavior; animation/global cosmetic RNG interleaving; battle-scroll word semantics; out-of-range team read; all ending/campaign state machines. Tests establish ported branches, not1:1 end-to-end equivalence.
