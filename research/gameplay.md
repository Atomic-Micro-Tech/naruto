# Gameplay and resource reconstruction

Evidence comes from `decompiled/SLPS_035.53.c` and the disc's executable/data bytes. Names below remain provisional unless explicitly present in the binary. A browser remake must not claim that unverified rules are exact ports.

## Resource index: recovered

`FUN_80011560` installs the index at RAM `0x80055898`, reads resource 0, calls the bootstrap at `0x800ad454`, then installs its copied index at `0x8006d830`. The first index entry is `{LBA 212, size 0x2f44}`; this points to the start of DATA.BIN.

The bootstrap code copies `0x2f00` bytes starting at RAM `0x800ad494` (DATA.BIN offset `0x44`) into the provided destination. Therefore DATA.BIN offsets `[0x44, 0x2f44)` are 1,504 resource records of eight bytes each: little-endian **absolute disc LBA**, little-endian **unpadded byte length**. Convert an entry to a DATA.BIN offset with `(lba - 212) * 2048`. This is an index, not a contiguous archive: entries are not ordered by LBA.

Overlay destination is RAM `0x800ad450`, read from EXE variable `0x80010498`. Verified examples:

| Resource | Disc LBA | Length | DATA.BIN offset | Content |
|---|---:|---:|---:|---|
| 0 | 403 | 0x1afc8 | 0x5f800 | Title/menu overlay |
| 1 | 8778 | 0x919bc | 0x10bb000 | Board/battle overlay |
| 2 | 4754 | 0x4ed8 | 0x8df000 | Story/ending overlay |
| 3 | 32379 | 0x10d4 | 0x3ed3800 | Debug overlay |
| 4 | 32382 | 0xb38 | 0x3ed5000 | Test overlay |
| 5 | 396 | 0x32c4 | 0x5c000 | Logo/movie overlay |
| 6 | 16348 | 0xc860 | 0x1f84000 | PK02, subtype TPK0 |
| 7 | 24590 | 0x80c4 | 0x2f9d000 | PK02, subtype TPK0 |

Graphics packages are parsed by `FUN_8001e50c`: PK01 uses a four-byte offset table, PK02 uses eight-byte records; offsets are relative to the package base, and entries begin at offset 12. In PK02, the second word appears to be the payload length. `FUN_8001e5cc` passes package members to `OpenTIM`/`ReadTIM`.

## Scene system: verified

EXE RAM `0x800558a8` contains 39 records of 28 bytes: overlay ID (u32), init pointer (u32), update pointer (u32), exit pointer (u32), ASCII name (12 bytes). `FUN_800117a4` performs scene exit, overlay loading when required, init, and per-frame update.

Selected records:

| Scene ID | Exact name | Overlay | Init | Update |
|---:|---|---:|---|---|
| 0 | TITLE | 0 | 0x800ad748 | 0x800ad9a4 |
| 1 | LOGO | 5 | 0x800ad4e0 | 0x800ad5f0 |
| 2 | MENU | 0 | 0x800af640 | 0x800af748 |
| 3 | BOARD | 1 | 0x800b1e88 | 0x800b50ac |
| 4 | BOARDRET | 1 | 0x800b2a58 | 0x800b50ac |
| 5 | BAT_INI | 1 | 0x8011c028 | 0x8011ce2c |
| 6 | BAT_VIEW | 1 | 0x8011c028 | 0x8011ce2c |
| 7 | PRESTG | 2 | 0x800adc74 | 0x800adf3c |
| 8 | AFTSTG | 2 | 0x800adc74 | 0x800adf3c |
| 9 | ENDING | 2 | 0x800af3b0 | 0x800af9d4 |
| 15 | BINGO | 0 | 0x800c41ac | 0x800c43b8 |
| 16 | CONCNOTI | 0 | 0x800c1d9c | 0x800c2014 |
| 17 | PRIZE | 0 | 0x800c6054 | 0x800c6294 |
| 20 | STGSEL | 0 | 0x800c6738 | 0x800c6774 |

The executable initializes 320×240 rendering (`FUN_80011608`).

## Players: verified storage and limits

`FUN_80013498` zeroes `0x2d4` bytes at `0x80070ea0`: a four-byte header plus four records of `0xb4` bytes. `FUN_800135bc` accepts player count 1–4. Record base is `0x80070ea4 + index * 0xb4`.

