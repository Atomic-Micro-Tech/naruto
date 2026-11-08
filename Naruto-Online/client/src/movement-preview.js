// Geometric remaining-step preview, matching BOARD 800b9e30 on arena 1.
// Start only from server-offered moves. Exclude immediate backtracking, like
// engine.paths; chance cards/warps may subsequently change the actual journey.
export function movementPreview(snapshot) {
  if (!snapshot || snapshot.status !== "playing" || snapshot.roulette ||
      snapshot.presentation?.phase !== "move") return [];
  const steps = snapshot.presentation.remaining;
  if (!Number.isInteger(steps) || steps < 1 || steps > 12) return [];
  const actor = snapshot.players.find(p => p.seat === snapshot.presentation.actorSeat);
  if (!actor) return [];
  const tiles = new Map(snapshot.tiles.map(t => [t.id, t]));
  const neighbors = id => [...new Set((tiles.get(id)?.neighbors ?? []).filter(n => tiles.has(n)))];
  const firstSteps = neighbors(actor.position);
  return snapshot.allowedActions.flatMap(a => a.options)
    .filter(o => o.enabled && o.id.startsWith("move:") && firstSteps.includes(o.tileId))
    .map(option => {
      const endpoints = new Set(), visited = new Set();
      function walk(previous, current, remaining) {
        if (!remaining) { endpoints.add(current); return; }
        const key = `${previous}:${current}:${remaining}`;
        if (visited.has(key)) return;
        visited.add(key);
        const adjacent = neighbors(current), forward = adjacent.filter(n => n !== previous);
        for (const next of forward.length ? forward : adjacent)
          walk(current, next, remaining - 1);
      }
      walk(actor.position, option.tileId, steps - 1);
      return { option, destinations: [...endpoints] };
    });
}
