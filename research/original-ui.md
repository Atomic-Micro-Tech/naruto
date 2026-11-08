# Original UI and sprite recovery

This is offline asset reconstruction from the user's disc, original executable tables, and overlays. It does not execute an emulated PS1. The generated assets live in `extracted/original-ui/`. No browser-game source is changed by these scripts.

## Reproduction

Run with the repository Pillow environment:

```
.venv/bin/python scripts/extract_original_ui.py
.venv/bin/python scripts/extract_character_config.py
.venv/bin/python scripts/extract_board_ui.py
.venv/bin/python scripts/extract_original_font.py
.venv/bin/python scripts/extract_common_ui.py
```

Inputs are `extracted/disc/DATA.BIN`, `extracted/disc/SLPS_035.53`, `extracted/manifest.json`, and previously decoded standalone TIM PNGs for character strips. No network lookup is needed. Resource offsets come from the verified executable resource index.

## Title

`MENU.c` is the decompilation of DATA resource0 loaded at RAM0x800ad450. `FUN_800ad748` explicitly initializes **640×480**. `FUN_800af218` loads resource59: texture words at VRAM640,0 and CLUT at0,508. The first texture TIM is an atlas of packed4/8bit indices, not a directly displayable16bit image.

`title-scene.json` describes36 original sprite layers: tiled background,4 settled character-art segments,3 copyright segments,16 PRESS START glyphs,5 logo segments. `title_base.png`, `title_press_start.png`, and `title_complete.png` are composited directly from those tables. Logo texture-page entries have stride8; the other title tables use stride4. PRESS START uses a centered pivot; the other groups use top-left positioning. Its settled blink has90-frame period with46 visible frames.

`title-menu-scene.json` describes the original popup and cursor. `title_menu_2_options.png` / `title_menu_3_options.png` show the settled versions. Textures are はじめから (New), ロード (Load), コンティニュー (Continue). Original window is x64,y240,width180,height=`count*32+48`, blueRGB0,0,128, white border. Labels start96,264 spaced32. Cursor is original kunai texture, center-state top-left48,264, with horizontal sine motion.

Reference comparison against `research/reference/title-source.png`: the screenshot's visible image corresponds to the title canvas cropped **y16..464 (640×448)** then scaled to4:3. A crop search against the supplied screenshot chose16/464 over neighboring crops. Geometry and image content match visually. The source PNGs retain the full640×480 logical canvas. Exact color modulation, interlace, transition frames, and GPU raster edge rules have not been pixel-diff verified.

## Main menu

`mainmenu-scene.json` contains original upload destinations,22 sprites (8 illustrated icon/label pairs and6 headers), default carousel positions, and source function names. `FUN_800b4084` uses a rotating carousel; the original default option order is `[0,4,2,3,1]`. Unlocks insert6,5,7 in that order before2. Menu0 uses resource44 for the Hokage Rock background,54 for headers,49 for carousel artwork,48 for supporting UI.

| ID | Original label | Meaning | Main-menu subscene route |
|---:|---|---|---|
|0|ストーリーモード|Story Mode|Campaign checks, then1/2|
|1|パーティーモード|Party Mode|4|
|2|ビンゴブック|Bingo Book|24|
|3|お宝BOX|Treasure Box|20|
|4|せってい|Settings|22|
|5|チームバトル|Team Battle|4 with team flag|
|6|ミニゲーム|Minigame|15|
|7|忍術指南書|Ninjutsu Guidebook|25|

`mainmenu_carousel_core.png` is deliberately labeled a **core preview**: background, carousel, selected label, header text. It lacks the original help bubble, help text, header-strip backing, and control hints. Those missing decorations must not be interpreted as absent in the original game. Main-menu help message IDs599..635 are recovered in `font/font.json`; original arrows/control-label graphics are in `common/`.

## All13 characters

`characters.json` maps numericIDs0..12 to original art and **menu** animation strips. `FUN_800b1ccc` uses resource773's nested package member indexed by characterID. Visual identification gives Naruto, Sasuke, Sakura, Kakashi, Zabuza, Haku, Demon Brothers, Zori&Waraji, Iruka, Konohamaru, Mizuki, Third Hokage, and Naruto with goggles.

