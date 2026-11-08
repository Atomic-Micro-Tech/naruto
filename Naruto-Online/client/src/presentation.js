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

// One shared angle keeps numbers attached to their sectors, at 90% speed.
const ROULETTE_ANGLE_PER_TICK = 180 * 0.9;

export function wheelAngle(snapshot, elapsedMS) {
  const wheel = snapshot.roulette;
  const ticks =
    Math.max(0, snapshot.serverTick - wheel.startedAtTick) +
    (Math.max(0, elapsedMS) * 60) / 1000;
  return (wheel.angle + ticks * ROULETTE_ANGLE_PER_TICK) % 4096;
}

// Presentation interpolation only: the server supplies the result. Match the
// incoming angular velocity, decelerate to zero, then preserve the native
// three-impact spacing. Result fade/hold follows the 30 fps reference clip.
// BOARD 8010b4a8: 4096 -> 128 in steps of 128, 60 updates hold, 8 exit.
// UI_DRAW 8001fd0c keeps only the selected sector at full intensity.
export function rouletteStopPlan(angle, faces, result) {
  const speed = (ROULETTE_ANGLE_PER_TICK * 60) / 1000,
    preferredDistance = (speed * 280) / 2;
  const candidates = [];
  faces.forEach((face, index) => {
    if (result !== null && face !== result) return;
    const target = index * 341 + 4;
    const forward = (((target - angle) % 4096) + 4096) % 4096;
    for (const distance of [forward, forward + 4096])
      if (distance >= (speed * 90) / 2)
        candidates.push({ target: angle + distance, distance, index });
  });
  if (!candidates.length)
    throw new Error("Roulette result is not present on this wheel");
  candidates.sort(
    (a, b) =>
      Math.abs(a.distance - preferredDistance) -
      Math.abs(b.distance - preferredDistance),
  );
  const chosen = candidates[0],
    duration = (2 * chosen.distance) / speed;
  return {
    angle,
    ...chosen,
    duration,
    impacts: [duration - 1000 / 30, duration, duration + 1000 / 30],
    fadeStart: duration + 1000 / 30,
    fadeDuration: (31 * 1000) / 30,
    exitAt: duration + 1000 / 30 + 2000,
    endAt: duration + 1000 / 30 + 2000 + 8000 / 30,
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
    angle: plan.angle + plan.distance * (2 * t - t * t),
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
