# Original enemy-barrier choice

`story1-cpu.mjs` ports BOARD800f1290 case4 (BOARD.c24710–24883), with menu result0=attack,1=pay. This is distinct from pre-roll menu800c88f0. Seven tests cover original boundaries, RNG consumption, relationship initialization and attack eligibility.

`scenarioRelationships(scenario)` copies `players[].unknownControlBytes` unsigned. Loader80012eac writes those through80016258 into persistent80070f46+player*b4. Getter800162a0 reads that byte and BOARD initializer stores it into signed16 player+2e+target*2. MIPS at800162d0 is `908200a6` (`lbu v0,0xa6(a0)`), so byte255 remains255 and byte128 remains128; no signed-byte conversion or heuristic relation is needed. Scenario0 rows are `[0,0,0,0]` and `[1,0,0,0]`.

Call `enemyBarrierAttackEligibility(player,{techniqueCosts,hasFifthTechnique})` for the original landing menu eligibility. Pass all original normal attack costs (before combat's first4 restriction), and whether main80015d24(index4) succeeds. It finds the minimum **nonzero** signed16 cost starting10000. Card22 halves that minimum once. If wallet was below original minimum, `forceHalfCostCard` records source board+610; the browser should force/use the held half-cost card on attack. Negative wallet plus a valid fifth technique sets bit16. Do not equate a free technique with unconditional landing-menu availability.

Call `cpuEnemyBarrierChoice(state,actor,{relationship,reserveByte,techniqueCosts,hasFifthTechnique})` once when the attack/pay dialog is initialized. `relationship` is that actor's scenario relation indexed by tile.owner; reserveByte comes from `characterCpuParameters`. Return `{action,choice,rngState,draws,...eligibility}`. Preserve returned RNG exactly once; do not call the helper repeatedly on renders.

Mode0 decision:

* Relation255 pays immediately.
* When `(wallet−rent>=0 && rent<701) || relation>179`, HP1 or `trunc(wallet/3)<rent` immediately performs a relation draw. Otherwise it first draws `%256 < reserveByte` to decide whether to perform that relation draw.
* Relation draw `%256 <= relation` attacks. If it does not select attack, rent<1001 pays. Other paths attack.

The rent is ordinary chain-adjusted rent. Double-toll effect does **not** alter this policy's evaluated rent. Mode1 attacks; mode80 pays CPU defenders and attacks human defenders, after relation255 guard. Mode8 scroll-holder defender has an additional relation draw before normal evaluation. Eligibility failure pays without policy RNG.

Example: a healthy enemy barrier charging100 against CPU wallet1500 ordinarily produces PAY in scenario0, whereas the previous browser heuristic attacked. Rent701 or an otherwise unaffordable toll can lead directly to ATTACK without RNG. These intentionally reproduce source thresholds, not strategic recommendations.

Remaining scope: full pre-roll turn-menu competition, board movement selection and combat animation timing are separate. This module does not claim those behaviors are complete.
