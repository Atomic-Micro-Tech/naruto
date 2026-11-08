import "./style.css";
import { automaticAction, directionLabel } from "./presentation";
import { api, setSession, Connection } from "./api";
import { joinVoice, leaveVoice, muteVoice } from "./voice";
import {
  toggleAudio,
  updateAudio,
  sound,
  stopGameAudio,
  isAudioEnabled,
} from "./audio";

const $ = (id) => document.getElementById(id),
  names = ["Naruto", "Sasuke", "Sakura", "Kakashi"];
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const face = (id) =>
  `/assets/sprite/common/character_${String(id).padStart(2, "0")}_face.png`;
let session = null,
  socket = null,
  arenas = [],
  room = null,
  match = null,
  board = null,
  assetsReady = false,
  busy = false,
  lobbyBusy = false,
  connected = false,
  voiceOn = false,
  voiceBusy = false,
  muted = false,
  character = 0,
  inviteCode = null;
let roomsTimer,
  roomsRefresh,
  chatRoom = null,
  lastMatchID = null,
  noticeTimer,
  matchReceivedAt = 0,
  selectedChance = 0,
  chanceKey = null,
  automaticKey = null,
  visualBusy = false;

$("app").innerHTML = `
 <header class="topbar"><a class="brand" href="/">NARUTO<span>ONLINE</span></a><span class="edition">PARTY · ARENA 01</span><div class="account"><span id="connection" class="connection">LOKAL</span><span id="username"></span><button id="logout" class="quiet" hidden>Keluar</button></div></header>
 <div id="notice" role="status" aria-live="polite" hidden></div>
 <main>
 <section id="auth" class="auth-layout"><div class="intro"><p class="eyebrow">DESA KONOHA · PARTY MODE</p><h1>Satu papan.<br>Empat jalan<br><em>menjadi juara.</em></h1><p>Kumpulkan kristal, bangun penghalang, dan tantang temanmu dalam perebutan chakra.</p><div class="intro-characters">${names.map((n, i) => `<img src="${face(i)}" alt="${n}">`).join("")}</div><span class="small">2–4 pemain · sentuh untuk bermain · arena 1</span></div><div class="auth-card panel"><p class="eyebrow">SELAMAT DATANG, SHINOBI</p><h2 id="auth-title">Masuk ke desa</h2><form id="auth-form"><label id="name-label" hidden>Nama pemain<input name="displayName" maxlength="32" autocomplete="nickname"></label><label>Email<input name="email" type="email" required autocomplete="email" placeholder="nama@email.com"></label><label>Kata sandi<input name="password" type="password" minlength="12" maxlength="128" required autocomplete="current-password" placeholder="Minimal 12 karakter"></label><button class="primary" id="auth-submit">Masuk & bermain <span>→</span></button></form><button id="auth-toggle" class="text-button">Belum punya akun? Daftar</button><button id="forgot" class="text-button">Lupa kata sandi</button><p class="fine">Pengujian lokal. Akun dan pertandingan tersimpan di server.</p></div></section>
 <section id="lobby" hidden><div class="section-heading"><div><p class="eyebrow">TEMPAT BERKUMPUL</p><h1>Pilih perjalananmu.</h1></div><button id="refresh-rooms" class="quiet">↻ Muat ulang</button></div><div class="lobby-grid"><div><div class="list-heading"><h2>Room tersedia</h2><span class="pill">ARENA 1</span></div><div id="rooms" class="room-list"></div><form id="join-code" class="code-form panel"><label>Punya undangan?<input name="code" required maxlength="16" placeholder="Kode room privat"></label><button>Gabung</button></form></div><aside class="panel create-room"><img class="arena-preview" src="/assets/image/arena1/map_00.png" alt="Papan arena 1"><div class="create-content"><p class="eyebrow">MULAI BERSAMA TEMAN</p><h2>Buat room</h2><form id="create-room"><label>Nama room<input name="name" required maxlength="60" placeholder="Tim Konoha"></label><div class="form-row"><label>Arena<select name="arena" id="arena-list"></select></label><label>Pemain<select name="capacity"><option value="4">4 pemain</option><option value="3">3 pemain</option><option value="2">2 pemain</option></select></label></div><div class="form-row"><label>Target chakra<input name="target" type="number" min="0" max="99999" value="3000" required></label><label>Visibilitas<select name="visibility"><option value="public">Publik</option><option value="private">Privat</option></select></label></div><label class="check"><input name="voice" type="checkbox"> Aktifkan voice room</label><button class="primary">Buat room <span>+</span></button></form></div></aside></div></section>
 <section id="play" hidden><div class="game-heading"><div><p class="eyebrow" id="room-caption">ARENA 1</p><h1 id="room-name"></h1></div><div class="toolbar"><button id="music" class="quiet" aria-pressed="true">♫ Suara aktif</button><button id="map-view" class="quiet">Lihat peta</button><button id="fullscreen" class="quiet">Layar penuh</button><button id="sync" class="quiet">↻ Sinkronkan</button><button id="leave" class="quiet">Keluar room</button></div></div><div class="game-layout"><div class="game-main"><div id="players" class="players"></div><div class="board-frame"><div id="board"></div><button id="stage-menu" class="quiet" aria-label="Pilihan layar game">☰</button><div class="board-label"><span>ARENA 01</span><span id="round">DESA KONOHA</span></div><div id="controls" class="panel controls"></div></div><details class="panel history"><summary>Catatan pertandingan</summary><ol id="game-log"></ol></details></div><aside class="social"><section id="waiting" class="panel"><p class="eyebrow">PERSIAPAN</p><h2>Pilih karaktermu</h2><div id="characters" class="characters">${names.map((n, i) => `<button data-character="${i}" aria-label="Pilih ${n}"><img src="${face(i)}" alt=""><span>${n}</span></button>`).join("")}</div><div id="invite"></div><button id="ready" class="primary" disabled>Memuat aset…</button><button id="start" class="primary" hidden>Mulai pertandingan →</button><p class="fine">Semua pemain harus terhubung dan siap. Minimal 2 pemain.</p></section><section class="panel chat-panel"><div class="list-heading"><h2>Obrolan room</h2><span class="live-dot"></span></div><div id="messages" class="messages" role="log" aria-live="polite"></div><form id="chat-form"><input name="text" aria-label="Pesan chat" maxlength="300" placeholder="Kirim pesan…" required autocomplete="off"><button aria-label="Kirim pesan">↑</button></form><div class="voice-controls"><button id="voice" class="quiet">♬ Gabung voice</button><button id="mute" class="quiet" hidden>Bisukan mic</button></div><p id="voice-note" class="fine">Mikrofon hanya aktif setelah kamu bergabung.</p></section><section class="panel guide"><p class="eyebrow">CARA BERMAIN</p><p>Putar roulette lalu pilih jalur. Ambil semua kristal dan kembali ke gerbang untuk bonus chakra.</p><p>Beli dan tingkatkan penghalang. Di wilayah lawan, bayar atau bertarung. Capai target saat kembali ke gerbang untuk menang.</p><span class="fine">CPU akan mengambil alih jika koneksi terputus atau giliran dibiarkan selama 2 menit.</span></section></aside></div></section>
 </main><footer>LOCAL PLAYTEST <span>·</span> PHASER 3 <span>·</span> ARENA 1</footer>`;

