/** Isolated, source-derived logic. See fidelity-rules.md for limits and addresses.
 * No emulator, MIPS execution, timing/animation substitutes, or guessed effects.
 * Functions return fresh data; RNG state is explicit to support save/replay.
 */
export function ps1Random(state) {
  const next = (Math.imul(state >>> 0, 0x41c64e6d) + 0x3039) >>> 0;
  return { state: next, value: (next >>> 16) & 0x7fff };
}

export function shuffleDeck(cards, state) {
  const deck = cards.slice();
  for (let i = 0; i < deck.length * 4; i++) {
    const random = ps1Random(state); state = random.state;
    const j = random.value % deck.length, k = i % deck.length;
    [deck[k], deck[j]] = [deck[j], deck[k]];
  }
  return { deck, state };
}

// FUN_800159bc does not permit append at index==length.
export function insertCard(cards, index, id, cardCount = 52) {
  if (!Number.isInteger(index) || index < 0 || index >= cards.length ||
      !Number.isInteger(id) || id < 0 || id >= cardCount || cards.length >= 64)
    return { deck: cards.slice(), inserted: false };
  return { deck: [...cards.slice(0, index), id, ...cards.slice(index)], inserted: true };
}

export function returnCard(cards, id, state, cardCount = 52) {
  if (id < 0 || id >= cardCount) return { deck: cards.slice(), state, inserted: false };
  const half = cards.length >>> 1;
  if (!half) throw new RangeError('Original return-card routine traps when deck length is below two');
  const random = ps1Random(state);
  return { ...insertCard(cards, half + random.value % half, id, cardCount), state: random.state };
}

export function drawFirstCard(cards, state) {
  if (!cards.length) throw new RangeError('Cannot draw from an empty deck');
  return { card: cards[0], ...shuffleDeck(cards.slice(1), state) };
}

// Chance UI: remove choice, shuffle, put choice at front; caller then executes
// drawFirstCard. Immediate-card reinsertion occurs in UI before that draw and
// therefore must be integrated separately if preserving exact RNG consumption.
export function selectChanceCard(cards, index, state) {
  if (index < 0 || index >= Math.min(3, cards.length)) throw new RangeError('Invalid chance choice');
  const remaining = cards.slice(); const [card] = remaining.splice(index, 1);
  const shuffled = shuffleDeck(remaining, state);
  return { card, ...insertCard(shuffled.deck, 0, card), state: shuffled.state };
}

export function drawChanceCard(cards, index, definitions, state) {
  const selected = selectChanceCard(cards, index, state);
  let deck = selected.deck; state = selected.state;
  if (definitions[selected.card].useFlag === 1) {
    const returned = returnCard(deck, selected.card, state);
    deck = returned.deck; state = returned.state;
  }
  return drawFirstCard(deck, state);
}

export function canUseCard(card, context) {
  if (context === 2) return card.useFlag === 2;
  if (context === 4) return card.useFlag === 0 && (card.type === 8 || card.type === 9);
  if (context === 5) return card.useFlag === 0 && (card.type === 10 || card.type === 11);
  return false;
}

export function addInventoryCard(inventory, id, cardCount = 52) {
  const result = Array.from({length: 3}, (_, i) => inventory[i] ?? 255);
  const slot = result.findIndex(x => x >= cardCount);
  if (slot < 0 || id < 0 || id >= cardCount) return { inventory: result, added: false };
  result[slot] = id;
  return { inventory: result, added: true };
}

/** Tile shape: {typeCode, neighbors:[slot0,...], owner, level:1..5,
 * rents:[five amounts], hp, repairCounter}. Index is original tile ID.
 * neighbors MUST retain original slot0; do not sort adjacency lists.
 */
