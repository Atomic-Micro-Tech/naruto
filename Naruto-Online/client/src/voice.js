import { api } from "./api";
let room = null;
let generation = 0;
export async function joinVoice(roomID, onStatus) {
  await leaveVoice();
  const attempt = generation;
  const { Room, RoomEvent, Track } = await import("livekit-client");
  const grant = await api(`/rooms/${roomID}/voice-token`, { method: "POST" });
  if (attempt !== generation) return;
  const joinedRoom = new Room({ adaptiveStream: true, dynacast: true });
  room = joinedRoom;
  joinedRoom.on(
    RoomEvent.TrackSubscribed,
    (track, publication, participant) => {
      if (track.kind !== Track.Kind.Audio) return;
      const element = track.attach();
      element.dataset.voiceUser = participant.identity;
      document.body.append(element);
    },
  );
  joinedRoom.on(RoomEvent.TrackUnsubscribed, (track) =>
    track.detach().forEach((e) => e.remove()),
  );
  joinedRoom.on(RoomEvent.Disconnected, () => {
    if (room !== joinedRoom) return;
    room = null;
    document.querySelectorAll("[data-voice-user]").forEach((e) => e.remove());
    onStatus(false);
  });
  try {
    await joinedRoom.connect(grant.url, grant.token);
    if (attempt !== generation) {
      await joinedRoom.disconnect();
      return;
    }
    await joinedRoom.localParticipant.setMicrophoneEnabled(true);
    if (attempt !== generation) {
      await joinedRoom.disconnect();
      return;
    }
    await joinedRoom.startAudio();
    if (attempt !== generation) {
      await joinedRoom.disconnect();
      return;
    }
    onStatus(true);
  } catch (error) {
    if (room === joinedRoom) await leaveVoice();
    else await joinedRoom.disconnect();
    throw error;
  }
}
export async function leaveVoice() {
  generation++;
  const previous = room;
  room = null;
  if (previous) await previous.disconnect();
  document.querySelectorAll("[data-voice-user]").forEach((e) => e.remove());
}
export async function muteVoice(muted) {
  if (room) await room.localParticipant.setMicrophoneEnabled(!muted);
}