let authMode = "login";
function notice(text, error = false) {
  clearTimeout(noticeTimer);
  $("notice").textContent = text;
  $("notice").className = error ? "error" : "";
  $("notice").hidden = !text;
  if (text)
    noticeTimer = setTimeout(
      () => ($("notice").hidden = true),
      error ? 12000 : 6000,
    );
}
async function attempt(fn) {
  try {
    return await fn();
  } catch (error) {
    notice(error.message, true);
    return null;
  }
}
function view(id) {
  if (id !== "play") {
    board?.setState(null);
    stopGameAudio();
  }
  document.body.classList.toggle("in-game", id === "play" && !!match);
  for (const key of ["auth", "lobby", "play"]) $(key).hidden = key !== id;
  requestAnimationFrame(() => board?.resize());
}
function authModeSet(mode) {
  authMode = mode;
  $("name-label").hidden = mode !== "register";
  $("auth-title").textContent =
    mode === "register" ? "Daftar sebagai shinobi" : "Masuk ke desa";
  $("auth-submit").textContent =
    mode === "register" ? "Buat akun" : "Masuk & bermain →";
  $("auth-toggle").textContent =
    mode === "register"
      ? "Sudah punya akun? Masuk"
      : "Belum punya akun? Daftar";
  $("auth-form").elements.displayName.required = mode === "register";
}
$("auth-toggle").onclick = () =>
  authModeSet(authMode === "login" ? "register" : "login");