export function barrierChains(tiles) {
  const chains = Array(tiles.length).fill(0), counts = Array.from({length:4}, () => [0,0,0,0]);
  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i];
    if (tile.typeCode !== 5 || chains[i] !== 0) continue;
    let next = tile.neighbors[0], extras = 0;
    while (extras < 5 && tiles[next]?.typeCode === 5 && tiles[next].owner === tile.owner) {
      next = tiles[next].neighbors[0]; extras++;
    }
    if (extras) {
      if (counts[tile.owner] && extras <= 4) counts[tile.owner][extras - 1]++;
      let cursor = i;
      for (let j = 0; j <= extras; j++) {
        chains[cursor] = extras; cursor = tiles[cursor].neighbors[0];
      }
    }
    i += extras;
  }
  return { chains, counts };
}

export function barrierRent(tile, chain = 0) {
  const base = tile.rents[tile.level - 1] ?? 0;
  if (chain === 4) return base * 2;
  if (chain < 0 || chain > 4) return 0; // switch default, including chain5
  return Math.floor(base * [10, 12, 15, 18][chain] / 10);
}

export function sourceBonus(tiles, player, baseBonus) {
  const { chains } = barrierChains(tiles);
  return baseBonus + Math.floor(tiles.reduce((sum, tile, i) =>
    sum + (tile.typeCode === 5 && tile.owner === player ? barrierRent(tile, chains[i]) : 0), 0) / 2);
}

export function repairAtBonus(tiles, player) {
  return tiles.map(tile => {
    if (tile.typeCode !== 5 || tile.owner !== player) return {...tile};
    const counter = (tile.repairCounter ?? 0) + 1;
    return {...tile, repairCounter: counter === 2 ? 0 : counter,
      hp: counter === 2 && tile.hp + 1 <= tile.level + 1 ? tile.hp + 1 : tile.hp};
  });
}

export function chanceEffect(card, { player, tiles, playerCount = 4, state = 1,
                                    teamMode = false, teams = [], protectedPlayers = [] } = {}) {
  switch (card.type) {
    case 0: return {kind:'chakra', delta:card.value, state};
    case 1: return {kind:'chakra', delta:card.value * tiles.reduce((n,t) =>
      n + (t.typeCode === 5 && t.owner === player ? t.level : 0),0), state};
    case 2: {
      let target = player;
      for (let n = 0; n < 50 && target === player; n++) {
        const r = ps1Random(state); state = r.state; target = r.value % playerCount;
      }
      return {kind:'transfer', delta:card.value, target, targetDelta:-card.value, state};
    }
    case 3: {
      // FUN_800f2a9c: all-player transfer. Protection excludes only recipients.
      const teammate = teamMode ? teams.findIndex((team, i) => i !== player && team === teams[player]) : -1;
      const factor = playerCount - 1 - Number(teamMode);
      const deltas = Array.from({length:playerCount}, (_, i) => i === player ? card.value * factor :
        i === teammate ? card.value * (playerCount - 2) :
        protectedPlayers[i] ? 0 : -card.value * (teamMode ? factor : 1));
      return {kind:'allPlayerTransfer', deltas, state};
    }
    case 4: return {kind:'skillPoints', delta:card.value, state};
    case 5: case 7: case 13: case 14: case 15:
      return {kind:'inventory', category:1, state};
    case 8: case 9: case 10: case 11:
      return {kind:'inventory', category:2, state};
    case 12: return {kind:'inventory', category:card.value === 0 ? 1 : 2, state};
    case 6: return {kind:'teleport', mode:card.value, verifiedComplete:false, state};
    default: return {kind:'unresolved', type:card.type, value:card.value, verifiedComplete:false, state};
  }
}

// Source-landing victory branch only, FUN_800edd68 cases2/3. Other board
// states also test victory; callers must not treat this as a global win rule.
export function sourceVictory({modeFlags, chakra, targetChakra, playerFlags = 0,
                               sealCount = 0, ruleParameters = [], lastCharacterId}) {
  if (modeFlags & 0x2000) return {won:true, reason:0};
  if (modeFlags & 0x200) return {won:chakra >= targetChakra, reason:0x200};
  if (modeFlags & 8) return {won:!!(playerFlags & 0x200) && chakra >= targetChakra, reason:8};
  if (modeFlags & 4) return {won:(sealCount >= (ruleParameters[2] ?? 0) && !!(playerFlags & 0x200)) ||
                                 chakra >= targetChakra, reason:4};
  if (modeFlags & 0x20) return {won:chakra >= targetChakra && lastCharacterId === ruleParameters[5], reason:0x20};
  return {won:chakra >= targetChakra, reason:modeFlags & 0x1000};
}