| Record offset | Evidence | Meaning |
|---|---|---|
| 0x00 | FUN_8001373c / FUN_8001378c | Character ID 0–12 |
| 0x04 | FUN_80013620 | Control flag; initialization uses 0 for first player, 1 for others (human/CPU interpretation strongly supported) |
| 0x0c–0x0f | FUN_80014450 | Four IDs, each accepted if <15; likely cards/items, names unverified |
| 0x14 | FUN_8001387c | Signed numeric resource clamped to -9999…99999; likely chakra/currency, needs overlay confirmation |
| 0x1a | FUN_800143ac | Unsigned numeric value capped at 8 |
| 0xa2–0xa5 | FUN_80016258 | Four additional parameter bytes |
| 0xa6–0xae | FUN_80012eac | Nine character attributes copied from 0x80064c88 + character * 9 |
| 0xaf–0xb0 | FUN_80012eac | Two character attributes copied from 0x80064d00 + character * 2 |

Character names are not yet mapped confidently to all 13 numeric IDs.

## Scenario tables: verified values, partially identified semantics

`FUN_80012454` selects a 12-byte campaign-stage entry at `0x80058758 + campaign*0x84 + stage*12`. A campaign has at most 11 entries, with 0xff terminators (`FUN_8001266c`). Its first byte selects an 84-byte scenario at `0x80057798 + scenario*0x54`.

`FUN_80012eac` copies scenario data into live game state:

- Byte 0 to `0x80070cd0`.
- Byte 1 to `0x80070cd1` via `FUN_80013464` (accepted <31).
- Byte 2 selects the pair of shuffled 64-byte decks via `FUN_80015610`.
- Words at +4, +8, +12 become numeric configuration. +4 also becomes every player's starting resource.
- Twelve bytes at +34 become `0x80070cf6..0x80070d01`; their values resemble a weighted movement/roulette distribution, but this semantic still needs overlay verification.
- Four player configurations at +46, each five bytes: character plus four IDs.

Examples:

| Scenario index | First 3 bytes | Resource/config words | Twelve-value distribution | Characters |
|---:|---|---|---|---|
| 0 | 0,10,0 | 1500,3000,400 | 1,2,2,3,3,3,4,4,4,5,5,6 | 12,10 (then absent) |
| 1 | 1,11,1 | 2000,4000,400 | 1,2,3,3,4,4,5,5,6,6,7,8 | 0,9,2 |
| 2 | 2,12,2 | 2000,4000,400 | 1,2,3,3,4,4,5,5,6,6,7,8 | 0,1,2,3 |
| 4 | 3,20,3 | 2500,5000,400 | 1,2,3,3,4,4,5,5,6,6,7,8 | 0,3,4,6 |
| 5 | 4,14,4 | 2500,5000,400 | 1,2,3,4,4,5,5,6,6,7,8,9 | 0,5,7 |

## Exact strings in the board overlay

The board overlay contains the following action/state names near its start: CHECK, CLOSING, ESTATE, CHAKRA_DOWN, LVUP_ESTATE, FUUIN_GET, KIBAKUFU, NINJYUTU, EBISU, KEMURI, MAKIBISI, FINISH, TAZUNA, INARI, SIKAMARU, CYOUJI, BREAK, FUUIN_USE, FUUIN_FALSE, DAIKAKU, TENPEN, BUNDORI, KYUKYOKU, KUNAI, SYURIKEN, F_SYURIKEN, D_SYURIKEN, KUMO_ROLL.

This supports estate ownership/upgrading, chakra, seals, ninja tools, and board/battle phases. It does **not** by itself establish costs, damage equations, movement rules, map topology, or win conditions. Those must be decoded from overlay code or verified against gameplay before claiming fidelity.

## Rules verified from original instruction textures

These translations are based on the actual extracted Japanese tutorial images, not recollection of the game.