$("auth-form").onsubmit = (event) => {
  event.preventDefault();
  attempt(async () => {
    const form = event.target,
      values = Object.fromEntries(new FormData(form));
    $("auth-submit").disabled = true;
    try {
      if (authMode === "register") {
        const result = await api("/auth/register", {
          method: "POST",
          body: values,
        });
        notice(
          result.verificationEmailSent
            ? "Akun dibuat. Email verifikasi telah dikirim."
            : "Akun dibuat. Email verifikasi masih dalam antrean pengiriman.",
        );
      }
      const login = await api("/auth/login", {
        method: "POST",
        body: { email: values.email, password: values.password },
      });
      form.reset();
      await enter(login);
    } finally {
      $("auth-submit").disabled = false;
    }
  });
};
$("forgot").onclick = () =>
  attempt(async () => {
    const email = $("auth-form").elements.email.value;
    if (!email) throw new Error("Isi email terlebih dahulu.");
    await api("/auth/forgot-password", { method: "POST", body: { email } });
    notice("Jika email terdaftar, tautan reset akan dikirim.");
  });
$("logout").onclick = () =>
  attempt(async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch (error) {
      if (error.status !== 401) throw error;
    }
    returnToLogin("Kamu sudah keluar.");
  });

function returnToLogin(message) {
  socket?.close();
  leaveVoice().catch(() => {});
  clearInterval(roomsTimer);
  clearTimeout(roomsRefresh);
  session = null;
  room = null;
  match = null;
  connected = false;
  voiceOn = false;
  muted = false;
  setSession(null);
  $("username").textContent = "";
  $("logout").hidden = true;
  $("connection").textContent = "LOKAL";
  $("connection").classList.remove("online");
  view("auth");
  notice(message);
}

async function enter(data) {
  session = data;
  setSession(data);
  $("username").textContent = data.user.displayName;
  $("logout").hidden = false;
  arenas = (await api("/arenas")).items;
  $("arena-list").innerHTML = arenas
    .map((a) => `<option value="${esc(a.id)}">Arena 1 · Konoha</option>`)
    .join("");
  view("lobby");
  await refreshRooms();
  socket?.close();
  socket = new Connection();
  socket.addEventListener("status", ({ detail }) => {
    connected = detail === "connected";
    $("connection").textContent = connected ? "● TERHUBUNG" : "○ MENGHUBUNGKAN";
    $("connection").classList.toggle("online", connected);
    if (room) renderRoom();
  });
  socket.addEventListener("expired", ({ detail }) => {
    returnToLogin(detail);
  });
  socket.addEventListener("room.snapshot", ({ detail }) =>
    setRoom(detail.room, detail.inviteCode),
  );
  socket.addEventListener("match.snapshot", ({ detail }) => setMatch(detail));
  socket.addEventListener("rooms.updated", () => {
    clearTimeout(roomsRefresh);
    roomsRefresh = setTimeout(() => attempt(refreshRooms), 250);
  });
  socket.addEventListener("chat.message", ({ detail }) => {
    if (detail.roomId === room?.id) addMessage(detail);
  });
  socket.addEventListener("member.updated", ({ detail }) => {
    if (
      detail.roomId === room?.id &&
      detail.userId === session.user.id &&
      detail.member === null
    ) {
      room = null;
      match = null;
      leaveVoice();
      view("lobby");
      attempt(refreshRooms);
      notice("Kamu telah keluar dari room.");
    }
  });
  socket.connect();
  clearInterval(roomsTimer);
  roomsTimer = setInterval(() => {
    if (!room) attempt(refreshRooms);
  }, 15000);
  if (!board) {
    try {
      const { createBoard } = await import("./board.js");
      board = await createBoard("board", (id) => choose(id), (mode) => {
        $("map-view").textContent = mode === "follow" ? "Lihat peta" : "Ikuti karakter";
      });
      assetsReady = true;
      if (match) board.setState(match);
      if (room) renderRoom();
    } catch (error) {
      notice(error.message, true);
    }
  }
}
async function refreshRooms() {
  const data = await api("/rooms?limit=50");
  $("rooms").innerHTML = data.items.length
    ? data.items
        .map(
          (r) =>
            `<article class="room-row"><div class="room-icon"><img src="${face(0)}" alt=""></div><div class="room-info"><h3>${esc(r.name)}</h3><p>${esc(r.host.displayName)} · ${r.settings.targetChakra.toLocaleString("id")} chakra</p><span class="small">${r.settings.voiceEnabled ? "♫ Voice aktif · " : ""}${r.status === "playing" ? "Sedang bermain" : "Menunggu pemain"}</span></div><div class="room-join"><span>${r.memberCount}<small> / ${r.settings.capacity}</small></span><button data-join="${r.id}" ${!r.canJoin ? "disabled" : ""}>Gabung →</button></div></article>`,
        )
        .join("")
    : '<div class="empty"><span>◇</span><h3>Petualangan belum dimulai</h3><p>Buat room pertama dan ajak temanmu.</p></div>';
}
$("refresh-rooms").onclick = () => attempt(refreshRooms);
$("rooms").onclick = (event) => {
  const button = event.target.closest("[data-join]");
  if (button)
    attempt(async () => {
      button.disabled = true;
      try {
        const data = await api(`/rooms/${button.dataset.join}/join`, {
          method: "POST",
          body: {},
          idempotent: true,
        });
        setRoom(data.room, data.inviteCode);
      } finally {
        button.disabled = false;
      }
    });
};
$("create-room").onsubmit = (event) => {
  event.preventDefault();
  attempt(async () => {
    const v = Object.fromEntries(new FormData(event.target));
    const data = await api("/rooms", {
      method: "POST",
      idempotent: true,
      body: {
        name: v.name,
        visibility: v.visibility,
        settings: {
          arenaId: v.arena,
          capacity: +v.capacity,
          targetChakra: +v.target,
          rule: "normal",
          voiceEnabled: v.voice === "on",
        },
      },
    });
    setRoom(data.room, data.inviteCode);
  });
};
$("join-code").onsubmit = (event) => {
  event.preventDefault();
  attempt(async () => {
    const data = await api("/rooms/join-by-code", {
      method: "POST",
      idempotent: true,
      body: {
        inviteCode: event.target.elements.code.value.trim().toUpperCase(),
      },
    });
    setRoom(data.room, data.inviteCode);
  });
};

