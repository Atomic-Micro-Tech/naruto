# Battle rules recovered from original code

`faithful-combat.mjs` is a source-derived arithmetic/setup library; it does not reproduce the entire combat scene or timing. Run `node --test research/faithful-combat.test.mjs`. Six independent tests pass.

## Setup and available choices

Main `FUN_800160fc` searches at most10 technique records until ID−1, requiring **all** requested flag bits. `FUN_80015d24`/`15e84` select attack/defense by record order. Their special index4 searches flags0x21/0x22, reserving a flag0x20 technique as fallback. There are **no valid flag0x20 records in this executable's92 techniques**. The negative-ID trailing records terminate the search; they are not fallback moves.

`FUN_8011c680` populates at most4 moves per side from that table. `FUN_8011ccb8` removes the last attack for attacker character9 or12 unless defending character is11 or8. `combatChoices` applies this restriction and card modifications before affordability. Available chakra for affordability is max(chakra,0), so a negative balance can still use a zero-cost option. For a three-option defender, the last (free) defense uses controller slot3 while slot2 is disabled; the internal record index remains2. `inputSlot` exposes that distinction.

The four scenario roster values formerly labeled `techniqueIds` are **board ninjutsu** IDs0–13 with14 empty. They are stored by main0x80014450, read by0x80014404, then tested in `FUN_800bbe54` against board skill costs0x800160d4. They do not select combat moves. Scenario-specific values already exist in `full-rules.json`; a universal free-mode default loadout has not been verified.

## Combat cards and costs

`FUN_8011c680` converts a selected attack type8 card into combat flag2, attack type9 value1/2/3 into flag8/0x10/0x20, and defense type10 into flag4. `FUN_8011ca60` applies them to every available technique:

- Card22/type8 halves both cost fields with truncation toward zero.
- Cards24/25/26/type9 add1/2/3 to both power fields.
- Card23/type10 makes both defense costs zero; `FUN_8011f4d8` also bypasses defense cost subtraction for this combat flag.
- Type11 is accepted by the defense inventory UI, but no type11 card exists in the52-entry card table and no corresponding modifier branch exists in setup.

Costs are subtracted in resolution even when the attack is countered or fails. Each player's chakra is clamped at−9999. Battle result arithmetic uses signed16-bit totals/difference. A defense with flag4 counters non-specialty if flag8 is clear, or specialty if flag8 is set. A successful counter zeros damage and attack total. Damage is max(0,attackPower+attackRoll−defensePower−defenseRoll), capped at barrier HP. Capture/tolls after battle belong to separate board routines.

## Exact roulette faces and CPU stopping

`FUN_8011f2fc` uses BOARD data at0x800af98c:13 rows×12 signed integers. These are binary masks. Rows0/1 each have one final1; rowN for2–12 has N final1s. The initial range table at0x800afbfc is[3,4] for attacker/defender.

For each of12 positions, the routine consumes one original RNG output and computes `mask*(rand()%range+1)+offset`, even when mask0. Default row is max(0,12−distanceSteps), range3/4, offset0. A selected technique with flag0x10 instead uses row max(0,9−distanceSteps), range alternatePower, offset power. No currently valid raw technique has flag0x10, but the helper implements the source branch.

Thus distant defense roulette has explicit zero faces, rather than a vaguely reduced uniform maximum. Human stopping is an interactive timing decision; `combatRoulette` returns all12 faces and never chooses a result itself.

CPU routine `FUN_8011ef10` sorts these12 faces ascending, consumes one discarded random value and then a second random value, and selects rank clamp(aiSkill+second%5,0,11). Main getter0x80016a60 returns player byte at0x80070f54+player×0xb4. Main0x80012eac initializes it from table0x80064d01+characterId×2. Exact skills for characters0–12 are[1,2,3,3,4,2,2,3,2,1,2,8,1], extracted under `combat.aiSkillByCharacter`. This does not establish original CPU technique-choice policy, which also has separate branches at0x8011e0a4 onward.

## Distance limitation

Battle packet+16 is set to ten times the return of `FUN_800b83fc`; `FUN_8011f2fc` divides it by10. Standing attacks use attacker distance0. Defender distance follows the original route from defender position to attacked tile. `FUN_800b83fc` depends on `FUN_800b78e4`, examines coordinates and junctions, excludes tiletype6 from distance, has map5 and map7 special cases, and records a route capped at30 nodes. It is **not a generic shortest-path/BFS distance**.

The complete distance function was audited but not ported in this bounded task. The combined dependency is approximately700 lines with bounded lookahead and map-specific route decisions. A host recompile was not adopted as a verified substitute: the decompilation also contains an out-of-range local sentinel read (`acStack_b8[local_68]` with initial local_68=255) requiring instruction/stack validation. Supplying BFS distance to the exact roulette helper remains an explicit fidelity limitation on branching maps. The source helper accepts `distanceSteps` from a future faithful route implementation without embedding an approximation.

Additional lookup decompilation is in `decompiled/COMBAT_LOOKUP.c`. `full-rules.json` now contains the binary roulette masks/ranges and AI skill table, extracted by `extract_full_rules.py` directly from EXE and DATA.BIN resource1. No browser code was changed by this research task.
