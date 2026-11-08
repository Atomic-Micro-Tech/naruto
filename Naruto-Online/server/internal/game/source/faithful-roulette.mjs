/** Source-derived roulette clock; details/limits in fidelity-roulette.md.
 * One advance is one original widget update, not one browser paint.
 * Particle positions are not rendered here; their original RNG draws are kept.
 */
import {ps1Random, rouletteForStatus} from './faithful-rules.mjs';

export const ROULETTE_ANGLE_STEP = 180;
export function rouletteIndex(angle) { return Math.floor((angle & 4095) / 341) % 12; }
export function rouletteValue(wheel) { return wheel.faces[rouletteIndex(wheel.angle)]; }
export function ticksToRouletteValue(wheel, value) {
  const index = wheel.faces.indexOf(value);
  if (index < 0) return -1;
  let target = index * 341;
  if (target < wheel.angle) target += 4096;
  return Math.trunc((target - wheel.angle) / 180);
}

/** Shared original widget startup, for board OR battle faces. 65 RNG calls. */
export function startBoardRoulette(faces, rngState, {targetValue = null} = {}) {
  if (faces.length !== 12) throw new RangeError('Original roulette has twelve faces');
  faces = faces.slice();
  for (let i = 0; i < 64; i++) {
    const r = ps1Random(rngState); rngState = r.state;
    const a = i % 12, b = r.value % 12;
    [faces[a], faces[b]] = [faces[b], faces[a]];
  }
  const r = ps1Random(rngState);
  return {faces, rngState:r.state, angle:r.value % 4096, spinning:true,
    phase:0, openingRemaining:10, exitRemaining:0, countdown:0,
    jolt:0, scale:4096, scaleProgress:4096, hammerTick:null,
    targetValue, events:[]};
}

/** Immediate primitive80020c90; humaninput must use stopBoardRoulette. */
export function freezeRoulette(wheel) {
  return wheel.spinning ? {...wheel, spinning:false,
    angle:Math.floor((wheel.angle >>> 0) / 341) * 341} : {...wheel};
}

function beginHammers(wheel) {
  // The two positional jitter draws in8010b084, before any impact particles.
  const a = ps1Random(wheel.rngState), b = ps1Random(a.state);
  return {...wheel, phase:3, hammerTick:0, rngState:b.state, events:[]};
}

/** Request after advance, matching800b50ac's widget-before-input order.
 * The logical angle keeps advancing for five subsequent ticks before freezing.
 */
export function stopBoardRoulette(wheel) {
  if (wheel.phase !== 2 || wheel.targetValue !== null) return {...wheel, events:[]};
  return beginHammers(wheel);
}

export function advanceBoardRoulette(wheel, ticks = 1) {
  if (!Number.isInteger(ticks) || ticks < 0) throw new RangeError('ticks must be a nonnegative integer');
  let w = {...wheel, events:[]};
  for (let tick = 0; tick < ticks; tick++) {
    if (w.spinning) w.angle = (w.angle + 180) & 4095;
    if (w.jolt) w.jolt = -(w.jolt - Math.sign(w.jolt));
    if (w.phase === 0) w.phase = 1;
    else if (w.phase === 2 && w.targetValue !== null && ticksToRouletteValue(w, w.targetValue) === 3) {
      const events = w.events;
      w = beginHammers(w); w.events = [...events, {type:'cpu-stop', tick}];
      continue; // Original early return skips all tweens on this tick.
    } else if (w.phase === 4) {
      if (w.scaleProgress > 128) w.scaleProgress -= 128;
      w.scale = Math.min(4096, w.scaleProgress);
      if (--w.countdown === 0) { w.phase = 5; w.exitRemaining = 8; }
    } else if (w.phase === 6) continue;

    if (w.openingRemaining > 0 && --w.openingRemaining === 0) {
      w.phase = 2; w.events.push({type:'ready', tick});
    }
    if (w.exitRemaining > 0 && --w.exitRemaining === 0) {
      w = freezeRoulette(w); w.phase = 6; w.events.push({type:'done', tick});
    }
    if (w.hammerTick !== null && w.hammerTick < 7) {
      w.hammerTick++;
      const index = [3,5,7].indexOf(w.hammerTick);
      if (index >= 0) {
        if (index !== 0) { w = freezeRoulette(w); w.phase = 4; w.countdown = 60; }
        w.jolt = 4; w.scaleProgress = 4096;
        // 8010bfa8:20 calls to c1c0 (angle/lifetime:2 rand each), then c5c4
        // (one rand). Third impact also creates label3 via another c5c4.
        // The reset widget has60 slots, so all60 particles can be allocated.
        for(let n=0;n<41+Number(index===2);n++)w.rngState=ps1Random(w.rngState).state;
        w.events.push({type:'hammer', index, tick});
      }
    }
  }
  return w;
}

/** The menu's forced-move action bypasses the wheel and does not consume its
 * status counter. Do not call startBoardRoulette when bypass is true. */
export function prepareBoardRoll(faces, player, useForcedMove = false) {
  if (useForcedMove) {
    if (!(player.forcedMove > 0)) throw new RangeError('No forced-move value held');
    return {bypass:true, movement:player.forcedMove,
      player:{...player, forcedMove:0}, faces:null};
  }
  return {bypass:false, movement:null, player:{...player},
    faces:rouletteForStatus(faces, player.rouletteStatus ?? 0, player.playerStatus ?? 0)};
}

/** Call after phase6 for an ordinary movement roll. Status restoration is done
 * before movement; low-range bit2 takes precedence over clearing high nibble. */
export function finishBoardRoll(wheel, player) {
  if (wheel.phase !== 6) throw new Error('Roulette has not finished');
  let rouletteStatus = player.rouletteStatus ?? 0;
  let playerStatus = player.playerStatus ?? 0;
  if (rouletteStatus & 15) rouletteStatus--;
  if (playerStatus & 2) playerStatus &= ~2;
  else if ((rouletteStatus & 240) && !(rouletteStatus & 15)) rouletteStatus = 0;
  return {movement:rouletteValue(wheel), player:{...player, rouletteStatus, playerStatus}};
}