function setRoom(value, code) {
  if (room?.id === value.id && room.roomVersion > value.roomVersion) return;
  const changedRoom = room?.id !== value.id;
  if (changedRoom) {
    match = null;
    inviteCode = null;
    lastMatchID = null;
    board?.setState(null);
  }
  room = value;
  if (code) inviteCode = code;
  const me = room.members.find((m) => m.userId === session.user.id);
  if (me && (changedRoom || me.ready)) character = me.characterId;
  view("play");
  renderRoom();
  if (chatRoom !== room.id) {
    chatRoom = room.id;
    $("messages").innerHTML = "";
    attempt(async () => {
      const result = await api(`/rooms/${room.id}/messages?limit=50`);
      for (const m of result.items.slice().reverse()) addMessage(m);
    });
  }
  if (room.activeMatchId && match?.id !== room.activeMatchId)
    attempt(async () => setMatch(await api(`/matches/${room.activeMatchId}`)));
}
function renderRoom() {
  if (!room) return;
  document.body.classList.toggle("in-game", !!match);
  if (!match) {
    delete $("play").dataset.phase;
    visualBusy = false;
  }
  $("room-name").textContent = room.name;
  $("room-caption").textContent =
    `ARENA 01 / ${room.visibility === "private" ? "PRIVAT" : "PUBLIK"} / ${room.settings.targetChakra.toLocaleString("id")} CHAKRA`;
  $("waiting").hidden = room.status === "playing" || !!match;
  $("leave").disabled = !connected;
  $("leave").title =
    room.status === "playing"
      ? "Keluar room; CPU melanjutkan karaktermu."
      : "Keluar dari room";
  $("voice").disabled = voiceBusy || !room.settings.voiceEnabled || !connected;
  if (!room.settings.voiceEnabled && voiceOn) {
    leaveVoice();
    voiceOn = false;
    renderVoice();
  }
  const me = room.members.find((p) => p.userId === session.user.id);
  $("ready").disabled = !assetsReady || !connected || lobbyBusy;
  $("ready").textContent = !assetsReady
    ? "Memuat aset…"
    : me?.ready
      ? "Batalkan siap"
      : "Saya siap";
  $("characters")
    .querySelectorAll("button")
    .forEach((b) => {
      b.classList.toggle("selected", +b.dataset.character === character);
      b.disabled = !!me?.ready;
    });
  $("start").hidden = room.hostUserId !== session.user.id;
  $("start").disabled =
    lobbyBusy ||
    !connected ||
    room.members.length < 2 ||
    !room.members.every((m) => m.ready && m.connectionStatus === "connected");
  $("invite").innerHTML = inviteCode
    ? `<p class="fine">Kode undangan: <strong>${esc(inviteCode)}</strong></p>`
    : "";
  if (!match) {
    $("round").textContent = "MENUNGGU PEMAIN";
    $("players").innerHTML = room.members
      .map(
        (p) =>
          `<div class="player"><img src="${face(p.characterId)}" alt=""><div><strong>${esc(p.displayName)}</strong><span>${p.ready ? "✓ Siap" : p.connectionStatus === "connected" ? "Memilih karakter" : "Terputus"}</span></div></div>`,
      )
      .join("");
    $("controls").innerHTML =
      '<p class="eyebrow">SEBELUM BERANGKAT</p><h2>Siapkan timmu.</h2><p>Pilih karakter, tekan Saya siap, lalu tunggu host memulai pertandingan.</p>';
  } else renderMatch();
}
$("characters").onclick = (event) => {
  const b = event.target.closest("[data-character]");
  if (!b) return;
  character = +b.dataset.character;
  for (const e of $("characters").querySelectorAll("button"))
    e.classList.toggle("selected", e === b);
};
async function lobbyCommand(type, extra = {}) {
  const id = room.id;
  lobbyBusy = true;
  renderRoom();
  try {
    for (let retry = 0; retry < 5; retry++) {
      try {
        const ack = await socket.send(type, {
          roomId: id,
          expectedRoomVersion: room.roomVersion,
          ...extra,
        });
        if (
          type !== "room.leave" &&
          room?.id === id &&
          room.roomVersion < ack.roomVersion
        )
          setRoom(await api(`/rooms/${id}`), inviteCode);
        return ack;
      } catch (error) {
        if (error.code !== "VERSION_CONFLICT" || retry === 4) throw error;
        setRoom(await api(`/rooms/${id}`), inviteCode);
        await new Promise((resolve) => setTimeout(resolve, 50 * (retry + 1)));
      }
    }
  } finally {
    lobbyBusy = false;
    if (room?.id === id) renderRoom();
  }
}
$("ready").onclick = () =>
  attempt(async () => {
    const me = room.members.find((m) => m.userId === session.user.id);
    await lobbyCommand("room.ready", {
      ready: !me.ready,
      characterId: character,
      assetsReady,
      assetManifestHash: arenas.find((a) => a.id === room.settings.arenaId)
        .assetManifestHash,
    });
  });
