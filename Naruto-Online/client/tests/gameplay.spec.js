import { test, expect } from "@playwright/test";
import { appendFileSync } from "node:fs";

test("two browsers: register, lobby, chat, play, CPU takeover, reclaim, results and rematch", async ({
  browser,
}) => {
  const contexts = [
    await browser.newContext({ viewport: { width: 1440, height: 1000 } }),
    await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    }),
  ];
  const pages = await Promise.all(contexts.map((c) => c.newPage()));
  const failures = [];
  function observe(p) {
    p.on("pageerror", (e) => failures.push(e.message));
    p.on("response", (r) => {
      if (r.url().includes("/assets/") && r.status() >= 400)
        failures.push(`${r.status()} ${r.url()}`);
    });
    if (process.env.NARUTO_CONTRACT_CAPTURE)
      p.on("websocket", (ws) => {
        if (!ws.url().includes("/v1/ws?")) return;
        ws.on("framereceived", (frame) =>
          appendFileSync(
            process.env.NARUTO_CONTRACT_CAPTURE,
            JSON.stringify({
              kind: "ws",
              body: JSON.parse(String(frame.payload)),
            }) + "\n",
            { mode: 0o600 },
          ),
        );
      });
  }
  for (const p of pages) observe(p);
  const nonce = Date.now(),
    roomName = `E2E Konoha ${nonce}`;
  async function register(p, index) {
    await p.goto("/");
    await p.locator("#auth-toggle").click();
    await p.locator("[name=displayName]").fill(`Shinobi ${index}`);
    await p.locator("[name=email]").fill(`play-${nonce}-${index}@example.test`);
    await p.locator("[name=password]").fill("SyntheticPassword!123");
    await p.locator("#auth-submit").click();
    await expect(p.locator("#lobby")).toBeVisible();
    await expect(p.locator("#connection")).toContainText("TERHUBUNG");
  }
  try {
    await register(pages[0], 0);
    await register(pages[1], 1);
    await pages[0].screenshot({
      path: "test-results/lobby-desktop.png",
      fullPage: true,
    });
    await pages[0].locator("#create-room [name=name]").fill(roomName);
    await pages[0].locator("#create-room [name=capacity]").selectOption("2");
    if (process.env.NARUTO_TEST_VOICE === "1")
      await pages[0].locator("#create-room [name=voice]").check();
    await pages[0].locator("#create-room button").click();
    await expect(pages[0].locator("#room-name")).toHaveText(roomName);
    await pages[1].locator("#refresh-rooms").click();
    await pages[1]
      .locator(".room-row")
      .filter({ hasText: roomName })
      .getByRole("button", { name: "Gabung" })
      .click();
    await expect(pages[1].locator("#room-name")).toHaveText(roomName);
    await pages[1].locator('[data-character="2"]').click();
    await expect(pages[0].locator("#ready")).toBeEnabled();
    await expect(pages[1].locator("#ready")).toBeEnabled();
    await pages[0].locator("#ready").click();
    await pages[1].locator("#ready").click();
    await expect(pages[0].locator("#start")).toBeEnabled();
    await pages[1].locator("#chat-form input").fill("Siap bermain!");
    await pages[1].locator("#chat-form button").click();
    await expect(pages[0].locator("#messages")).toContainText("Siap bermain!");
    if (process.env.NARUTO_TEST_VOICE === "1") {
      for (const p of pages) {
        await p.locator("#voice").click();
        await expect(p.locator("#voice-note")).toContainText("Mikrofon aktif", {
          timeout: 20000,
        });
      }
      for (const p of pages)
        await expect(p.locator("audio[data-voice-user]")).toHaveCount(1, {
          timeout: 20000,
        });
      await pages[0].locator("#mute").click();
      await expect(pages[0].locator("#voice-note")).toHaveText(
        "Mikrofon dibisukan.",
      );
      for (const p of pages) {
        await p.locator("#voice").click();
        await expect(p.locator("#mute")).toBeHidden();
      }
    }
    await pages[0].locator("#start").click();
    await expect(pages[0].locator('[data-option="roll"]')).toBeVisible({
      timeout: 20000,
    });
    await expect(pages[1].locator("#waiting")).toBeHidden();
    await expect(pages[1].locator("#players")).toContainText("chakra");
    await pages[0].screenshot({
      path: "test-results/game-desktop.png",
      fullPage: true,
    });
    await pages[1].screenshot({
      path: "test-results/game-mobile.png",
      fullPage: true,
    });
    await pages[0].locator('[data-option="roll"]').click();
    await expect(pages[0].locator('[data-option="stop"]')).toBeVisible();
    await pages[0].locator('[data-option="stop"]').click();
    await expect(pages[0].locator(".action-list button")).not.toHaveCount(0);
    // Finishing this turn exercises real movement/card/tile choices rather than a fake state.
    for (let i = 0; i < 35; i++) {
      const buttons = pages[0].locator(".action-list button:enabled:visible");
      if ((await buttons.count()) === 0) break;
      const preferred = pages[0].locator(
        '[data-option="end"], [data-option="act:claim"], [data-option="act:end"], [data-option="cancelUpgrade"]',
      );
      const target = (await preferred.count())
        ? preferred.first()
        : buttons.first();
      await target.click({ timeout: 1500 }).catch((error) => {
        if (!error.message.includes("Timeout")) throw error;
      });
      await pages[0].waitForTimeout(200);
      if (await pages[1].locator(".action-list button:enabled:visible").count())
        break;
    }
    const state = await contexts[1].storageState();
    await contexts[1].close();
    await expect(pages[0].locator("#players")).toContainText("CPU", {
      timeout: 12000,
    });
    contexts[1] = await browser.newContext({
      storageState: state,
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    pages[1] = await contexts[1].newPage();
    observe(pages[1]);
    await pages[1].goto("/");
    await expect(pages[1].locator("#reclaim")).toBeVisible({ timeout: 15000 });
    await pages[1].locator("#reclaim").click();
    await expect(pages[1].locator("#reclaim")).toHaveCount(0);
    // Advance to a pre-roll menu and test the explicit surrender confirmation/results path.
    for (let i = 0; i < 100; i++) {
      let done = false;
      for (const p of pages) {
        if (await p.locator('[data-option="surrender"]').count()) {
          await p.locator('[data-option="surrender"]').click();
          await expect(
            p.locator('[data-option="surrender:yes"]'),
          ).toBeVisible();
          await p.locator('[data-option="surrender:yes"]').click();
          done = true;
          break;
        }
        const action = p.locator(".action-list button:enabled:visible").first();
        if (await action.count()) {
          await action.click({ timeout: 1500 }).catch((error) => {
            if (!error.message.includes("Timeout")) throw error;
          });
          await p.waitForTimeout(150);
        }
      }
      if (done) break;
      await pages[0].waitForTimeout(100);
    }
    for (const p of pages) {
      await expect(p.locator("#return-room")).toBeVisible({ timeout: 15000 });
      await p.locator("#return-room").click();
      await expect(p.locator("#ready")).toHaveText("Saya siap");
    }
    await pages[0].locator("#ready").click();
    await pages[1].locator("#ready").click();
    await expect(pages[0].locator("#start")).toBeEnabled();
    await pages[0].locator("#start").click();
    await expect(pages[0].locator('[data-option="roll"]')).toBeVisible();
    const overflow = await pages[1].evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    );
    expect(overflow).toBe(false);
    expect(failures).toEqual([]);
  } finally {
    for (const c of contexts) await c.close().catch(() => {});
  }
});

