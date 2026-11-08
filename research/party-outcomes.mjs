/** Executable specification of individual Party outcome branches.
 * Sources: BOARD 800edd68, 800dc2e0, 800e0b3c, 800e1958,
 * 80110d68, 80114390; EXE 80017034. No browser integration or PS1 execution.
 */
export const BADGES = ['1位', '2位', '3位', 'ドベ', '勝ち', 'まけ'];
const rules = new Set([0, 1, 2, 4, 8]);
function checkRule(rule) {
  if (!rules.has(rule)) throw new RangeError('Individual Party selects one rule: 0,1,2,4,8');
}
function checkPlayers(players) {
  if (players.length < 2 || players.length > 4) throw new RangeError('Party has 2..4 participants');
  for (const p of players) {
    if (!Number.isInteger(p.chakra) || p.chakra < -9999 || p.chakra > 99999)
      throw new RangeError('Supply settled, clamped original chakra');
    if (!Number.isInteger(p.actorStatus)) throw new TypeError('actorStatus is required');
  }
}
const inactive = p => Boolean(p.actorStatus & 1);

/** Invoke only AFTER a qualifying source bonus has settled, before upgrades.
 * This predicate is not an arbitrary-chakra-change victory check.
 */
export function sourceBonusWins({rule = 0, target, chakra, hasScroll = false,
                                  scrollBonuses = 0, bonusLimit = 5}) {
  checkRule(rule);
  if (!Number.isInteger(target) || target < 0 || target > 99999)
    throw new RangeError('Five-digit Party target');
  if (rule === 8) return hasScroll && chakra >= target;
  if (rule === 4) return chakra >= target || (hasScroll && scrollBonuses >= bonusLimit);
  return chakra >= target;
}

/** Late end-turn gate; round counter is incremented earlier for last slot.
 * Native termination tests equality, whereas result labels use >= limit.
 */
export function reachedTurnLimit({rule = 0, round, limit, actor, playerCount, pending = []}) {
  checkRule(rule);
  return rule === 2 && pending.every(x => x === 0) && actor === playerCount - 1 && round === limit;
}

/** Summary of the individual elimination scan once chakra queues have settled.
 * Caller executes dialog/removal/land cleanup in eliminatedSlots order.
 * previousWinnerSlot MUST be supplied: source does not reset its candidate.
 */
export function eliminationOutcome(players, previousWinnerSlot) {
  checkPlayers(players);
  if (!Number.isInteger(previousWinnerSlot) || previousWinnerSlot < 0 || previousWinnerSlot > 255)
    throw new TypeError('Supply the actual board+0x58b byte; do not invent a default');
  for (const p of players) if (typeof p.isCpu !== 'boolean') throw new TypeError('isCpu is required');
  const eliminatedSlots = players.flatMap((p, i) => !inactive(p) && p.chakra < 0 ? [i] : []);
  const settled = players.map((p, i) => ({...p, actorStatus: p.actorStatus | (eliminatedSlots.includes(i) ? 1 : 0)}));
  const active = settled.flatMap((p, i) => !inactive(p) ? [i] : []);
  const humans = active.filter(i => !settled[i].isCpu);
  const finish = active.length === 1 || humans.length === 0;
  if (!finish) return {finish, eliminatedSlots, active, humans};
  let best = 0, candidate = previousWinnerSlot;
  for (const i of active) if (settled[i].chakra > best) {
    best = settled[i].chakra;
    candidate = i;
  }
  const cpuOnlyFinish = humans.length === 0 && active.length > 1;
  return {finish, eliminatedSlots, active, humans, candidate,
    cameraFocusSlot: candidate, winnerSlot: cpuOnlyFinish ? 255 : candidate,
    cpuOnlyFinish, needsPriorMemory: best === 0,
    validActiveCandidate: active.includes(candidate)};
}

function exchangeSort(scores) {
  const order = scores.map((_, i) => i);
  for (let i = 0; i < order.length; i++) for (let j = i + 1; j < order.length; j++)
    if (scores[order[i]] < scores[order[j]]) [order[i], order[j]] = [order[j], order[i]];
  return order;
}

/** Inputs preserve distinct board winner slot and current/surrendering slot.
 * All values are explicit snapshots; no synthetic winner is created for ties.
 */
export function partyResult({players, winnerSlot, rule = 0, round = 0, limit = 5,
                             surrenderingSlot = null}) {
  checkPlayers(players);
  checkRule(rule);
  if (!Number.isInteger(winnerSlot) || winnerSlot < 0 || winnerSlot > 255)
    throw new TypeError('winnerSlot must be an explicit byte (255 for no declared winner)');
  const surrender = surrenderingSlot !== null;
  if (surrender && (!Number.isInteger(surrenderingSlot) || surrenderingSlot < 0 || surrenderingSlot >= players.length))
    throw new RangeError('Invalid surrendering slot');
  const scores = players.map((p, i) => surrender ? p.chakra
    : i === winnerSlot ? 0x7fffffff : p.chakra - (inactive(p) ? 10000 : 0));
  const order = exchangeSort(scores);
  if (surrender) for (let i = 0; i < order.length - 1; i++)
    if (order[i] === surrenderingSlot) [order[i], order[i + 1]] = [order[i + 1], order[i]];
  let rank = surrender || (rule === 2 && round >= limit) ? 0 : 1;
  let previousChakra = players[order[rank]].chakra;
  const badgeIds = [0];
  for (let position = 1; position < order.length; position++) {
    const chakra = players[order[position]].chakra;
    if (chakra < previousChakra) { rank++; previousChakra = chakra; }
    badgeIds[position] = rank;
  }
  if (surrender) badgeIds[order.indexOf(surrenderingSlot)] = 3;
  else if (rank > 0) for (let position = 1; position < order.length; position++)
    if (badgeIds[position] === rank) badgeIds[position] = 3;
  for (let position = 1; position < order.length; position++)
    if (inactive(players[order[position]])) badgeIds[position] = 3;
  return {order, badgeIds, labels: badgeIds.map(i => BADGES[i]),
    specialResult: surrender ? 1 : 0, nextScene: 2, evaluateProgression: false};
}