$("start").onclick = () => attempt(() => lobbyCommand("room.start"));
$("leave").onclick = () =>
  attempt(async () => {
    await lobbyCommand("room.leave");
    room = null;
    match = null;
    await leaveVoice();
    voiceOn = false;
    renderVoice();
    view("lobby");
    await refreshRooms();
  });
$("sync").onclick = () =>
  attempt(async () => {
    if (match) setMatch(await api(`/matches/${match.id}`));
    setRoom(await api(`/rooms/${room.id}`), inviteCode);
    notice("State sudah disinkronkan.");
  });

function setMatch(value) {
  if (!session || (room && value.roomId !== room.id)) return;
  if (match?.id === value.id && value.stateVersion < match.stateVersion) return;
  if (
    match?.id === value.id &&
    value.stateVersion === match.stateVersion &&
    value.serverTick < match.serverTick
  )
    return;
  if (lastMatchID === value.id && !match) return;
  if (
    match?.id === value.id &&
    match.players.some((p, i) => p.position !== value.players[i]?.position)
  )
    sound("step");
  if (!match) notice("");
  match = value;
  matchReceivedAt = performance.now();
  updateAudio(value);
  localStorage.setItem(`naruto:lastMatch:${session.user.id}`, value.id);
  board?.setState(value);
  visualBusy = !!board?.isAnimating();
  renderRoom();
}
const phaseLabels = {
  roll: "Persiapan giliran",
  move: "Pilih jalur",
  chance: "Pilih kartu kesempatan",
  discard: "Pilih kartu untuk dibuang",
  cardTarget: "Pilih sasaran kartu",
  land: "Aksi petak",
  bonusUpgrade: "Bonus gerbang",
  upgrade: "Tingkatkan penghalang",
  forcedSale: "Jual penghalang",
  scrollTarget: "Sasaran gulungan",
  scrollRoll: "Roulette gulungan",
  attackCard: "Kartu serangan",
  defenseCard: "Kartu pertahanan",
  attack: "Pilih teknik serangan",
  defend: "Pilih teknik pertahanan",
  attackRoll: "Roulette serangan",
  defenseRoll: "Roulette pertahanan",
  end: "Giliran selesai",
  won: "Hasil pertandingan",
};
function renderMatch() {
  if (!match) return;
  $("play").dataset.phase = match.roulette
    ? "roulette"
    : match.presentation?.phase;
  $("play").classList.toggle("presenting", visualBusy);
  const self = match.players.find((p) => p.seat === match.self.seat),
    actor = match.players.find((p) => p.seat === match.presentation?.actorSeat),
    myTurn =
      actor?.seat === self.seat && self.controller.controllerKind === "human";
  $("round").textContent = `PUTARAN ${match.round}`;
  $("waiting").hidden = true;
  $("players").innerHTML = match.players
    .map(
      (p) =>
        `<div class="player ${p.seat === actor?.seat ? "active" : ""}"><img src="${face(p.characterId)}" alt="${names[p.characterId]}"><div><strong>${esc(p.displayName)}${p.seat === self.seat ? " · kamu" : ""}</strong><span><b>${p.chakra.toLocaleString("id")}</b> chakra</span><small>${p.skillPoints} SP · ◆ ${p.crystalTileIds.length}/${match.tiles.filter((t) => t.typeCode === 1).length} · ${p.controller.controllerKind === "cpu" ? "CPU" : p.controller.connectionStatus === "connected" ? "online" : "terputus"}</small>${p.hasScroll ? "<small>📜 Gulungan</small>" : ""}${p.possessed ? "<small>Kerasukan</small>" : ""}${p.skipNextTurn ? "<small>Lewati giliran berikutnya</small>" : ""}</div></div>`,
    )
    .join("");
  $("game-log").innerHTML = (match.presentation?.log ?? [])
    .map((l) => `<li>${esc(l)}</li>`)
    .join("");
  if (match.result) {
    $("controls").innerHTML =
      `<p class="eyebrow">PERTANDINGAN SELESAI</p><h2>${esc(match.result.description)}</h2><div class="results">${match.result.entries.map((e) => `<div><img src="/assets/image/results/badge_${e.badgeId}.png" alt="${e.badgeId === 3 ? "Terakhir" : `Peringkat ${e.badgeId + 1}`}"><img src="${face(e.characterId)}" alt=""><strong>${esc(match.players.find((p) => p.seat === e.seat).displayName)}</strong><span>${e.chakra} chakra</span></div>`).join("")}</div><button id="return-room" class="primary">Kembali ke room</button>`;
    $("return-room").onclick = () => {
      lastMatchID = match.id;
      match = null;
      board?.setState(null);
      stopGameAudio();
      renderRoom();
    };
    return;
  }
  if (match.status === "paused_error") {
    $("controls").innerHTML =
      "<h2>Pertandingan dijeda</h2><p>Server menyimpan state dan trace karena aturan tidak dapat diselesaikan. Periksa log pengujian sebelum melanjutkan.</p>";
    return;
  }
  const options = match.allowedActions.flatMap((a) => a.options);
  const phase = match.presentation?.phase;
  const wheelHint =
    match.roulette && options.some((o) => o.id === "stop" && o.enabled)
      ? '<p class="roulette-touch-hint">Sentuh roda untuk menghentikan rolet.</p>'
      : "";
  const button = (o) =>
    `<button data-option="${esc(o.id)}" ${!o.enabled || busy || visualBusy || !connected ? "disabled" : ""} class="${["roll", "stop", "end", "act:claim"].includes(o.id) ? "primary" : ""}">${esc(directionLabel(match, o))}${o.chakraCost !== undefined ? `<small>${o.chakraCost} chakra</small>` : ""}${o.skillPointCost !== undefined ? `<small>${o.skillPointCost} SP</small>` : ""}</button>`;
  let actions = options.map(button).join(""),
    cards = "";
  if (phase === "roll" && !match.roulette) {
    const extras = options.filter(
      (o) =>
        !["roll", "surrender", "surrender:yes", "surrender:no"].includes(o.id),
    );
    actions = options
      .filter((o) =>
        ["roll", "surrender", "surrender:yes", "surrender:no"].includes(o.id),
      )
      .map(button)
      .join("");
    if (extras.length)
      actions += `<details class="turn-menu"><summary>Kartu · Ninjutsu · Gulungan</summary><div>${extras.map(button).join("")}</div></details>`;
  }
  if (phase === "chance" && options.length) {
    const key = match.allowedActions[0]?.choiceId;
    if (key !== chanceKey) {
      chanceKey = key;
      selectedChance = 0;
    }
    selectedChance = Math.min(selectedChance, options.length - 1);
    cards = `<div class="chance-cards">${options.map((o, i) => `<button data-card-choice="${i}" aria-label="Lihat ${esc(o.label)}" aria-pressed="${i === selectedChance}" ${busy || visualBusy ? "disabled" : ""}><img src="/assets/image/cards/card_${String(o.cardId).padStart(2, "0")}.png" alt="${esc(o.label)}"></button>`).join("")}</div><p class="card-description">${esc(options[selectedChance].label)}</p>`;
    actions = button({ ...options[selectedChance], label: "Ambil kartu ini" });
  }
  const message =
    phase === "roll" && !match.roulette
      ? `Giliran ${actor?.displayName ?? "pemain"}. Putar roulette atau gunakan kemampuanmu.`
      : phase === "move"
        ? options.length > 1
          ? "Pilih arah perjalanan."
          : "Berjalan ke petak berikutnya…"
        : (match.presentation?.message ?? "");
  $("controls").innerHTML =
    `<div class="turn-heading"><div><p class="eyebrow">${myTurn ? "GILIRANMU" : `MENUNGGU ${esc(actor?.displayName ?? "PEMAIN")}`}</p><h2>${phaseLabels[phase] ?? "Permainan"}</h2></div></div>${wheelHint}<p class="game-message">${esc(message)}</p>${cards}${self.controller.controllerKind === "cpu" ? '<div class="takeover"><p>CPU sedang memainkan karaktermu.</p><button id="reclaim" class="primary">Ambil alih kontrol</button></div>' : ""}<div class="action-list">${actions}</div>`;
  $("controls")
    .querySelectorAll("[data-card-choice]")
    .forEach(
      (b) =>
        (b.onclick = () => {
          sound("cursor");
          selectedChance = +b.dataset.cardChoice;
          renderMatch();
        }),
    );
  $("reclaim")?.addEventListener("click", () =>
    attempt(() =>
      socket.send("match.reclaim", {
        matchId: match.id,
        expectedControlEpoch: self.controller.controlEpoch,
      }),
    ),
  );
  $("controls")
    .querySelectorAll("[data-option]")
    .forEach((b) => (b.onclick = () => choose(b.dataset.option)));
}
async function choose(optionID) {
  if (busy || !match || board?.isAnimating()) return;
  const allowed = match.allowedActions.find((a) =>
    a.options.some((o) => o.id === optionID && o.enabled),
  );
  if (!allowed) return;
  busy = true;
  renderMatch();
  sound(optionID === "stop" ? "stop" : "confirm");
  await attempt(async () => {
    try {
      const ack = await socket.send("match.command", {
        commandId: crypto.randomUUID(),
        matchId: match.id,
        expectedStateVersion: match.stateVersion,
        controlEpoch: match.players.find((p) => p.seat === match.self.seat)
          .controller.controlEpoch,
        action: {
          type: "choice.select",
          payload: { choiceId: allowed.choiceId, optionId: optionID },
        },
      });
      if (match.stateVersion < ack.stateVersion)
        setMatch(await api(`/matches/${match.id}`));
    } catch (error) {
      setMatch(await api(`/matches/${match.id}`));
      throw error;
    }
  });
  busy = false;
  renderMatch();
}
function addMessage(m) {
  if ($("messages").querySelector(`[data-message="${m.id}"]`)) return;
  const node = document.createElement("div");
  node.dataset.message = m.id;
  node.className = "message";
  const name = document.createElement("strong");
  name.textContent = m.sender?.displayName ?? "Room";
  const body = document.createElement("span");
  body.textContent = m.text;
  node.append(name, body);
  $("messages").append(node);
  while ($("messages").children.length > 100) $("messages").firstChild.remove();
  $("messages").scrollTop = $("messages").scrollHeight;
}
$("chat-form").onsubmit = (event) => {
  event.preventDefault();
  attempt(async () => {
    const text = event.target.elements.text.value.trim();
    if (!text) return;
    await socket.send("chat.send", {
      roomId: room.id,
      clientMessageId: crypto.randomUUID(),
      text,
    });
    event.target.reset();
  });
};
function renderVoice() {
  $("voice").disabled = voiceBusy || !room?.settings.voiceEnabled || !connected;
  $("voice").textContent = voiceOn ? "Keluar voice" : "♬ Gabung voice";
  $("mute").hidden = !voiceOn;
  $("mute").textContent = muted ? "Aktifkan mic" : "Bisukan mic";
  $("voice-note").textContent = voiceOn
    ? muted
      ? "Mikrofon dibisukan."
      : "Mikrofon aktif. Anggota room dapat mendengarmu."
    : "Mikrofon hanya aktif setelah kamu bergabung.";
}
$("voice").onclick = () =>
  attempt(async () => {
    if (voiceBusy || !room) return;
    voiceBusy = true;
    renderVoice();
    try {
      if (voiceOn) {
        await leaveVoice();
        voiceOn = false;
      } else {
        await joinVoice(room.id, (status) => {
          voiceOn = status;
          muted = false;
          renderVoice();
        });
      }
    } finally {
      voiceBusy = false;
      renderVoice();
    }
  });
