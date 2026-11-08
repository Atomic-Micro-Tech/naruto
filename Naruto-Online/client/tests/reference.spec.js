import { test, expect } from "@playwright/test";
import { execute } from "../../server/internal/game/source/online.js";

test.use({ hasTouch: true });

// Synthetic transport fixtures isolate presentation. The separate gameplay suite uses real Go/PG.
test("reference presentation: roulette, direction, three cards, purchase and mobile landscape", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.__rouletteAudio = [];
    const start = AudioBufferSourceNode.prototype.start,
      stop = AudioBufferSourceNode.prototype.stop;
    let next = 0;
    AudioBufferSourceNode.prototype.start = function (when = 0, ...args) {
      this.testID = ++next;
      const samples = this.buffer?.getChannelData(0) ?? [];
      let peak = 0;
      for (const v of samples) peak = Math.max(peak, Math.abs(v));
      window.__rouletteAudio.push({
        kind: "start",
        id: this.testID,
        loop: this.loop,
        loopEnd: this.loopEnd,
        duration: this.buffer?.duration,
        when,
        peak,
      });
      return start.call(this, when, ...args);
    };
    AudioBufferSourceNode.prototype.stop = function (when = 0) {
      window.__rouletteAudio.push({ kind: "stop", id: this.testID, when });
      return stop.call(this, when);
    };
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.url().includes("/assets/") && r.status() >= 400) errors.push(r.url());
  });
  const user = { id: "u0", displayName: "Naruto" },
    session = { user, csrfToken: "synthetic" };
  const room = {
    id: "r0",
    name: "Konoha · Referensi video",
    visibility: "public",
    hostUserId: "u0",
    status: "playing",
    activeMatchId: "m0",
    stateVersion: 1,
    settings: {
      arenaId: "arena1",
      capacity: 2,
      targetChakra: 3000,
      voiceEnabled: false,
    },
    members: [0, 1].map((i) => ({
      userId: `u${i}`,
      displayName: ["Naruto", "Sasuke"][i],
      characterId: i,
      seat: i,
      ready: true,
      connectionStatus: "connected",
    })),
  };
  let version = 1,
    socket,
    current,
    commands = [];
  let engine = execute({
    seed: 12345,
    roster: [
      { characterId: 0, name: "Naruto" },
      { characterId: 1, name: "Sasuke" },
    ],
    target: 3000,
    tick: 0,
    choiceId: "c1",
  });
  function snapshot(result) {
    return {
      ...result.public,
      id: "m0",
      roomId: "r0",
      arenaId: "arena1",
      status: "playing",
      stateVersion: version,
      eventSequence: version,
      serverTick: 0,
      self: result.privateBySeat[0],
      allowedActions: result.allowedBySeat[0],
      players: result.public.players.map((p, i) => ({
        ...p,
        userId: `u${i}`,
        displayName: ["Naruto", "Sasuke"][i],
        controller: {
          seat: i,
          userId: `u${i}`,
          participantKind: "human",
          controllerKind: "human",
          controlEpoch: 1,
          connectionStatus: "connected",
        },
      })),
    };
  }
  current = snapshot(engine);
  await page.route("**/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    let data =
      path === "/v1/auth/me"
        ? session
        : path === "/v1/arenas"
          ? { items: [{ id: "arena1", assetManifestHash: "test" }] }
          : path === "/v1/ws-ticket"
            ? { path: "/v1/ws", ticket: "test", protocol: "naruto.v1" }
            : path === "/v1/rooms"
              ? { items: [] }
              : path.endsWith("/messages")
                ? { items: [] }
                : path.startsWith("/v1/matches/")
                  ? current
                  : room;
    await route.fulfill({ json: { data } });
  });
  await page.routeWebSocket("**/v1/ws?*", (ws) => {
    socket = ws;
    ws.onMessage((raw) => {
      const message = JSON.parse(raw);
      commands.push(message);
      ws.send(
        JSON.stringify({
          type: "command.ack",
          payload: { requestId: message.requestId, stateVersion: version },
        }),
      );
    });
    ws.send(JSON.stringify({ type: "connection.ready", payload: {} }));
    ws.send(JSON.stringify({ type: "room.snapshot", payload: { room } }));
  });
  const send = async (result) => {
    version++;
    current = snapshot(result);
    socket.send(JSON.stringify({ type: "match.snapshot", payload: current }));
    await expect(page.locator("#play")).toHaveAttribute(
      "data-phase",
      current.roulette ? "roulette" : current.presentation.phase,
    );
  };
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await expect(page.locator('[data-option="roll"]')).toBeEnabled();
  await page
    .locator(".board-frame")
    .screenshot({ path: "test-results/reference-board.png" });
  // A normal game gesture unlocks the original WAV effects without a separate music click.
  await page.locator("#map-view").click();
  await page.locator("#map-view").click();
  engine = execute({
    mode: "command",
    state: engine.engine,
    seat: 0,
    option: "roll",
    tick: 0,
    choiceId: "c2",
  });
  await send(engine);
  await page.waitForTimeout(250);
  await page
    .locator(".board-frame")
    .screenshot({ path: "test-results/reference-roulette.png" });
  await expect(page.locator('[data-option="stop"]')).toBeEnabled();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.__rouletteAudio.filter((e) => e.kind === "start" && e.loop)
            .length,
      ),
    )
    .toBe(1);
  await page.locator("#music").click();
  await expect(page.locator("#music")).toHaveAttribute("aria-pressed", "false");
  await page.locator("#music").click();
  await expect(page.locator("#music")).toHaveAttribute("aria-pressed", "true");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.__rouletteAudio.filter((e) => e.kind === "start" && e.loop)
            .length,
      ),
    )
    .toBe(2);

  const touchWheel = async (x = 90, y = 124) => {
    const box = await page.locator("#board canvas").boundingBox();
    await page.touchscreen.tap(box.x + box.width * x / 320, box.y + box.height * y / 240);
  };
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(150);
  const beforeTouch = commands.length;
  await touchWheel(250, 90);
  await page.waitForTimeout(100);
  expect(commands).toHaveLength(beforeTouch);
  await touchWheel();
  await expect.poll(() => commands.length).toBe(beforeTouch + 1);
  expect(commands.at(-1).payload.action.payload.optionId).toBe("stop");
  // A branch must wait for the player, a single direction must advance on its own.
  const movement = structuredClone(engine);
  movement.public.roulette = null;
  movement.public.presentation = {
    ...movement.public.presentation,
    phase: "move",
    remaining: 2,
    lastRoll: 2,
  };
  movement.allowedBySeat[0] = [
    {
      type: "choice.select",
      choiceId: "move",
      options: [
        { id: "move:1", label: "petak 2", tileId: 1, enabled: true },
        { id: "move:21", label: "petak 22", tileId: 21, enabled: true },
      ],
    },
  ];
  await send(movement);
  await page.waitForTimeout(900);
  await page.locator(".board-frame").screenshot({ path: "test-results/reference-shuriken.png" });
  await expect(page.locator("#play")).not.toHaveClass(/presenting/);
  await page.setViewportSize({ width: 1280, height: 900 });
  const audioEvents = await page.evaluate(() => window.__rouletteAudio);
  const hits = audioEvents.filter(
    (e) => e.kind === "start" && Math.abs(e.duration - 0.27743764) < 0.001,
  );
  expect(hits).toHaveLength(3);
  expect(hits[1].when - hits[0].when).toBeCloseTo(1 / 30, 4);
  expect(hits[2].when - hits[1].when).toBeCloseTo(1 / 30, 4);
  expect(
    audioEvents.filter((e) => e.kind === "start").every((e) => e.peak > 0.01),
  ).toBe(true);
  const branchCount = commands.length;
  await page.waitForTimeout(250);
  expect(commands).toHaveLength(branchCount);
  await page
    .locator(".board-frame")
    .screenshot({ path: "test-results/reference-direction.png" });
  movement.allowedBySeat[0][0].options.pop();
  await send(movement);
  await expect.poll(() => commands.length).toBeGreaterThan(branchCount);
  expect(commands.at(-1).payload.action.payload.optionId).toBe("move:1");
  const chance = structuredClone(movement);
  chance.public.presentation.phase = "chance";
  chance.allowedBySeat[0][0] = {
    type: "choice.select",
    choiceId: "cards",
    options: [8, 20, 40].map((cardId, i) => ({
      id: `chance:${i}`,
      label: `Kartu ${cardId + 1}: kartu uji`,
      cardId,
      enabled: true,
    })),
  };
  await send(chance);
  await expect(page.locator(".chance-cards img")).toHaveCount(3);
  await page.locator('[data-card-choice="1"]').click();
  await expect(page.locator('[data-card-choice="1"]')).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page
    .locator(".board-frame")
    .screenshot({ path: "test-results/reference-cards.png" });
  await page.locator('[data-option="chance:1"]').click();
  expect(commands.at(-1).payload.action.payload.optionId).toBe("chance:1");
  const land = structuredClone(movement);
  land.public.presentation = {
    ...land.public.presentation,
    phase: "land",
    remaining: 0,
    message: "Pasang penghalang di petak ini?",
  };
  land.allowedBySeat[0][0] = {
    type: "choice.select",
    choiceId: "land",
    options: [
      {
        id: "act:claim",
        label: "Pasang penghalang",
        chakraCost: 120,
        enabled: true,
      },
      { id: "act:end", label: "Lewati", enabled: true },
    ],
  };
  await send(land);
  await expect(page.locator('[data-option="act:claim"]')).toContainText(
    "120 chakra",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .locator(".board-frame")
    .screenshot({ path: "test-results/reference-purchase-mobile.png" });
  const beforeBuy = commands.length;
  await page.waitForTimeout(300);
  expect(commands).toHaveLength(beforeBuy);
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(100);
  await page
    .locator(".board-frame")
    .screenshot({ path: "test-results/reference-landscape.png" });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  await page.setViewportSize({ width: 1280, height: 900 });
  // Spectators also hear the CPU/opponent wheel; leaving must cancel its loop.
  const opponent = structuredClone(engine);
  opponent.public.roulette.actorSeat = 1;
  opponent.public.presentation.actorSeat = 1;
  opponent.allowedBySeat[0] = [];
  const beforeLoop = await page.evaluate(
    () =>
      window.__rouletteAudio.filter((e) => e.kind === "start" && e.loop).length,
  );
  await send(opponent);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.__rouletteAudio.filter((e) => e.kind === "start" && e.loop)
            .length,
      ),
    )
    .toBe(beforeLoop + 1);
  await page.waitForTimeout(250);
  const beforeOpponentTouch = commands.length;
  await touchWheel();
  await page.waitForTimeout(100);
  expect(commands).toHaveLength(beforeOpponentTouch);
  const loopID = await page.evaluate(
    () =>
      window.__rouletteAudio.filter((e) => e.kind === "start" && e.loop).at(-1)
        .id,
  );
  await page.locator("#logout").click();
  await expect(page.locator("#auth")).toBeVisible();
  expect(
    await page.evaluate(
      (id) =>
        window.__rouletteAudio.some((e) => e.kind === "stop" && e.id === id),
      loopID,
    ),
  ).toBe(true);
  const count = await page.evaluate(() => window.__rouletteAudio.length);
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => window.__rouletteAudio.length)).toBe(count);
  expect(errors).toEqual([]);
});
