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

export function directionLabel(snapshot, option) {
  if (!option.id.startsWith("move:")) return option.label;
  const player = snapshot.players.find(
    (p) => p.seat === snapshot.presentation.actorSeat,
  );
  const from = snapshot.tiles[player.position],
    to = snapshot.tiles[option.tileId];
  const dx = to.x - from.x,
    dy = to.y - from.y;
  return Math.abs(dx) > Math.abs(dy)
    ? dx > 0
      ? "→ Kanan"
      : "← Kiri"
    : dy > 0
      ? "↓ Bawah"
      : "↑ Atas";
}

export function wheelAngle(snapshot, elapsedMS) {
  const wheel = snapshot.roulette;
  const ticks =
    Math.max(0, snapshot.serverTick - wheel.startedAtTick) +
    Math.floor((Math.max(0, elapsedMS) * 60) / 1000);
  return (wheel.angle + ticks * 180) & 4095;
}