$("mute").onclick = () =>
  attempt(async () => {
    await muteVoice(!muted);
    muted = !muted;
    renderVoice();
  });
function renderAudioButton() {
  const enabled = isAudioEnabled();
  $("music").setAttribute("aria-pressed", String(enabled));
  $("music").textContent = enabled ? "♫ Suara aktif" : "♫ Suara mati";
}
document.addEventListener("game-audio-change", renderAudioButton);
renderAudioButton();
$("music").onclick = () =>
  attempt(async () => {
    await toggleAudio(match);
    renderAudioButton();
  });

async function boot() {
  const token = new URLSearchParams(location.search).get("token");
  if (location.pathname === "/verify_email" && token) {
    await attempt(async () => {
      await api("/auth/verify-email", { method: "POST", body: { token } });
      notice("Email terverifikasi. Silakan masuk.");
    });
    history.replaceState(null, "", "/");
  }
  if (location.pathname === "/reset_password" && token) {
    $("auth-title").textContent = "Atur kata sandi baru";
    $("auth-form").elements.email.closest("label").hidden = true;
    $("auth-form").elements.email.required = false;
    $("auth-submit").textContent = "Simpan kata sandi";
    $("auth-toggle").hidden = true;
    $("forgot").hidden = true;
    $("auth-form").onsubmit = (e) => {
      e.preventDefault();
      attempt(async () => {
        await api("/auth/reset-password", {
          method: "POST",
          body: { token, newPassword: e.target.elements.password.value },
        });
        location.replace("/");
      });
    };
    return;
  }
  try {
    await enter(await api("/auth/me"));
  } catch (error) {
    if (error.status !== 401) notice(error.message, true);
    view("auth");
  }
}
boot();

