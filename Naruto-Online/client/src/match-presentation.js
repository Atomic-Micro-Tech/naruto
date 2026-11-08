// Ordered visual playback of authoritative snapshots. No commands or invented
// CPU decisions: newer server versions wait until the current visual completes.
export class MatchPresentation {
  constructor() { this.clear(); }
  clear() {
    this.current = null;
    this.latest = null;
    this.pending = [];
    this.reveal = null;
    this.enteredAt = 0;
    this.readyAt = null;
  }
  push(value) {
    if (this.latest?.id !== value.id) this.clear();
    if (this.latest && value.stateVersion <= this.latest.stateVersion) return false;
    this.latest = value;
    this.pending.push(value);
    return true;
  }
  next(now, animating = false) {
    if (animating && this.current) return null;
    if (this.readyAt === null) this.readyAt = now;
    const value = this.pending[0];
    if (!value) return null;
    if (this.current?.roulette && !value.roulette && now - this.enteredAt < 900) return null;
    const chance = this.current?.presentation?.chance;
    const result = value.presentation?.chanceResult;
    if (chance && result && result.actorSeat === chance.actorSeat) {
      if (now - this.readyAt < 750) return null;
      if (!this.reveal) this.reveal = { ...result, startedAt: now };
      if (now - this.reveal.startedAt < 1400) return null;
    }
    const sameChance = chance?.choiceId && chance.choiceId === value.presentation?.chance?.choiceId;
    const sameWheel = this.current?.roulette?.id && this.current.roulette.id === value.roulette?.id;
    this.current = this.pending.shift();
    this.reveal = null;
    if (!sameChance && !sameWheel) { this.enteredAt = now; this.readyAt = null; }
    return this.current;
  }
  get busy() { return this.pending.length > 0 || this.reveal !== null; }
}

export function chanceAnimation(offer, reveal, elapsed, selected = 0, interactive = false) {
  const index = reveal ? reveal.slot : interactive ? selected : Math.floor(elapsed / 180) % offer.cards.length;
  const revealed = !!reveal && elapsed >= 350;
  return { selected: index, revealed,
    cards: offer.cards.map(card => ({ ...card,
      cardId: revealed && card.slot === reveal.slot ? reveal.cardId : offer.faceUp ? card.cardId : undefined })) };
}
