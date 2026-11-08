let enabled = false,
  current = "";
const music = new Audio();
music.loop = true;
music.volume = 0.22;
const sounds = new Map();
export async function toggleAudio(snapshot) {
  enabled = !enabled;
  if (!enabled) music.pause();
  else {
    updateAudio(snapshot);
    try {
      await music.play();
    } catch (error) {
      enabled = false;
      throw error;
    }
  }
  return enabled;
}
export function updateAudio(snapshot) {
  if (!enabled) return;
  const combat =
    ["combat"].includes(snapshot?.phase) ||
    ["attackRoll", "defenseRoll"].includes(snapshot?.presentation?.phase);
  const track = snapshot?.result
    ? "music-25_seq_000"
    : combat
      ? "music-22_seq_000"
      : "music-10_seq_000";
  if (track === current) return;
  current = track;
  music.src = `/assets/audio/music/${track}.wav`;
  music.play().catch(() => {});
}
export function sound(name) {
  if (!enabled) return;
  const path =
    name === "step"
      ? "board_seq_008"
      : name === "stop"
        ? "menu_seq_004"
        : "menu_seq_000";
  if (!sounds.has(path))
    sounds.set(path, new Audio(`/assets/audio/sfx/${path}.wav`));
  const audio = sounds.get(path);
  audio.volume = 0.35;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}