// Presentation does not choose routes, cards, targets or roulette results.
function updatePresentation() {
  const presenting = !!board?.isAnimating();
  if (presenting !== visualBusy) {
    visualBusy = presenting;
    if (match) renderMatch();
  }
  const action = automaticAction(match);
  const delay = match?.presentation?.phase === "end" ? 1200 : 180;
  if (
    action &&
    !busy &&
    !presenting &&
    connected &&
    performance.now() - matchReceivedAt > delay
  ) {
    const key = `${match.id}:${match.stateVersion}:${action}`;
    if (key !== automaticKey) {
      automaticKey = key;
      choose(action);
    }
  }
  requestAnimationFrame(updatePresentation);
}
updatePresentation();
$("map-view").onclick = () => {
  $("map-view").textContent = board?.toggleOverview()
    ? "Ikuti karakter"
    : "Lihat peta";
};
$("fullscreen").onclick = () =>
  attempt(async () => {
    const stage = document.querySelector(".board-frame");
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (stage.requestFullscreen) await stage.requestFullscreen();
    else {
      document.body.classList.toggle("expanded-game");
      board?.resize();
    }
  });
document.addEventListener("fullscreenchange", () => board?.resize());
document.addEventListener("keydown", (event) => {
  if (
    !match ||
    /INPUT|TEXTAREA|SELECT|BUTTON/.test(event.target.tagName) ||
    event.target.isContentEditable
  )
    return;
  if (
    event.key === "Escape" &&
    document.body.classList.contains("expanded-game")
  ) {
    document.body.classList.remove("expanded-game");
    board?.resize();
    return;
  }
  const options = match.allowedActions
    .flatMap((a) => a.options)
    .filter((o) => o.enabled);
  if (
    match.presentation?.phase === "chance" &&
    ["ArrowLeft", "ArrowRight"].includes(event.key) &&
    options.length
  ) {
    event.preventDefault();
    selectedChance =
      (selectedChance + (event.key === "ArrowRight" ? 1 : options.length - 1)) %
      options.length;
    renderMatch();
    return;
  }
  const arrows = {
    ArrowUp: "↑",
    ArrowDown: "↓",
    ArrowLeft: "←",
    ArrowRight: "→",
  };
  let option;
  if (arrows[event.key])
    option = options.find(
      (o) =>
        o.id.startsWith("move:") &&
        directionLabel(match, o).startsWith(arrows[event.key]),
    );
  else if (event.key === " " || event.key === "Enter")
    option =
      match.presentation?.phase === "chance"
        ? options[selectedChance]
        : options.find((o) => ["roll", "stop", "end"].includes(o.id));
  if (option) {
    event.preventDefault();
    choose(option.id);
  }
});

$("stage-menu").onclick = () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else {
    document.body.classList.remove("expanded-game");
    document.body.classList.toggle("show-game-tools");
    board?.resize();
  }
};
