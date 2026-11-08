// Source mapping: research/story1-audio.md. SEQ3's sequence period is 0.1s;
// its exported WAV also contains a release tail outside that loop interval.
export class RouletteAudio {
  constructor(context, buffers, destination = context.destination) {
    this.context = context;
    this.buffers = buffers;
    this.destination = destination;
    this.voices = new Set();
    this.key = null;
    this.stoppingAt = null;
    this.loop = null;
  }
  play(id, at = this.context.currentTime, pan = 0, loop = false) {
    const source = this.context.createBufferSource(),
      gain = this.context.createGain(),
      panner = this.context.createStereoPanner();
    source.buffer = this.buffers.get(id);
    source.loop = loop;
    if (loop) {
      source.loopStart = 0;
      source.loopEnd = 0.1;
    }
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(loop ? 0.65 : 0.85, at + 0.003);
    panner.pan.value = pan;
    source.connect(gain);
    gain.connect(panner);
    panner.connect(this.destination);
    const voice = { source, gain, panner, at };
    this.voices.add(voice);
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
      panner.disconnect();
      this.voices.delete(voice);
    };
    source.start(at);
    return voice;
  }
  stopVoice(voice, at = this.context.currentTime) {
    if (!voice || !this.voices.has(voice)) return;
    const when = Math.max(at, this.context.currentTime);
    voice.gain.gain.cancelScheduledValues(when);
    voice.gain.gain.setValueAtTime(voice.gain.gain.value, when);
    voice.gain.gain.linearRampToValueAtTime(0, when + 0.006);
    try {
      voice.source.stop(when + 0.007);
    } catch {}
  }
  sync(wheel, now) {
    if (!wheel) {
      if (this.key !== null) this.stop();
      return;
    }
    if (this.key !== wheel.key) {
      this.stop();
      this.key = wheel.key;
    }
    if (wheel.stoppingAt == null) {
      if (!this.loop)
        this.loop = this.play(
          "menu_seq_003",
          this.context.currentTime,
          0,
          true,
        );
      return;
    }
    if (this.stoppingAt === wheel.stoppingAt) return;
    this.stoppingAt = wheel.stoppingAt;
    const elapsed = Math.max(0, now - wheel.stoppingAt),
      base = this.context.currentTime;
    if (elapsed < 40) this.play("menu_seq_004", base, 0.5);
    const first = wheel.impacts[0] - elapsed;
    this.stopVoice(this.loop, base + Math.max(0, first) / 1000);
    this.loop = null;
    // Audio-clock scheduling keeps the three impacts aligned even on slow frames.
    // A late load/unmute/reconnect must not replay old impacts.
    for (const impact of wheel.impacts) {
      const remaining = impact - elapsed;
      if (remaining >= 0) this.play("menu_seq_005", base + remaining / 1000, 0);
    }
  }
  stop() {
    for (const voice of this.voices) this.stopVoice(voice);
    this.key = null;
    this.stoppingAt = null;
    this.loop = null;
  }
}