test("four players can ready simultaneously and receive the same match", async ({
  browser,
}) => {
  const contexts = await Promise.all(
    Array.from({ length: 4 }, () =>
      browser.newContext({
        viewport: { width: 430, height: 932 },
        isMobile: true,
        hasTouch: true,
      }),
    ),
  );
  const pages = await Promise.all(contexts.map((c) => c.newPage()));
  const nonce = Date.now(),
    roomName = `Four shinobi ${nonce}`;
  try {
    for (const [i, p] of pages.entries()) {
      await p.goto("/");
      await p.locator("#auth-toggle").click();
      await p.locator("[name=displayName]").fill(`Player ${i}`);
      await p.locator("[name=email]").fill(`four-${nonce}-${i}@example.test`);
      await p.locator("[name=password]").fill("SyntheticPassword!123");
      await p.locator("#auth-submit").click();
      await expect(p.locator("#lobby")).toBeVisible();
      await expect(p.locator("#connection")).toContainText("TERHUBUNG");
    }
    await pages[0].locator("#create-room [name=name]").fill(roomName);
    await pages[0].locator("#create-room button").click();
    await expect(pages[0].locator("#room-name")).toHaveText(roomName);
    for (let i = 1; i < 4; i++) {
      await pages[i].locator("#refresh-rooms").click();
      await pages[i]
        .locator(".room-row")
        .filter({ hasText: roomName })
        .getByRole("button", { name: "Gabung" })
        .click();
      await expect(pages[i].locator("#room-name")).toHaveText(roomName);
      await pages[i].locator(`[data-character="${i}"]`).click();
    }
    await Promise.all(
      pages.map(async (p) => {
        await expect(p.locator("#ready")).toBeEnabled();
        await p.locator("#ready").click();
      }),
    );
    await expect(pages[0].locator("#start")).toBeEnabled({ timeout: 10000 });
    await pages[0].locator("#start").click();
    for (const p of pages) {
      await expect(p.locator("#players .player")).toHaveCount(4);
      await expect(p.locator("#waiting")).toBeHidden();
    }
    await pages[0].locator('[data-option="surrender"]').click();
    await pages[0].locator('[data-option="surrender:yes"]').click();
    for (const p of pages) {
      await expect(p.locator(".results > div")).toHaveCount(4);
      await p.locator("#return-room").click();
    }
    for (const p of pages) {
      await p.locator("#leave").click();
      await expect(p.locator("#lobby")).toBeVisible();
      await p.locator("#logout").click();
      await expect(p.locator("#auth")).toBeVisible();
      await expect(p.locator("#logout")).toBeHidden();
    }
  } finally {
    for (const context of contexts) await context.close();
  }
});
