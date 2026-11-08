# Native Treasure Box viewer and acquisition

`treasure.mjs` implements original MENU Treasure Box selection and detail controls. `treasure-data.mjs` and `extracted/original-ui/treasure/scene.json` contain56 original entries, their source resource IDs, original name/description glyph streams, and map locations. `scripts/extract_treasure.py` reproduces56 atlas icons,56 detail images,112 text images, title/slot graphics, and the alternate menu background. No placeholder art or guessed collection awards are included.

## Acquisition

The only recovered collection setter call is BOARD `FUN_800e5e0c`, case5, after the upgrade presentation. Call `awardTreasureAfterUpgrade(progress, { gameMode, actorFlags, currentTile })` only at that event. It awards `currentTile.eventId` iff:

- `gameMode===0`: main getter `80012904` reads `80070730`; MENU story route sets this to0, versus/team/race routes set1.
- Actor flags do not contain0x100 (CPU).
- Actor's **current tile** has raw barrier level4, i.e. displayed level5. The module uses display levels1–5, matching `faithful-rules.mjs`.
- Its treasure ID is0–55 and its collection flag is not already set.

The source checks the actor's current tile, not the upgrade-selected tile. Preserve this distinction for remote upgrades. The helper fails closed if any required context is absent. It returns `{progress, awarded, event}` without changing the input. Viewing an item never grants a flag.

BOARD `FUN_800f7adc` copies raw map record byte29 into tile+0xc; the prior `maps.json` name `eventId` refers to this treasure ID. Maps0–6 and9 collectively contain all56 items, seven each. Map15 repeats map5's items35–41. Maps10–14 contain IDs57–62, which the original collection setter `80016cf8` rejects. `treasureData.locations` preserves every valid map/tile/treasure mapping and its exact resource byte offset.

## Viewer behavior and layout

`createTreasureState`, `stepTreasure`, `selectedTreasure`, `treasureItems` port `FUN_800c08b8`, `FUN_800c0e44`, and `FUN_800c0a5c`. The grid has7 columns×8 rows, with3 rows visible, spacing36×42. Movement clamps at edges; it does not wrap. Vertical scrolling begins after the cursor reaches the first/last visible row. Maximum scroll is210px. Horizontal input takes priority if both axes are pressed. Locked items retain their empty slots and cannot open.

The source clips the list to(0,58,320,126), draws slot background at(32+36col,58+42row−scroll), and centers32×32 icons at(50+36col,78+42row−scroll). Selected collected icons scale from1 to1.125 over4 frames, then return over8 frames when deselected. Pointer is the common `80023778` sprite, anchored at cursor offsets(68,54). Source title is at(24,12), shadow+3. It displays collected count/56 and selected item number+1.

Opening a collected item displays its64×64 picture at(128,84), shadow+3, and name centered above it at(160,60). Names use message2354+ID. Descriptions use2194+ID through the shared original message engine/bubble. `advance` actions take a `dialogueStatus`: `typing` does nothing, `waiting-page` emits `advance-message`, `complete` closes. Back closes immediately. Text animation and panel transitions remain renderer responsibilities.

Resource60 supplies atlas/title/slots using upload rectangles atMENU0x800c6b64. Detail pictures normally use517+ID; the seventh column uses573+row. Those eight entries are labelled『お宝ボイス』, bonus voice, and display character portraits.

Each opening invokes main `FUN_800193f0(ID)`: its XA index is `byte(0x80064d56)*16+ID`, and that byte is82, so **XA index1312+ID**. The open event exposes this numeric index. Audio starts after original loading, and pauses/resumes through19254/192c8; exact CD-read timing is outside the native viewer state machine.

`FUN_800c1c7c` also has a reversible easter egg: viewing items0 and1 switches the menu background from resource44 to45. Viewing item2 restores44. This state persists while the menu overlay remains loaded; it is not a save unlock. `menu-theme` events expose the source resource, and `alternate_menu_background.png` contains resource45's original320×240 image.

## Verification and limits

`node --test research/treasure.test.mjs` passes5 tests covering picture/message mapping, grid boundaries/scrolling, locked items, detail events, the menu-background easter egg, all56 source locations, and acquisition guards. `contact.png` visually verifies original item art/names; `index-assets-preview.png` is an inspection-only atlas composition with a plain background, not a claimed full original screenshot. Original menu slides, popup animation and collection-reward presentation are not recreated by this isolated module. Original item voice playback requires the XA exports.
