# Naruto story stage1 audit

Scope: scenario0/map0, native browser rewrite, audit of source against browser code on2026-11-08. Browser files are being edited concurrently by the parent; discrepancies below describe the audited snapshot, not a claim they remain unfixed.

## Exact setup

Main scenario table80057798 is initialized by80012eac. Scenario0 is map0, music10, deck0,1500 starting chakra,3000 target,400 base circuit bonus,3 initial skill points,4 skill award,modeFlags0. The twelve roulette faces are `[1,2,2,3,3,3,4,4,4,5,5,6]`. Player0 is character12(Naruto with goggles),human,board techniques10,1,14,14; player1 is character10(Mizuki),CPU,techniques10,13,2,14.14 is the unused technique sentinel. Iruka is character8, not10.

The formerly unnamed scenario byte+1 (`stageSetting`) is the music bank: initializer80012eac passes it to80013464, which stores80070cd1;80013488 reads that byte. BOARD800b1e88 calls80017c54(0,bank),80017ee0(0,1),800182a8(bank),8001811c(...). Stage0 therefore starts bank10/resource1252. Main getter/setter extraction is inSTORY1_HELPERS.c and reproducible withStory1Helpers.java.

BOARD initialization sets every player's position to0 and movement direction/facing to255. Ordinary mode starts source tile0. Opening state800ce9f8 pans across each crystal for61ticks, then the source, before returning camera to the actor. Circle can bypass this presentation. The opening also invokes80114b8c/80114c74 (stage display) and80119af0/80119bd0 before the first turn. The browser snapshot entered roulette directly without those presentations.

## Turn/menu and passage differences

800cee18 case6 builds the pre-roll menu. Native action0 is movement roulette; action1 is forced movement and replaces0 whenever player+21!=0. Action2 is hidden. Action3 is board jutsu, disabled once global+360 is set; successful800d9570 branches set that flag. Action4 is the scroll-power submenu, only when player flags+0a has0x200. Action5 is held-card use, only once before movement (+60f==0) and when inventory remains. Action6 is hidden. Dispatcher800ea18c also accepts7 (player information) and8 (map inspection); the latter is also available through the source0x10 input shortcut. These inspection commands return to the prior menu without taking a turn.

800d050c removes inventory IDs outside13..30 and calls800c2728 to compact. Card commit800d15a8 calls80013b10, reloads all3 slots, disables action5, and sets+60f=1. The audited browser merely wrote255 into a used slot, leaving a gap; native ordering compacts immediately. The parent has separately addressed once-per-turn card gating and forced movement.

Tile dispatch800f3658 state8 calls type0 source800edd68, type1 crystal800eb434, type2 chance800ec574, type4 vacant800f0c10, type5 barrier800f1290. Crystal acquisition and chance interruption occur during passage as well as landing. **Crystal remote upgrade differs from source:** crystal800eb434 case7 only offers it when remaining+2e5==0; passing continues immediately. Source800edd68 case8 offers an upgrade after successful circuit bonus even with movement left. Source case20 resumes the remaining movement. A successful source win is evaluated before that upgrade flow.

The audited browser offered source/crystal upgrades only in its landing phase, so source passage was missing an interruption. Native remote upgrades are one level at basecost; local owned-barrier upgrades may choose multiple levels. See story1-economy.mjs for the source commit.

Source800edd68 case1 increments scroll bonus counters before paying the circuit bonus. Case3, normal flags0, requires chakra>=target and sets winner actor,reason0,state0x3f,remaining0. Thus reaching3000 from rent/card/jutsu alone is insufficient: the successful source-bonus event is the normal win trigger. The native engine should preserve this event boundary.

## Scroll powers

See story1-scroll.md and executable module. These powers can become available later in this same stage. Their absence is a gameplay discrepancy even though no scroll is held on the first turn. They consume the scroll and finish the turn; they do not cost skill points and must not be conflated with action3 jutsu.

## Map0 defender path proof

story1-route.mjs specializes800b78e4 (direction score) and800b83fc (distance/path builder), retaining the original slot scan order and20-step lookahead. Map0 is exactly22tiles with slot0=(id+1)%22,slot1=(id+21)%22,slots2/3=255; no junctiontype3 or transparenttype6 exists. Both source candidates stay on their initial slot. Every pair has a route of at most11steps, so a reached candidate always wins the score (`floor(hypot(dx,dy))+20*count-10000`). Among reached candidates fewersteps wins, and exact11/11 ties choose slot0 because the source comparison is strict `<`.

The source's `acStack_b8[local_68]` sentinel read does not affect this specialization: both current candidate junction IDs remain-1, so the junction-equality branch cannot execute. Distances match shortest ring distances for all484pairs, but this does **not** justify a generic BFS on other maps. The helper rejects other topology and supplies source-ordered path `[from,...,to]`. This is defender travel; it does not implement CPU movement preferences.

## Remaining visible differences at audit

