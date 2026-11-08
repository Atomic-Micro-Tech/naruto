import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("original roulette digits fade without changing the selected sector or popping at freeze", async ({ page }) => {
  const modules = new Map(await Promise.all(
    ["roulette", "roulette-shuriken", "presentation"].map(async name =>
      [name, await readFile(new URL(`../src/${name}.js`, import.meta.url), "utf8")]),
  ));
  await page.route("**/__roulette__/**", async route => {
    const name = new URL(route.request().url()).pathname.split("/").at(-1);
    await route.fulfill(name
      ? { contentType: "text/javascript", body: modules.get(name) }
      : { contentType: "text/html", body: '<body style="margin:0;background:#10251c;display:flex"></body>' });
  });
  await page.setViewportSize({ width: 960, height: 240 });
  await page.goto("/__roulette__/");
  const pixels = await page.evaluate(async () => {
    const { createRouletteRenderer } = await import("/__roulette__/roulette");
    const { rouletteStopPlan, rouletteStopFrame } = await import("/__roulette__/presentation");
    const { SHURIKEN_ATLAS } = await import("/__roulette__/roulette-shuriken");
    const common = await (await fetch("/assets/sprite/common/assets.json")).json();
    const sources = common.assets.filter(a => a.id.startsWith("roulette_")).map(a => [a.id, `/assets/sprite/common/${a.file}`]);
    sources.push(["roulette-shuriken-atlas", SHURIKEN_ATLAS]);
    const images = new Map(await Promise.all(sources.map(async ([key, url]) => {
      const img = new Image();
      img.src = url;
      await img.decode();
      return [key, img];
    })));
    const render = createRouletteRenderer(key => images.get(key), common.rouletteGeometry);
    // Duplicate values must fade too: selection is a sector, not a number value.
    const faces = Array(12).fill(5), plan = rouletteStopPlan(1600, faces, 5);
    const snapshots = [];
    const frames = [
      { result: null, otherNumbersOpacity: 1 },
      { result: 5, ...rouletteStopFrame(plan, plan.duration) },
      { result: 5, ...rouletteStopFrame(plan, plan.fadeStart + plan.fadeDuration / 2) },
      { result: 5, ...rouletteStopFrame(plan, plan.fadeStart + plan.fadeDuration) },
      { result: 5, otherNumbersOpacity: 0 },
    ];
    for (const [i, frame] of frames.entries()) {
      const canvas = document.createElement("canvas");
      canvas.width = 320; canvas.height = 240;
      const ctx = canvas.getContext("2d");
      render(ctx, plan.target, faces, { ...frame, index: plan.index, jolt: 0, flash: 0 });
      snapshots.push(ctx.getImageData(0, 0, 320, 240).data);
      if (i > 0 && i < 4) document.body.append(canvas);
    }
    const difference = (a, b, x0 = 0, x1 = 320, y0 = 0, y1 = 240) => {
      let total = 0;
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
        const p = (y * 320 + x) * 4;
        for (let c = 0; c < 4; c++) total += Math.abs(a[p + c] - b[p + c]);
      }
      return total;
    };
    return {
      freezeChange: difference(snapshots[0], snapshots[1]),
      selectedChange: difference(snapshots[1], snapshots[3], 108, 138, 108, 140),
      initial: difference(snapshots[1], snapshots[4]),
      middle: difference(snapshots[2], snapshots[4]),
      end: difference(snapshots[3], snapshots[4]),
    };
  });
  expect(pixels.freezeChange).toBe(0);
  expect(pixels.selectedChange).toBe(0);
  expect(pixels.initial).toBeGreaterThan(10000);
  expect(pixels.middle / pixels.initial).toBeGreaterThan(0.45);
  expect(pixels.middle / pixels.initial).toBeLessThan(0.6);
  expect(pixels.end / pixels.initial).toBeLessThan(0.05);
  await page.screenshot({ path: "test-results/roulette-number-fade.png" });
});
