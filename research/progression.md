# Native unlock progression and Bingo Book

`progression.mjs` ports all 28 unlock predicate families from MENU `FUN_800c2ae0`–`FUN_800c4188`, the ascending fixed-point scan in `FUN_800c25ac`, result counters in `FUN_800c2748`, and profile navigation in `FUN_800c49a8`/`FUN_800c5490`. `progression-data.mjs` and `.json` contain all 160 original 24-byte records from MENU address `0x800c7318`; no conditions are invented. Run `scripts/extract_progression.py` to reproduce them and the original image assets.

## Integration and initialization

```js
let progress = newProgression();
// Call after an actual match result, not when opening a menu:
progress = applyResultCounters(progress, {
  mapId, characterIds, pairCounts, achievementCounters,
});
const result = evaluateProgression(progress, matchContext);
progress = result.progress;
// result.notifications are original message IDs; result.unresolved identifies
// statistics the integration has not supplied.
```

Fresh progress has 160 false flags, playSessions=1, matches=0 and zero statistics. Main `FUN_8001210c` clears the entire save region, calls `FUN_80016de4` for characters 0–3 (these do not set flags), and sets the session counter to 1. Thus **no Bingo Book profiles are initially available**. Do not run unlock predicates at new-game or menu entry: some predicates would be satisfied by the empty initial match state, but the original calls them in the result notification scene.

The 160 flags serialize to the original 20-byte little-bit-order bitfield at `0x80070770`. IDs 0–55 are treasures. Characters 0–3 are always playable; characters 4–12 require flags 56–64. Profile pages require flags 65–77 or148. Board selection stage0 is default; stages1–8 require79–86. CARD-RACE maps16/17 require92/93. Main menu optional IDs6,5,7 require92-or93,135,102 respectively.

`applyResultCounters` increments match count except maps16/17, saturating at65535. Per-character encounter counts wrap modulo65536. Its `pairCounts[i]` must be the sum of original getters `800146d8(0,i)` and `80014724(0,i)`, and are added to player0 and opponent i. Only player0 character12 is normalized to character0. The five current achievement counters replace the persistent five counters. Omitted statistics are preserved; this is an explicit integration limitation, not an inferred zero value. The play-session counter is incremented on match launches (`800be4a8`, `800be5a8`) separately from results.

## Predicate context

Common fields accepted directly: `campaignId`, `stageIndex`, `mapId`, `turnCount`, `modeFlags`, `targetChakra`, `winner`, `counter13380`, `specialResultFlag`, `players:[{characterId,chakra,flags}]`, `ranking`, and the 12-value `roulette` array.

Other source getters can be supplied using `context.native[address]`, either as a function or nested arrays matching their arguments. Missing getters fail closed and are reported in `unresolved`; do not replace an untracked counter with zero, because several achievements require zero. Addresses retain native names where their complete event meaning has not been reconstructed.

| Getter | Parameters and storage | Source evidence |
|---|---|---|
|8001519c|player0..3, category0..4 →u16|five special-action counters; BOARD calls800150cc(category) at scroll effects |
|80014888|player0..3, other0..3 →u16|counter increments via80014818 after successful barrier challenges |
|80013380|none →u16|global match counter at80070e90 |
|800152c8|player0..3, chainIndex0..3 →u8|current contiguous owned-barrier chains, rebuilt byBOARD800be0e4; index0 denotes2 barriers |
|80015460|player0..3, rouletteValue1..12 →u8|roulette result count |
|80014ed0|player0..3 →u16|source statistic at80070f2a+player*0xb4 |
|80015234|player0..3 →u16|number of transitions from nonnegative to negative chakra, BOARD800be... animation completion |
|80015078|player0..3, category0..13 →u16|source statistic array at80070f02+player*0xb4 |
|8001f1c4,80012b74|modeFlags→rule index→turn limit|needed for lowest-chakra nonwinner predicate when flags&2 |

`decompiled/PROGRESSION_HELPERS.c` preserves getter storage/bounds. Known comparisons retained exactly include strict negative other-player chakra, nonrace turn bounds, percentage division truncating toward zero, and campaign completion stages≥8,≥2,≥5 for campaigns0,1,2. Flag159 is awarded but excluded from notifications. Notifications for other flags use message ID2194+flag.

## Original Bingo Book

This is a character profile viewer, not a bingo minigame. `extracted/original-ui/bingo/scene.json` maps 16 index slots to14 original profiles, unlock flags, positions, images and sprite metadata. Resources330–343 contain640×480 profile pages. Resource46 supplies original title,14 tabs and locked-tab sprite; resource47 supplies4 page-control sprites and their original positions/animations. `profileId:13` is an extra Haku profile, not a 14th playable character.

The index is320×240,8 columns×2 rows, origin(46,56), spacing(32,80). Slots8 and15 are blank. Index movement wraps and skips blanks; locked tabs remain selectable, but cannot open. Page previous/next skips both blank and locked entries, wrapping through16 slots. Back returns from page to index and from index to main menu. Opening a page resets the control overlay to visible; changing pages preserves it. The original renderer adds a3-pixel shadow to tabs and uses anchor(width/2,3). Index background texture, common pointer, and common back-button helper remain renderer responsibilities.

## Verification

`node --test research/progression.test.mjs` passes11 tests covering source-table count, bitfield round trips, availability, chained fixed-point awards, missing-stat behavior, campaign and turn boundaries, strict bankruptcy, lowest-chakra/turn-limit handling,16-bit result counters, and profile navigation. Tests are isolated source-based expectations, not an original-runtime trace. UI fades, sound timing, memory-card container encoding and collection acquisition events are outside this module.