export function clearCrystalsAfterBonus(players, player, teamMode) {
  return players.map((p, i) => ({...p,
    flags:i === player || (teamMode && p.team === players[player].team) ? p.flags & 0x0fff : p.flags}));
}

// Source state10, after successful bonus; byte0 of flags is the lap counter.
export function shouldAwardScroll(players, player, everAwarded) {
  if (players.some(p => p.flags & 0x200)) return false;
  return everAwarded || players.every(p => (p.flags & 255) !== 0) || (players[player].flags & 255) > 1;
}

// FUN_800e70c8 case6; triggers/steal-card protection belong to the caller.
export function transferScroll(players, recipient, previous = -1) {
  return players.map((p,i) => ({...p,
    flags:i === recipient ? p.flags | 0x200 : i === previous ? p.flags & 0xfdff : p.flags,
    ...(i === recipient ? {scrollCounter:0} : {})}));
}

export function upgradePrice(base, oldLevel, newLevel) {
  const delta = newLevel - oldLevel;
  if (delta < 1 || delta > 4 || oldLevel < 1 || newLevel > 5) throw new RangeError('Invalid barrier upgrade');
  return base * [0,1,4,8,16][delta];
}

// Post-selection mutation, not target eligibility. Byte fields correspond to
// player+0x21 (forcedMove), +0x20(skipTurns), +0x26(rouletteStatus).
export function useBoardCard(card, actor, target, players) {
  let changed = false;
  const result = players.map((p,i) => {
    if (i !== target) return {...p};
    switch(card.type) {
      case 5: changed=true; return {...p,forcedMove:card.value};
      case 7: changed=target!==actor; return target===actor ? {...p} : {...p,skipTurns:card.value};
      case 13: changed=true; return {...p,rouletteStatus:0x10|card.value};
      case 14: changed=true; return {...p,rouletteStatus:0x20|card.value};
      case 15: changed=true; return {...p,rouletteStatus:0x32};
      default: return {...p};
    }
  });
  return {players:result,changed};
}

export function rouletteForStatus(original, status, playerStatus = 0) {
  if (playerStatus & 2) return Array.from({length:12},(_,i)=>i%3+1);
  if (!(status & 15)) return original.slice();
  const base={1:1,2:4,3:10}[status>>>4];
  return base===undefined ? original.slice() : Array.from({length:12},(_,i)=>i%3+base);
}

/** Teleport destination plan; caller applies its normal event/animation state.
 * status is player+0xd, flags is player+0xa. Value0 assumes original sourceID0.
 */
export function teleportPlan(card, player, players, tiles, target) {
  if (card.type !== 6) throw new RangeError('Not a teleport card');
  const common={remaining:0,clearActorStatus:true};
  switch(card.value) {
    case 0: return {...common,moves:[{player,tile:0}],grantAllCrystals:true,triggerDestination:true};
    case 1: case 2: {
      const type=card.value===1?1:3;
      const destinations=tiles.flatMap((t,i)=>t.typeCode===type?[i]:[]);
      if(target===undefined)return {...common,choose:'tile',destinations};
      if(!destinations.includes(target))throw new RangeError('Invalid teleport destination');
      return {...common,moves:[{player,tile:target}],triggerDestination:true};
    }
    case 4: {
      const targets=players.flatMap((p,i)=>i!==player && !(p.status&1)?[i]:[]);
      if(target===undefined)return {...common,choose:'player',targets};
      if(!targets.includes(target))throw new RangeError('Invalid teleport player');
      return {...common,moves:[{player,tile:players[target].tile}],triggerDestination:true};
    }
    case 5: return {...common,moves:players.flatMap((p,i)=>i!==player && !(p.status&1)?
      [{player:i,tile:players[player].tile}]:[]),triggerDestination:false};
    default: return {...common,verifiedComplete:false};
  }
}
