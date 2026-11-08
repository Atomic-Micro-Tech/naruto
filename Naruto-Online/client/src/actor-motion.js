import { boardWalkPlan } from "./native-camera.js";

// FUN_800bee54: direction bits 8/4/2/1 select native animations 9/10/11/12.
// FUN_800c0a00 chooses the horizontal axis on an exact diagonal tie.
export function walkAnimation(from, to, directions) {
  const dx = to.x - from.x, dy = to.y - from.y;
  return directions[Math.abs(dx) >= Math.abs(dy)
    ? dx < 0 ? "left" : "right"
    : dy < 0 ? "up" : "down"];
}

export function createActorMotion(tile) {
  return { x: tile.x, y: tile.y, tile: tile.id, targetTile: tile.id, segments: [] };
}

// Queue only observed adjacent steps; never invent a route for a warp or a
// reconnect that skipped snapshots. Repeated snapshots preserve the current gait.
export function setActorDestination(motion, tile, tiles, directions, cpu = false) {
  if (tile.id === motion.targetTile) return;
  const origin = tiles.find(t => t.id === motion.targetTile);
  if (!origin?.neighbors.includes(tile.id)) {
    Object.assign(motion, createActorMotion(tile));
    return;
  }
  const plan = boardWalkPlan(origin, tile, { actorFlags: cpu ? 256 : 0 });
  motion.segments.push({ from: { x: origin.x, y: origin.y },
    to: { x: tile.x, y: tile.y }, tile: tile.id, elapsed: 0,
    duration: Math.max(100, plan.frames * 1000 / 60),
    animation: walkAnimation(origin, tile, directions) });
  motion.targetTile = tile.id;
}

export function remainingWalkMS(motion) {
  return motion.segments.reduce((total, segment) => total + segment.duration - segment.elapsed, 0);
}

export function stepActorMotion(motion, delta) {
  let animation = null;
  while (motion.segments.length) {
    const segment = motion.segments[0];
    const consumed = Math.min(Math.max(0, delta), segment.duration - segment.elapsed);
    segment.elapsed += consumed;
    delta -= consumed;
    animation = segment.animation;
    const t = segment.elapsed / segment.duration;
    motion.x = segment.from.x + (segment.to.x - segment.from.x) * t;
    motion.y = segment.from.y + (segment.to.y - segment.from.y) * t;
    if (t < 1) break;
    motion.tile = segment.tile;
    motion.segments.shift();
    if (delta <= 0) break;
  }
  return motion.segments[0]?.animation ?? animation;
}

// FUN_80022aa8: fixed updates, counter +=16, strict > duration*8, then modulo.
// The previous render-loop implementation could drop advances on slower devices.
export function advanceSpriteSequence(actor, sequence, delta) {
  actor.animationClock = (actor.animationClock ?? 0) + Math.min(Math.max(0, delta), 100);
  const tick = 1000 / 60;
  while (actor.animationClock + 1e-8 >= tick) {
    actor.animationClock -= tick;
    actor.counter += 16;
    const threshold = Math.max(1, sequence[actor.frame].duration * 8);
    if (actor.counter > threshold) {
      actor.counter %= threshold;
      actor.frame = (actor.frame + 1) % sequence.length;
    }
  }
}