The raw TIMs are **not uniform4-frame strips**. Each original frame has its own rectangle. Nested descriptor package branch0 supplies `(frame,duration,offsetX,offsetY)` records; branch1 supplies20-byte sprite definitions after a4-byte header. `FUN_800227f0` confirms original positional bytes are biased by0x7f. Normalized atlases `character_00_menu.png`..`character_12_menu.png` retain a shared per-character anchor without clipping variable-width frames. JSON includes original rectangles, anchor, duration records, and byte offsets. These animations are menu poses; board movement poses are different resources and are not claimed recovered here.

`common/character_00_face.png`..12 are exact32×32 board HUD portraits; corresponding name strips are original Japanese text. They come from resource759+characterID, members0/1, verified by `FUN_800ffbc0` and `FUN_800ffa30`.

## Board tiles and barriers

`board/assets.json` and37 PNGs decode resource38 using its three original upload rectangles from0x800aedd0. Sources:

- `FUN_800f6ec4`: source48×48, vacant32×32, chance32×32, special tiles, damage indicator, collected-crystal glow.
- `FUN_800f6988`: four crystal palettes/sprites and overlay sprites from tables0x800aeb9c onward.
- `FUN_800f6db0`:8×8 route-link dot.
- `FUN_800bb004`: all20 owner/level barrier combinations. Barriers are32×40 with anchor16,24. Level1..5 chooses u0/128/160/192/224,v216; owner0..3 selects CLUT48,245+owner.
- `FUN_800fec20`: type21 uses the original vacant tile. Other dynamic special types9..20 depend on additional loaded texture pages; they are not exported as blank or guessed assets.

Default world-to-screen uses tile world position minus camera. Zoom updates in `FUN_800ff00c` transform around160,120. Layer ordering and semi-transparency attributes are retained in JSON where recovered; PNG alpha alone does not reproduce every PS1 blend operation.

## Font, messages, and cards

`font/messages.json` contains all2410 original TXT2 glyph streams from resource775(0x307). Count is u16+4, records `(offsetWords,length)` are4bytes at+8, stream starts+8+count*4. Font pixels are resource477(0x1dd), uploaded960,0; its CLUT is repacked to960,252 with64colors×2rows by `FUN_8001bc04`. Rendering formulas come from `FUN_8001bce8`. Verified12×12 glyphs advance13 pixels; page/CLUT selection preserves both packed glyph banks.

`font/glyphs_12_color0..3.png` contains the original glyphs with four original text palettes.16pixel formula atlases are also included, but text use with resource477 is only visually verified for12pixel mode. `font/font.json` lists dimensions and rendering metadata.

52 card-message PNGs239..290 and37 menu-message PNGs599..635 are rendered from original glyphs. These are static previews: dynamic numeric/message fields and controller icons retain transparent positions with control metadata. Runtime should render the original stream with its current substitution values.0xb000 is an end/control marker, not a glyph. The preview does not invent missing values.

**Card art resource425+cardID is verified**, not guessed: `FUN_80100698` loads `bVar1+0x1a9`. `font/cards.json` and `card_00.png`..51 contain all52 original card illustrations with corresponding messageIDs239+id and byte provenance.

## Common HUD and roulette

`common/assets.json` has174 original rectangles from resource57 loaded320,256 with CLUT0,510 (`FUN_8001a57c`). It includes13 roulette numbers,4 roulette quadrants, red pointer, center symbols, spoke/rim textures,4 arrow directions, control labels, and four styles/three palettes of numerical digits.

`FUN_8001fd0c` renders roulette from textured quads. JSON `rouletteGeometry` stores all original vertices, quad indices, rotation-unit4096 convention, the575/512 horizontal scale, angle offsets, and reverse number submission order. It is more accurate to transform these original parts than to draw a new pie chart.

`roulette_base_angle0.png`, `roulette_numbers_scenario0_angle0.png`, and `roulette_scenario0_angle0.png` are offline composites of those original quads. They use the original first scenario's12 values. The compositor uses affine triangles and original textures; exact PS1 triangle-edge rules and per-wedge modulation remain unverified. The source parts/geometry should remain the authoritative runtime inputs.

## Decompilation support

`scripts/ghidra/MenuEntry.java`, `MenuCallbacks.java`, `ExportMenu.java` produce `decompiled/MENU.c`. The callbacks script discovers92 additional original function-pointer targets. `UiHelpers.java` / `UiDraw.java` produce `UI_HELPERS.c` / `UI_DRAW.c` from the main executable project. Useful command pattern:

