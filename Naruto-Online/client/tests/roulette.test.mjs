import { test } from "node:test";
import assert from "node:assert/strict";
import {
  wheelAngle,
  rouletteStopPlan,
  rouletteStopFrame,
} from "../src/presentation.js";
import { RouletteAudio } from "../src/roulette-audio.js";
const faces = [1, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 6];
test("rotation interpolates between logical ticks on high refresh screens", () => {
  const s = { serverTick: 0, roulette: { angle: 0, startedAtTick: 0 } };
  assert.ok(Math.abs(wheelAngle(s, 1000 / 120) - 90) < 1e-9);
  assert.ok(Math.abs(wheelAngle(s, 1000 / 240) - 45) < 1e-9);
});
test("braking preserves velocity and decelerates without overshoot for every result and starting sector", () => {
  for (let angle = 0; angle < 4096; angle += 47)
    for (let result = 1; result <= 6; result++) {
      const p = rouletteStopPlan(angle, faces, result);
      let previous = angle,
        velocity = Infinity;
      assert.equal(faces[p.index], result);
      assert.ok(p.duration >= 90 && p.duration < 850);
      const first = rouletteStopFrame(p, 0.001).angle;
      assert.ok(Math.abs((first - angle) / 0.001 - 10.8) < 0.001);
      for (let i = 1; i <= 100; i++) {
        const a = rouletteStopFrame(p, (p.duration * i) / 100).angle,
          v = a - previous;
        assert.ok(v >= -1e-8 && v <= velocity + 1e-8);
        velocity = v;
        previous = a;
      }
      assert.ok(Math.abs(previous - p.target) < 1e-8);
      assert.equal(rouletteStopFrame(p, p.duration + 100).angle, p.target);
      assert.equal(rouletteStopFrame(p, p.endAt).exit, 1);
    }
});
function fakeContext() {
  const events = [];
  const param = () => ({
    value: 0,
    setValueAtTime() {},
    linearRampToValueAtTime() {},
    cancelScheduledValues() {},
  });
  const ctx = {
    currentTime: 10,
    destination: {},
    createGain: () => ({ gain: param(), connect() {}, disconnect() {} }),
    createStereoPanner: () => ({
      pan: { value: 0 },
      connect() {},
      disconnect() {},
    }),
    createBufferSource() {
      return {
        connect() {},
        disconnect() {},
        start(at) {
          events.push({ kind: "start", id: this.buffer.id, at, source: this });
        },
        stop(at) {
          events.push({ kind: "stop", id: this.buffer.id, at });
        },
      };
    },
  };
  return { ctx, events };
}
test("WAV loop and three impacts are scheduled once, with cancellation on mute/exit", () => {
  const { ctx, events } = fakeContext(),
    buffers = new Map(
      ["menu_seq_003", "menu_seq_004", "menu_seq_005"].map((id) => [
        id,
        { id },
      ]),
    );
  const audio = new RouletteAudio(ctx, buffers);
  audio.sync({ key: "match:wheel" }, 1000);
  audio.sync({ key: "match:wheel" }, 1050);
  assert.equal(events.filter((e) => e.kind === "start").length, 1);
  assert.equal(events[0].source.loopEnd, 0.1);
  const state = {
    key: "match:wheel",
    stoppingAt: 1100,
    impacts: [200, 200 + 1000 / 30, 200 + 2000 / 30],
  };
  audio.sync(state, 1100);
  audio.sync(state, 1110);
  const hits = events.filter(
    (e) => e.kind === "start" && e.id === "menu_seq_005",
  );
  assert.equal(hits.length, 3);
  assert.ok(Math.abs(hits[1].at - hits[0].at - 1 / 30) < 1e-10);
  audio.stop();
  assert.equal(audio.key, null);
  assert.ok(events.filter((e) => e.kind === "stop").length >= 5);
  const count = events.filter((e) => e.kind === "start").length;
  audio.sync(state, 2100);
  assert.equal(
    events.filter((e) => e.kind === "start").length,
    count,
    "late unmute must not replay old hits",
  );
});