| Texture filename (under extracted/textures) | Verified rule |
|---|---|
| tim_01971000.png | Reach the stage's clear-chakra requirement before rivals. |
| tim_0197a000.png | Select roulette, stop it, move by the displayed number. Pass all water crystals, then return to the barrier source to receive bonus chakra. |
| tim_01983000.png | On vacant land, create a barrier. Opponents stopping on it lose chakra equal to its value. More valuable barriers grant larger bonus chakra. |
| tim_0198c000.png | Ninjutsu attacks or hinders rivals and consumes skill points. Skill points arrive with bonus chakra. |
| tim_01995000.png | Attack a rival's barrier; reducing durability to zero makes it yours. Attacking consumes chakra. |
| tim_0199e000.png | Defend your barrier with defensive techniques; a no-chakra option exists. |
| tim_019a7000.png | Attack total = technique attack + roulette. Defense total = barrier durability + technique defense + roulette. The higher total wins. Tie behavior is not stated here. |
| tim_019b0000.png | The seal scroll is a powerful comeback item. It is awarded to the last player to receive a first bonus or the first player to receive a second bonus. |
| tim_019b9000.png | The scroll can be stolen by landing on the holder's location or capturing the holder's barrier. |
| tim_019c2000.png | Chakra increases from bonuses and taking it from rivals; decreases when placing barriers and using battle techniques. |
| tim_019cb000.png | Landing on a barrier transfers chakra to its owner. Higher levels take more chakra. |
| tim_019d4000.png | The source is the starting location. Return after passing all crystals to receive bonus; winning occurs here when clear chakra is reached. |
| tim_019dd000.png | Pass all water crystals for a bonus. Landing on a crystal also lets you upgrade one of your own barriers. |
| tim_019e6000.png | Passing or stopping on a card shrine awards a chance card; some effects can hurt the player. |
| tim_019ef000.png | Durability zero destroys a barrier. Upgrading increases durability. |
| tim_019f8000.png | A character's specialty technique costs less chakra. |
| tim_01a01000.png | Specialty defense nullifies the power of the opponent's specialty technique unconditionally. |
| tim_01a0a000.png | A separate chance-card race mode moves yourself or rivals by the card number; first to goal or first to reduce rival chakra to zero wins. |
| tim_01a13000.png | In that mode, draw or rest freely; drawing costs 100 chakra, resting restores 100. Goal-tile effects can be useful. |
| tim_01a1c000.png | Team battle has four characters split into two teams with shared chakra and shared barriers. |
| tim_01a25000.png | Either teammate touching a crystal counts for both. |
| tim_01a2e000.png | Team bonus uses both teammates' barriers; the team's bonus is better, but returning to source ends the turn. |
| tim_01a37000.png | Cannot attack teammate barriers or use ranged tools such as kunai against them. Either teammate reaching the goal wins for the team. |
| tim_01a40000.png | In the card mode, drawing a fresh hand after cards run out costs 100 chakra; resting restores 100. |

## Exact map topology and estate economy: recovered

New reproducible extractor: `python3 research/extract_gameplay.py --disc-dir extracted/disc`.

- `research/maps.json`: all 18 maps, 643 total tile records, exact positions and adjacency.
- `research/scenarios.json`: ten first-campaign stages with starting chakra, target chakra, base bonus, roulette values, and character configuration.
- `decompiled/BOARD.c`: additional board overlay decompilation (868 functions including synthetic GTE entries); this was absent from the original executable-only export.

`FUN_800f7adc` loads map resource `0x276 + mapID`. First byte is tile count; exactly `count * 30` bytes follow. Each 30-byte tile record:

| Byte offset | Format | Meaning |
|---:|---|---|
| 0 | u8 | Type: 0 source, 1 crystal, 2 chance card, 3 junction, 4 vacant estate; additional values exist on special maps |
| 1..4 | 4×u8 | Neighbor tile IDs; 255 means absent |
| 5..6 | 2×u8 | Unknown metadata |
| 7 | u16 LE | Barrier purchase cost |
| 9..18 | 5×u16 LE | Rent values for levels 1–5 |
| 19 | u16 LE | Cost of each level upgrade |
| 21,23 | 2×u16 LE | Other economy values, semantics not yet confirmed |
| 25,27 | 2×s16 LE | Pixel x,y position on the full map background |
| 29 | u8 | Event/metadata ID; 255 commonly means none (name provisional) |

Map 0 is a simple 22-tile loop. Its source is tile 0, crystals are tiles 11 and 17, chance tiles are 5 and 18. Map 1 has 33 tiles and a branch. Map 2 has 33 tiles and two connected loops. These are now exact layouts, not reconstructed approximations.