- app.enterGame stopped music and did not playbank10. Source bank mapping now confirmed for integration.
- CPU movement used nearest missing crystal/source BFS; CPU roulette used fixed timing. Source800cad18 targets a value and800c88f0 arbitrates pre-roll actions. A map0 ring avoids junction choices but initial/reversed direction preference still needs those CPU rules.
- Browser player menu and message confirmations were HTML controls, not the original menu layout/glyph prompts. Opening map tour and character voice/portrait turn introductions were absent.
- app.animateStep used linear interpolation with an additional90ms pause per tile. Original board-camera.mjs supplies fixed-point movement and source framecounts; added waits change gameplay timing.
- Campaign result modal then an extra chapter-complete page is a browser flow. The source ending/result notification/AFTSTG transitions still need a dedicated runtime comparison; this audit does not certify that transition as1:1.

Validation: `node --test research/story1-route.test.mjs research/story1-scroll.test.mjs` covers route and scroll behavior. These are isolated source expectations; no claim of a full console input-trace comparison.

## Native initial CPU route on map0

`story1CpuInitialRoute(state, actor, {remaining})` in `story1-route.mjs` composes the existing source AI policies with the exact map0 direction menu and movement preview. Its returned `direction` is neighbor slot0/1, `choiceCode` is original up/down/left/right menu code0/1/2/3, and `nextDirection` is the player direction after accepting the chosen neighbor. It consumes RNG only in the possessed-player random-direction branch. Pass native runtime tiles (`purchasePrice`, `upgradeBase`, human levels1..5, owner, rents, effect) and source player flags, status, chakra, position. The wrapper sets a copied actor's direction to0 exactly as800d5bc0 does before evaluation. Restriction: modeFlags0 and original22-node map0.

800d5bc0 builds compact menu slots in screen order up, down, left, right. It chooses valid neighbors whose axis difference exceeds20px, minimizing absolute cross-axis distance, then removes each chosen neighbor. At source0 this is graph direction1/down first and graph direction0/right second. 800b9e30 supplies one landing candidate per graph direction, walking `remaining &127` tiles. Neither order is arbitrary.

800ccd3c chooses the nearest uncollected crystal by truncated Euclidean distance, advances the first neighbor by up to four further hops, and uses the distance there as its base score. It adds source bonuses for landing category, crystal probe, owned barrier count and rent/risk. `cpuRouteGeometry` was corrected from five to four further hops. Crucially a probe stops at the first crystal, even if already collected; it does not search onward for a missing crystal. With initial1500chakra and originalmap0, rolls1..6 select graph directions `[1,1,1,0,0,1]`. Rolls4/5 choose direction0 despite the nearest crystal being counterclockwise. A shortest-path policy would differ.

The cheap-enemy landing score's incoming register has a recoverable caller dependency: MIPS800cd518 sets s2=sp+0x28, a negative PS1 stack address;800cd5b8 and800cd70c replace it with each prior call's returned landing ID. For a one-candidate direction, the first cheap-enemy candidate is therefore rejected (score below−10000), while a later one inherits the prior returned ID0..255 and is accepted. The wrapper uses a representative negative value solely for that first comparison, then carries the exact IDs. When all crystals are collected and this yields landing255, source800cd5c4 immediately reads outside the valid tile table; the helper reports that unsupported memory read instead of inventing a route score.

The raw direction255 forced-card lookahead is also an actual original memory access: tile+1+255 = tile+0x100, the low flags byte of directional arrow sprite slot3 (`0x94+3*0x24`). In the original fresh BOARD overlay all22 map0 bytes are0;800f6db0 does not initialize that absent slot because neighbor3 is255. This supports tile0 as the fresh-map0 unchecked lookahead result, but does not establish arbitrary map/reused-overlay state.

Validation: `node --test research/story1-route.test.mjs research/story1-scroll.test.mjs` covers route and scroll behavior, including484 defender pairs, all22 positions ×13 movement lengths with bit7 variants, native screen ordering, initial six CPU choices, carried-register behavior, invalid-memory reporting and possession RNG.


## Integrated first-chapter status (2026-11-08)

The browser now connects the setup, passage upgrades, inventory rules, forced sales, four scroll powers, debt latch, initial CPU route/pre-roll/roulette/combat-card policies and map0 defender paths described here. Extra90ms movement delays were removed. Board/combat music and story0 SPU commands are connected. Original menu presentation, opening tour, reactive technique selection and full scene choreography remain separate work.

For landing255 route reads, the helper enumerates the four shared penalties0/-10000/-20000/-30000 at address0x8014daf4. It returns an exact winner only if all four outcomes agree. Otherwise it throws UNKNOWN_ROUTE_RAM with possible native winners. The browser adapter catches only that condition, records save.unresolved and chooses the lowest geometric distance among those winners without extra RNG. That legal-turn fallback is intentionally documented as non-exact. Regression seeds7/9 cover memory-independent proof; the30-match integration simulation exercises the fallback at seed29 and completes all30 matches.

Post-battle scroll eligibility has been resolved: COMBAT_SETUP8011f4d8 writes the selected defense technique ID to defender packet+0x1a, except the final free-defense entry writes0xffff; main80019fe8 copies it to board+0x5ce. The browser uses the post-combat HP before resetting captured barrier HP, preserves the final-free-defense exception, returns consumed card21 to the deck and resets the global debt notice only on transfer.
