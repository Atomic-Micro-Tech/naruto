// Only advance actions with no player decision. Every step still goes through Go.
export function automaticAction(snapshot) {
  if (!snapshot || snapshot.status !== "playing" || snapshot.roulette)
    return null;
  const self = snapshot.players.find((p) => p.seat === snapshot.self.seat);
  if (
    self?.controller.controllerKind !== "human" ||
    snapshot.presentation?.actorSeat !== self.seat
  )
    return null;
  const options = snapshot.allowedActions
    .flatMap((a) => a.options)
    .filter((o) => o.enabled);
  if (options.length !== 1) return null;
  const option = options[0];
  if (snapshot.presentation.phase === "move" && option.id.startsWith("move:"))
    return option.id;
  if (snapshot.presentation.phase === "end" && option.id === "end")
    return option.id;
  return null;
}

export function directionIndicator(snapshot, option) {
  if (!option.id.startsWith("move:"))
    return { label: option.label, texture: "arrow_1" };
  const player = snapshot.players.find(
    (p) => p.seat === snapshot.presentation.actorSeat,
  );
  const from = snapshot.tiles[player.position],
    to = snapshot.tiles[option.tileId];
  const dx = to.x - from.x,
    dy = to.y - from.y;
  return Math.abs(dx) > Math.abs(dy)
    ? dx > 0
      ? { label: "→ Kanan", texture: "arrow_3" }
      : { label: "← Kiri", texture: "arrow_2" }
    : dy > 0
      ? { label: "↓ Bawah", texture: "arrow_1" }
      : { label: "↑ Atas", texture: "arrow_0" };
}

export function directionLabel(snapshot, option) {
  return directionIndicator(snapshot, option).label;
}

// Video: ~15.82 degrees per 30 fps frame (180/4096 turns). The transport
// clock is 60 Hz; it is not the presentation update rate of this recording.
export const ROULETTE_FRAME_MS = 1000 / 30;
export const ROULETTE_ENTRY_MS = 10 * ROULETTE_FRAME_MS;
const ROULETTE_SPEED = 180 / ROULETTE_FRAME_MS;

export function wheelAngle(snapshot, elapsedMS) {
  const wheel = snapshot.roulette;
  const elapsed = Math.max(0, snapshot.serverTick - wheel.startedAtTick) * 1000 / 60 +
    Math.max(0, elapsedMS);
  return (wheel.angle + elapsed * ROULETTE_SPEED) % 4096;
}

// Original wheel keeps its speed until the second impact, then freezes.
// Wait for the next matching server-result sector with room for the native
// 3/5/7-update impacts. Network reconciliation may delay the first launch;
// it must not add a prolonged slow-down or change the authoritative result.
// BOARD 8010b4a8: 4096 -> 128 in steps of 128, 60 updates hold, 8 exit.
// UI_DRAW 8001fd0c keeps only the selected sector at full intensity.
export function rouletteStopPlan(angle, faces, result) {
  const speed = ROULETTE_SPEED,
    minimumDistance = speed * 5 * ROULETTE_FRAME_MS;
  const candidates = [];
  faces.forEach((face, index) => {
    if (result !== null && face !== result) return;
    const target = index * 341 + 4;
    const forward = (((target - angle) % 4096) + 4096) % 4096;
    for (const distance of [forward, forward + 4096])
      if (distance >= minimumDistance)
        candidates.push({ target: angle + distance, distance, index });
  });
  if (!candidates.length)
    throw new Error("Roulette result is not present on this wheel");
  candidates.sort((a, b) => a.distance - b.distance);
  const chosen = candidates[0],
    duration = chosen.distance / speed;
  return {
    angle,
    ...chosen,
    duration,
    flight: 3 * ROULETTE_FRAME_MS,
    impacts: [duration - 2 * ROULETTE_FRAME_MS, duration, duration + 2 * ROULETTE_FRAME_MS],
    fadeStart: duration + 2 * ROULETTE_FRAME_MS,
    fadeDuration: 31 * ROULETTE_FRAME_MS,
    exitAt: duration + 62 * ROULETTE_FRAME_MS,
    endAt: duration + 70 * ROULETTE_FRAME_MS,
  };
}

export function rouletteStopFrame(plan, elapsed) {
  const t = Math.max(0, Math.min(1, elapsed / plan.duration));
  let jolt = 0,
    flash = 0;
  for (const impact of plan.impacts) {
    const age = elapsed - impact;
    if (age >= 0 && age < 140) {
      jolt += Math.sin(age / 14) * Math.exp(-age / 38) * 2;
      flash = Math.max(flash, 1 - age / 90);
    }
  }
  return {
    angle: plan.angle + plan.distance * t,
    frozen: t === 1,
    // Never hide the other digits at freeze: fade them after the last impact.
    // Preserve the native 128/4096 floor (barely visible), with smooth subframes.
    otherNumbersOpacity:
      1 -
      (31 / 32) *
        Math.max(0, Math.min(1, (elapsed - plan.fadeStart) / plan.fadeDuration)),
    jolt,
    flash: Math.max(0, flash),
    exit: Math.max(
      0,
      Math.min(1, (elapsed - plan.exitAt) / (plan.endAt - plan.exitAt)),
    ),
  };
}
