# Native BOARD camera and screen layout

`board-camera.mjs` ports the camera coordinate rules used by both ordinary boards and CARD-RACE. The rendering surface is **320×240 world pixels at normal zoom**. The384×784 race image is cropped through this viewport, not resized to fit. HUD elements remain in screen coordinates above it.

## Initial camera and drawing

`FUN_800f64b0(resource,0xffff,0xffff)` initializes the camera to `(mapWidth/2−160,mapHeight/2−120)`, stored as signed16.16. Ordinary640×480 maps begin at(160,120); both384×784 race maps begin at(32,272). This is the map-loading position, before the turn presentation recenters the actor. Explicit load positions and battle-return positions can instead be supplied through `createBoardCamera({width,height,x,y})`.

Use `boardImageDraw(camera)` for the native-size background destination and clip to(0,0,320,240). `worldToScreen(camera,point)` matches BOARD `800fa4c8`/`800ff00c`: subtract the integer high16 camera coordinates, then scale around(160,120). Camera fractional bits are not directly added to sprite positions. Default zoom is1. The original initializes the zoom double to1 at`FUN_800c28c0`, and event scripts can change it through800c3098/800c31f4. This module accepts explicit `zoom16`; event-script zoom dispatch/timing remains the story/event renderer's responsibility.

## Turn and selection recentering

`FUN_800faebc`, `800fad68` and `800fb1d0` compute per-axis frame counts:

```
framesX = trunc((targetWorldX − 160 − integerCameraX) / 6)
framesY = trunc((targetWorldY − 120 − integerCameraY) / 6)
```

Each `FUN_800faac8` update moves6 pixels on every axis with a nonzero remaining count, decrementing the counts first. The camera leaves a remainder below6px; it does not snap exactly to target. Pending chakra interpolation blocks pan updates. The main BOARD update calls this pan function before the walking update. Walking is blocked while the pan remains active.

```js
let camera = createBoardCamera({width:map.width,height:map.height});
camera = beginCameraPan(camera, currentTile);
// Once per original NTSC update, before walking:
camera = stepCameraPan(camera, {pendingChakra:false});
```

For the original player0 race starts, centered initialization followed by this pan settles at camera(2,542). Map16 tile18 at(160,663) takes45 updates and appears at(158,121). Map17 tile20 at(160,695) takes46 updates and appears at(158,153), because the bottom boundary blocks further camera movement. These values are verified by tests using the extracted map coordinates.

## Bounds and fixed-point details

`scrollBoardCamera` ports `FUN_800f7ed4` without PS1 VRAM tile-streaming side effects. Directions are right1,left2,down4,up8, with left/up taking priority if opposing bits are both supplied. A proposed negative coordinate is rejected; zero is allowed. A positive step is accepted only if `integerX+320 < mapWidth` and `integerY+240 < mapHeight`. The strict inequality and full-step rejection matter: the source does **not** clamp to the usual last pixel. Movement normally stops a few pixels short of an edge, depending on its fixed-point history.

Step magnitude whose high16 bits are<1 becomes0. A positive magnitude with integer part1–3 becomes exactly4 pixels. Larger fixed-point steps are unchanged. The return `blocked` is a direction bitmask. The pan function preserves the source's exact equality checks on this mask; simultaneous blocked axes do not shortcut both counters and instead consume their remaining frames.

## Following movement

`FUN_800c0a00` initializes each movement segment from tile coordinates. Human normal speed uses4 pixels/update; CPU flag0x100, status flag0x20, input bit0x40, or the forced-fast path uses6. Axis durations are `abs(trunc(delta/speed))`; both nonzero axes synchronize to the longer duration and divide their full16.16 displacement by that duration. `boardWalkPlan` returns these exact durations/velocities. The original snaps world coordinates to the destination tile when the segment finishes.

The follow test uses the actor's integer rendered world position against the current camera. Negative X motion activates at screenX≤160; positive X at screenX≥160. Y uses≤120 or≥120. The source checks this at segment initialization and after each position update. Once activated, its latch gates scrolling but does not mask individual axes: scrolling receives the complete active movement-direction mask. `beginCameraFollow` and `stepCameraFollow` preserve this behavior. Feed each new rendered actor position, signed fixed-point velocities and the active direction mask. The native+0x60a flag is represented by `disabled`.

```js
const plan = boardWalkPlan(fromTile,toTile,{actorFlags,statusFlags,inputMask});
camera = beginCameraFollow(camera,{position:actorPosition,velocity:plan.velocity});
// After advancing actorPosition for each original frame:
camera = stepCameraFollow(camera,{
  position:actorPosition, velocity:plan.velocity, direction:activeDirection,
});
```

Special jump arcs affect the actor's rendered Y in the original walking routine; this module does not invent those arcs. Supplying the actual rendered position preserves camera activation. Screen shake, free map cursor control, animation pauses and event camera overrides are separate callers of the same low-level scroll function and are not claimed as a complete frame-by-frame presentation port.

## Original HUD integration

Use `extracted/original-ui/hud/layout.json` and its17 original assets, plus face/name sprites in`common/assets.json`. `boardHudPositions(playerCount,index)` supplies source positions from80104b94/801052e8. Origin is `(160−36*playerCount+72*index,16)`: two-player race origins are(88,16),(160,16). Panel offset(8,0), face(0,0), name(0,32), chakra(32,16), scroll(56,32), crystals begin(32,0) with8px spacing. The HUD is not transformed by camera or zoom.

Panels enter from y−48 to16 over8 frames, staggered2frames per player. Chakra uses5 right-aligned8px glyph positions. Negative chakra uses source digit palette2. Race scenarios have zero crystals, so no crystal icons are drawn; their chakra numbers remain present. Original panel semi-transparency and glow modulation are recorded in the layout JSON and are not baked into PNG alpha.

## Verification

`node --test research/board-camera.test.mjs` passes8 tests covering map crop, strict edge rejection, minimum step size, fixed-point raster position, pan remainder/timing, real race start trajectories, walking center thresholds, synchronized movement duration, zoom center and fixed HUD positions. These are source-based expectations, not pixel-diff or full original-runtime trace results.
