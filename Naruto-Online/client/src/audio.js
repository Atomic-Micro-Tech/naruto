import { RouletteAudio } from "./roulette-audio";
let enabled = true,
  current = "",
  snapshot = null,
  context = null,
  roulette = null,
  desiredWheel = null,
  loading = null,
  generation = 0;
try {
  enabled = localStorage.getItem("naruto:audio") !== "off";
} catch {}
const music = new Audio();
music.loop = true;
music.volume = 0.22;
const sounds = new Map(),
  buffers = new Map();
export const isAudioEnabled = () => enabled;
function announce() {
  document.dispatchEvent(
    new CustomEvent("game-audio-change", { detail: enabled }),
  );
}
export async function unlockAudio() {
  if (!enabled) return;
  const Context = window.AudioContext ?? window.webkitAudioContext;
  if (!context && Context)
    context = new Context({ latencyHint: "interactive" });
  const resumed = context?.resume();
  updateAudio(snapshot);
  if (snapshot) music.play().catch(() => {});
  if (context && !loading) {
    loading = Promise.all(
      ["menu_seq_003", "menu_seq_004", "menu_seq_005"].map(async (id) => {
        const response = await fetch(`/assets/audio/sfx/${id}.wav`);
        if (!response.ok) throw new Error("Efek roulette gagal dimuat.");
        buffers.set(
          id,
          await context.decodeAudioData(await response.arrayBuffer()),
        );
      }),
    )
      .then(() => {
        roulette = new RouletteAudio(context, buffers);
      })
      .catch((error) => {
        loading = null;
        throw error;
      });
  }
  await resumed;
  await loading;
  if (enabled && desiredWheel && context?.state === "running")
    roulette?.sync(desiredWheel, performance.now());
}
// Ready/roll/canvas gestures unlock audio under browser autoplay policy.
for (const event of ["pointerdown", "keydown"])
  document.addEventListener(
    event,
    () => {
      unlockAudio().catch(() => {});
    },
    { capture: true },
  );
export async function toggleAudio(value) {
  enabled = !enabled;
  generation++;
  try {
    localStorage.setItem("naruto:audio", enabled ? "on" : "off");
  } catch {}
  if (!enabled) {
    music.pause();
    roulette?.stop();
    for (const audio of sounds.values()) audio.pause();
  } else {
    snapshot = value;
    await unlockAudio();
  }
  announce();
  return enabled;
}
export function updateAudio(value) {
  snapshot = value;
  if (!value) {
    music.pause();
    updateRouletteAudio(null);
    return;
  }
  if (!enabled) return;
  const combat =
    value.phase === "combat" ||
    ["attackRoll", "defenseRoll"].includes(value.presentation?.phase);
  const track = value.result
    ? "music-25_seq_000"
    : combat
      ? "music-22_seq_000"
      : "music-10_seq_000";
  if (track !== current) {
    current = track;
    music.src = `/assets/audio/music/${track}.wav`;
  }
  if (context?.state === "running" && music.paused)
    music.play().catch(() => {});
}
export function updateRouletteAudio(wheel) {
  desiredWheel = wheel;
  music.volume = wheel ? 0.12 : 0.22;
  if (!enabled || document.hidden || context?.state !== "running") {
    if (roulette?.key !== null) roulette?.stop();
    return;
  }
  roulette?.sync(wheel, performance.now());
}
export function stopGameAudio() {
  generation++;
  snapshot = null;
  desiredWheel = null;
  music.pause();
  roulette?.stop();
  for (const audio of sounds.values()) audio.pause();
}
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    music.pause();
    roulette?.stop();
    for (const audio of sounds.values()) audio.pause();
  } else if (enabled) {
    updateAudio(snapshot);
    updateRouletteAudio(desiredWheel);
  }
});
window.addEventListener("pagehide", stopGameAudio);
export function sound(name) {
  if (!enabled || document.hidden) return;
  // Stop/impacts follow the actual presentation, also for CPU/opponent turns.
  if (name === "stop") return;
  const path =
    name === "step"
      ? "board_seq_008"
      : name === "cursor"
        ? "menu_seq_002"
        : "menu_seq_000";
  if (!sounds.has(path))
    sounds.set(path, new Audio(`/assets/audio/sfx/${path}.wav`));
  const audio = sounds.get(path),
    ticket = generation;
  audio.volume = 0.35;
  audio.currentTime = 0;
  audio
    .play()
    .then(() => {
      if (ticket !== generation || !enabled) audio.pause();
    })
    .catch(() => {});
}