```
tools/ghidra_12.2_PUBLIC/support/analyzeHeadless /tmp/naruto_re/menu_proj MENU -import /tmp/naruto_re/menu_overlay.bin -loader BinaryLoader -loader-baseAddr 0x800ad450 -processor PSX:LE:32:default -scriptPath /Users/shukino/RE/naruto/scripts/ghidra -preScript MenuEntry.java -postScript ExportMenu.java /Users/shukino/RE/naruto/decompiled/MENU.c
```

The Ghidra project remains a research artifact. Delivering source-backed assets and scene definitions does not establish a complete1:1 rewrite of all game states.

## Board character animations

`scripts/extract_board_characters.py` exports all 13 characters × 26 animations (978 original frames) to `extracted/original-ui/board-characters`. `characters.json` includes normalized atlas dimensions, anchors, original sprite descriptors, per-animation sequence records, and source offsets. Static atlas resource is `681 + characterID`; animation package is `694 + characterID`. Static pages occupy VRAM (320,0) and (384,0). Animations 22–25 replace the second page at (384,144) with their own dynamic TIM, according to the mapping at BOARD address `0x8013a18c`.

`FUN_800bee54` maps directional flags right=1, left=2, down=4, up=8 to walk animations 12, 11, 10, 9 respectively. Animation 22 is the recovered idle pose. The menu character strips are separate animations and should not be used for board walking. All four walk directions have identity transforms in their original frame definitions. Other animation metadata retains original rotation and scale, which the normalized PNG sheets do not bake in.

`FUN_800227f0` interprets the sprite definition's biased x/y bytes by subtracting 127. Each sequence record is four signed shorts `(frame, duration, dx, dy)`, but duration uses only the low byte. `FUN_80022aa8` increments its timer by 16 per update; BOARD uses speed 8, so the threshold is `duration * 8`. It advances when `counter > threshold`, then takes the remainder against `max(threshold,1)`. The loop flag is `0x8000`. This strict comparison matters for frame timing.

## Exact top HUD layout

`scripts/extract_hud_layout.py` exports `hud/layout.json`, 17 original panel/crystal/scroll/effect sprites, and `two_players_settled.png`. `FUN_80104b94` places a player's origin at `(160 - playerCount * 36 + playerIndex * 72, 16)`. Panels enter from y=-48 over 8 frames, delayed by 2 frames per player index.

`FUN_801052e8` draws the owner-colored panel at origin+(8,0), face at +(0,0), name/team strip at +(0,32), chakra number at +(32,16), crystal indicators at +(32+8*i,0), and owned scroll at +(56,32). Chakra uses five right-aligned 8-pixel columns without leading zeroes. The normal palette is 0; negative/loss display uses palette 2 from the single-number renderer's table `0x80065500` (the paired-number helper has one different palette entry). Team labels alternate with names in a 180-frame cycle. JSON retains semi-transparency attributes and source UV/CLUT tables. The preview does not bake PS1 blending, acquisition effects, or brightness pulses.

## Menu help bubble

`scripts/extract_menu_help.py` exports the original resource 49 bubble border, pointer, edge quads, and eight source-glyph message previews. `menu-help/scene.json` records each source rectangle and destination extent from `FUN_800b1200`. Settled bubble origin is (112,160); text begins at (116,164). Since the pointer extends 14 pixels left, complete `help_0.png` through `help_7.png` should be placed at (98,160). `FUN_800b1080` selects 12-pixel font mode and color 0, giving original black text on the light bubble. Text advances and line breaks use 13 pixels. The offline edge resize uses nearest sampling; precise PS1 quad edge sampling and dynamic text timing remain unverified.

## Native CARD-RACE, profile progression and Treasure Box

`research/race-rules.mjs` ports map16/17 movement, cards, tile effects, draw/rest/end conditions and source AI policies. See `research/race-rules.md`; `race/assets.json` contains the original13 tile effects from resource39.

`research/progression.mjs` ports the original160 unlock records, all28 predicate families and Bingo Book navigation. See `research/progression.md`. `bingo/scene.json` contains14 original640×480 profile pages, original tabs, title, tiled background, animated pointer geometry and page controls. Fresh save profiles are all locked, as the original initializer specifies.

`research/treasure.mjs` ports the56-item viewer, exact collection acquisition guard and reversible background easter egg. See `research/treasure.md`. `treasure/scene.json` contains all56 item images/icons,112 original name/description images, glyph streams, source map locations and XA indices1312–1367. Collection requires the source story-mode human upgrade event with the actor's current tile at display level5; viewing does not award items.
