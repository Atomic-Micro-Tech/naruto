# Native CARD-RACE port

`race-rules.mjs` implements the interactive rules for original scenarios 3 and 6 (map 16 and 17). It imports source-derived deck/RNG helpers from `faithful-rules.mjs`. No emulator or translated MIPS is involved. `race-data.json` contains original maps, scenarios, deck 8, and movement-card definitions. `scripts/extract_race_assets.py` reproduces the data and 13 original tile sprites in `extracted/original-ui/race/`.

## Integration

```js
let race = createRaceState(map, { seed, characterIds: [0, 1], firstPlayer: 0 });
race = stepRace(race, { type: 'roll', value: 3 });
// Use raceActions(race) to inspect currently permitted input.
race = stepRace(race, { type: 'play-card', slot: 0, target: race.actor });
// AI returns explicit updated RNG state; apply before its action.
const decision = chooseRaceAction(race);
race.seed = decision.seed;
race = stepRace(race, decision.action);
```

State and events are JSON serializable. Events provide movement paths, sprite role, tile reveals, card/HP changes, turn changes, and wins. Intermediate animation/dialogue frames are left to the renderer. Full hands on a free draw require `replaceSlot: 0..2` or `discard: true` on `choose-card`. Original paid draws remain in the same turn; free tile draws finish the turn. Maps must retain original `neighborSlots`; array sorting destroys movement semantics.

## Recovered rules and provenance

- `FUN_800b63f4` scans type 22 start tiles in descending tile index. Map 16 starts are player 0=18, player 1=0; map 17 starts are 20 and 0. Goals are type 0. Separate lanes have no collision/shared-tile rule.
- Scenario table: initial chakra 600, skill 0, flags `0x6000`, deck 8, roulette `[1,1,1,2,2,2,3,3,3,4,4,4]`.
- `FUN_800df0c8` gives each player cards `[46,47,48]` (2,3,4) on their first turn, then requires an opening roulette movement. Later turns expose the card/draw/rest menu.
- `FUN_800df698` permits drawing only with chakra >=200 and an empty hand slot. `FUN_800eb290` charges 100, then executes the usual three-card choice UI. `FUN_800ec574` returns a paid draw to the current player's menu. Rest is confirmed through `FUN_800f34d0`; `FUN_800dfee8` adds 100 and switches to the other player.
- `FUN_800e8190` moves the selected target by the movement-card value. A card above ID 44 targeting the other player reverses movement. Forward follows neighbor slot 0; backward follows slot 1. Distance is capped at the first goal/start endpoint. `FUN_80013b10` returns a used card to the deck and compacts the hand.
- `FUN_800e9220` checks the moved character's goal first, then chakra <=0. Its original-actor-first check awards the opponent if both chakra totals are <=0. Goal takes priority over the chakra check.
- Effects 9–20: free draw; self +2/+3/-2/-3; other +1/+2/-1/-2; self chakra -100/-200/+100. `FUN_800e87c0` and `FUN_800e9220` supply these branches. The actor and moved character are distinct when targeting an opponent.
- Unknown tile 21 samples `9 + rand()%12` until its per-player reveal limit permits it. Limits are 2 for effects 9,10,12,13,14,17,20 and 1 for 11,15,16,18,19. These counters initialize once per match. `FUN_800fec20` permanently replaces the tile type/graphic. The `+0x55d` flag prevents a secondary movement effect from recursively firing another landing effect during that turn.
- Free draw with a full hand selects among three held cards plus the newly drawn card. `FUN_800ec574` returns a replaced old card through `FUN_80013b10`; selecting the new card for discard does **not** return it to the deck. The module preserves this source behavior.
- `FUN_800c82c4` supplies the menu AI score rules. `FUN_800c7574` uses the 5×60 priority table at `0x80139c0c` for draw selection. `FUN_800c7870` uses a discard table with no race-card IDs, so normal policies choose slot 0; discard policy 3 chooses a random slot among four. The source's opponent-target candidate evaluation checks forward neighbors even though actual opponent card movement is backward; this behavior is retained.

## Graphics

Resource 39 is loaded with rectangles at `0x800aede8`, supplementing BOARD resource 38. `race/assets.json` preserves texture pages, CLUTs, UVs, and centered anchors for tile types 9–21. Character forward movement uses the existing directional walk animations 9–12. Backward card/effect movement sets animation 3 (`FUN_800c0a00`), rather than reverse-playing a forward walk. Original map backgrounds already contain lane/start/goal art; use map 16/17 backgrounds and these tile overlays.

## Verification and limits

`node --test research/race-rules.test.mjs` passes 11 tests, including independent expected lane paths, all movement/chakra effects, goal priority, draw/rest eligibility, replacement/discard behavior, effect limits, JSON replay, and 30 complete AI matches across both maps. These verify the isolated rules, not a frame-by-frame original execution trace.

Default initialization shuffles the gameplay pool only. Exact whole-program RNG parity requires passing the already shuffled pool and RNG state at gameplay entry; intro/animation/audio/random calls outside this port are not simulated. Roulette values are explicit inputs from the renderer; AI's opening-roll fallback samples 1–4 and does not reproduce original wheel timing. The module supports explicit `drawPolicy`/`discardPolicy` fields, but mapping the original scenario control bytes to those policy IDs remains outside this bounded port. Animation durations, dialogue sequencing, rewards/unlocks, and save-format compatibility are separate concerns.