Runtime tile records have stride `0x124` at `DAT_8013ea84`. Word +0x20 packs owner in bits 12–15, zero-based level in bits 8–11, durability in bits 4–7, and status in bits 0–3. Purchase (`FUN_800f0c10`) subtracts the tile's purchase cost and sets initial durability to 2. Upgrade (state machine at `0x800d4468`) charges the tile's fixed upgrade cost and increments both level and current durability by one. Maximum level is 5; full durability is level+1. An already damaged barrier does not necessarily heal completely upon upgrade.

`FUN_800b770c` computes rent from the level's table entry with same-owner consecutive-estate multipliers: 1.0×,1.2×,1.5×,1.8×,2.0× for chain extras 0,1,2,3,4. Integer division rounds down. `FUN_800be0e4` identifies these chains by walking the first neighbor through up to five same-owner barrier tiles.

`FUN_800bdc4c` computes a bonus exactly as:

```text
base bonus + floor(sum of the player's current barrier rents / 2)
```

EXE getter `0x80012a70` reads `0x80070c84`, confirming the scenario's +8 word as clear-chakra target. Getter `0x80012a8c` reads `0x80070c88`, confirming +12 as base bonus. Map getter `0x800129e4` reads `0x80070cd0`, confirming scenario byte 0 as map ID.

A further rule observed in the source-return update: owned damaged barriers periodically repair by one durability (every second bonus-counter tick in the examined code), capped at level+1. Its exact timing should be verified before implementing as a faithful mechanic.

## Background texture layout

`FUN_800f64b0` loads background resource `0x158 + mapID`. It is a custom TIM-like format:

- Signature u32 0x10.
- Byte +6 = number of 8-pixel tile columns; byte +7 = tile rows.
- Standard 256-color CLUT block, then a nonstandard pixel block.
- The full canvas is `tileColumns*8` by `tileRows*8`.
- 8×8 tiles are stored **column-major**, with pixels inside each tile row-major.
- Therefore `sourceIndex = ((x // 8) * tileRows + y // 8) * 64 + (y % 8) * 8 + x % 8`.

This is visible in the loader's upload address expression `(tileX * tileRows + tileY) * 64`; the ordinary TIM decoder will produce scrambled backgrounds.

## Reproducing BOARD decompilation

1. Extract resource 1 from DATA.BIN index: offset `0x10bb000`, size `0x919bc`.
2. Import as raw binary, processor `PSX:LE:32:default`, base address `0x800ad450`.
3. Mark/disassemble functions at `0x800b1e88`, `0x800b50ac`, `0x800b5020`, `0x800b2a58`, `0x8011c028`, `0x8011ce2c`, and `0x8011cddc` before analysis.
4. Analyze and export functions through Ghidra DecompInterface.

Session reproduction scripts live in `/tmp/naruto_re/ghidra_scripts/BoardEntry.java` and `ExportBoard.java`, project `/tmp/naruto_re/board_proj/BOARD`. `BOARD.c` retains unresolved external calls as `func_0x800xxxxx`: importing the main executable and creating additional missing functions is needed for a complete combined program. Existing decompiler types/parameter counts should be cross-checked against MIPS, especially at functions whose external signatures are unknown.

## Technique and battle rules recovered

`research/techniques.json` contains all 13 character tables, extracted reproducibly by `research/extract_gameplay.py`. The table starts at EXE RAM `0x8005693c`, with 10 records per character, 28 bytes per record, and character stride `0x118`. Each record has i32 ID at +0, animation ID at +4, s16 cost at +8, alternate cost at +10, power at +12, alternate power at +14, and flags at +16. The attack selector (`0x80015d24`) takes flag 1, and defense selector (`0x80015e84`) takes flag 2, excluding fallback/special records with flag 0x20. Specialty is flag 4; on defensive techniques flag 8 selects counter-specialty instead of counter-non-specialty. These two helpers are preserved in `decompiled/COMBAT_HELPERS.c`.

For the four starter character IDs 0–3, normal attack choices are `(cost, power)`:

| Character ID | Attack choices | Defense choices |
|---:|---|---|
| 0 | (50,2), (150,3), (50,4 specialty), (100,5 specialty) | (100,1), (250,3), (150,1 counter-specialty), (0,0) |
| 1 | (80,2), (170,3), (450,4), (150,5 specialty) | (150,1), (200,2), (180,1 counter-specialty), (0,0) |
| 2 | (50,2), (20,2 specialty), (150,3), (30,3 specialty) | (100,1), (160,3), (250,3 counter-specialty), (0,0) |
| 3 | (50,2), (150,3), (50,4 specialty), (600,6) | (100,1), (220,3), (120,1 counter-specialty), (0,0) |

These costs are the final ordinary costs; do not apply an additional specialty discount. Technique names have not been decoded. `FUN_8011ca60`, preserved in `decompiled/COMBAT_SETUP.c`, applies temporary battle statuses: side flag 2 halves both costs, flag 4 zeroes costs, and flags 8/0x10/0x20 add 1/2/3 to power. It disables techniques costing more than the side's chakra.

`FUN_8011f4d8` resolves combat exactly as:

```text
raw damage = attack technique power + attack roulette
             - defense technique power - defense roulette
if defensive counter matches attack's specialty flag: raw damage = 0
damage = clamp(raw damage, 0, current barrier HP)
new barrier HP = current barrier HP - damage
attacker wins iff new barrier HP == 0
```

Both sides pay their chosen technique cost, except a free-defense status. Barrier HP is not also subtracted before computing damage. Equal attack and technique-defense totals cause zero damage. An attack total equal to defense-technique + roulette + current HP destroys the barrier. Counter-specialty nullifies a specialty attack regardless of roulette outcomes.

On a successful **local** attack, the return-from-battle path in `FUN_800b2a58` retains the barrier's original level, changes its owner to the attacker, and restores full HP to level+1. The packed state is masked with 0x0f0f to retain the level/status, then receives the new owner and full durability. Remote attacks instead turn a destroyed barrier into vacant land.

Rent is charged **after** the decision/battle, not before it. In `FUN_800f1290` case 6, attacking enters battle while declining enters board state 0x18. That state dispatches to `FUN_800dc2e0`; case 1 charges rent only if the current tile remains a rival-owned barrier. Therefore a successful capture avoids rent, while a failed attack costs both the selected technique cost and subsequent rent. The pending chakra deltas transfer the full rent to its owner.

`FUN_8011f2fc` builds 12 battle roulette wedges. Ordinary positive attack wedges are random 1–3; ordinary positive defense wedges are random 1–4. Overlay table `0x800af98c` has 13 rows of twelve 0/1 multipliers; rows 0 and 1 each have eleven zeroes and one 1, row 2 has ten zeroes and two 1s, through row 12 with all 1s. The row is `max(0, 12 - distance)` for normal techniques. Thus at distance d there are `max(1,12-d)` positive wedges and the rest are zero. `FUN_800b94e8` sets input field +16 to board-path-distance ×10; local attacks use zero, and defenders use the path distance between their token and the attacked barrier. `FUN_800b83fc` computes that board path; it skips type-6 transit nodes. A browser shortest-path approximation is not necessarily identical to its branch heuristic. Flag-0x10 special techniques instead use alternate power as the random range, power as an additive base, and subtract another 3 from the table row.

## Direction and crystal timing evidence

Player runtime stride is `0x90`; +0x1f is current tile, +0x24 persistent direction/neighbor selector, +0x25 previous tile. Normal movement retains its direction between turns. `FUN_800ef9a4` offers valid junction neighbors while excluding the previous tile unless the explicit per-player override at board+0x603 is set. `FUN_800edd68` clears direction to 255 when a player stops on the source with zero movement remaining, enabling a fresh direction choice next turn. It does not clear direction merely for passing the source. Special status/card code can also clear or reverse direction.

`FUN_800eb434` awards uncollected crystals on entering the tile even with movement remaining, and then resumes movement. The barrier-upgrade interaction is entered only when remaining movement is zero. Type-6 records are transit nodes omitted from movement counters; type-3 junctions count as steps and allow a branch choice when movement remains. The browser implementation must distinguish the transit nodes from ordinary event tiles if it supports maps containing them.

Passing the source with all crystals can award the bonus and win: `FUN_800edd68` case 0 checks crystal completeness regardless of remaining movement, and case 3 checks the chakra target after the bonus and sets remaining movement to zero on victory. Therefore landing exactly on the source is not required. Stopping on the source additionally allows a direction reset; passing it does not.
