// BOARD effect 1: resource 649. FUN_800227f0 sprite transforms; purchase
// commits its barrier at sequence step 39 (80022464 reads cursor +0x2e).
export function barrierSealTiles(previous, next) {
  if (!previous || !next || previous.id !== next.id ||
      next.status !== "playing" || next.stateVersion <= previous.stateVersion) return [];
  return next.tiles.filter(tile => {
    const before = previous.tiles.find(t => t.id === tile.id);
    const purchased = before?.ownerSeat === null && before.typeCode === 4 &&
      tile.ownerSeat !== null && tile.level === 1 &&
      next.players.some(p => p.seat === tile.ownerSeat && p.position === tile.id);
    // Upgrades can target another owned tile from the upgrade menu.
    const upgraded = before?.ownerSeat != null && before.ownerSeat === tile.ownerSeat &&
      before.level >= 1 && tile.level > before.level && tile.level <= 5;
    return purchased || upgraded;
  });
}

export function sealFrame(data, elapsed) {
  const index = Math.max(0, Math.floor(elapsed * data.fps / 1000));
  const step = data.sequence[Math.min(index, data.sequence.length - 1)];
  return { ...step, done: index >= data.sequence.length,
    revealed: index >= data.barrierStep };
}

