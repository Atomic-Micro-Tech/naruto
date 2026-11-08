# Native CPU combat cards

`cpuCombatCard({inventory,cards,side,rngState,mandatoryHalfCost})` in `story1-cpu-combatcard.mjs` returns a slot/cardId and updated RNG. Side0 is attacker, side1 defender. Call once at the original card dialog entry, attacker before defender, before combat-technique setup. Consume a selected valid card using the normal inventory removal path. This helper itself does not mutate inventory.

BOARD800d6e7c state9 detects attack types8/9, state14 detects defense types10/11. States10/15 configure CPU-controlled (or possessed) players using80103e40(1) and80103e5c(0), selecting the affirmative dialog response. There is no personality/wealth frequency gate. States12/17 then repeatedly consume `rand()%3`, at most50 attempts, stopping at a compatible inventory slot. Thus the CPU uses attack card22 or24/25/26 and defense card23 whenever offered. No shipped card has type11, although its branch exists. Tests use one synthetic type11 record only to verify that branch, not as game content.

The mandatory attacker half-cost flag+610 skips the dialog and RNG, searches the first three slots for ID22, selects/removes the first match, and clears the flag. A missing22 yields no card. The flag does not affect defender selection.

If all50 random attempts miss, original code forwards the last random slot to the selection widget. The helper preserves that slot and exposes valid=false; it does not consume an incompatible card or invent another draw. Human card selection and widget callback timing remain outside this CPU helper.

Validation: `node --test research/story1-cpu-combatcard.test.mjs` (4 cases), checking exact rejection draws, side filtering, forced22/no RNG, duplicate first match, and missing22.
