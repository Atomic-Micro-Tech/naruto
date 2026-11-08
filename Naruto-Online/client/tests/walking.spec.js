import { test, expect } from "@playwright/test";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import { execute } from "../../server/internal/game/source/online.js";

test("Phaser uses original directional walking frames and reaches each destination", async ({ page }) => {
  // Test harness only: inspect real Phaser sprites without adding production hooks.
  const bundle = await build({ stdin: { contents: `
    import Phaser from 'phaser';
    import { createBoard } from './src/board.js';
    const boot = Phaser.Game.prototype.boot;
    Phaser.Game.prototype.boot = function () { window.testGame = this; return boot.call(this); };
    window.testBoard = await createBoard(document.getElementById('board'), () => {});
  `, resolveDir: fileURLToPath(new URL("..", import.meta.url)) },
  bundle: true, write: false, format: "esm", minify: true });
  await page.route("**/__walking__/**", route => route.fulfill(
    route.request().url().endsWith("board.js")
      ? { contentType: "text/javascript", body: bundle.outputFiles[0].text }
      : { contentType: "text/html", body: '<div id="board" style="width:640px;height:480px"></div><script type="module" src="./board.js"></script>' }));
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  const engine = execute({ seed: 12345, roster: [{ characterId: 0, name: "Naruto" },
    { characterId: 1, name: "Sasuke" }], target: 3000, tick: 0, choiceId: "c1" });
  await page.goto("/__walking__/");
  await page.waitForFunction(() => !!window.testBoard);
  const result = await page.evaluate(async publicState => {
    const metadata = await (await fetch("/assets/sprite/board-characters/characters.json")).json();
    const snapshot = { ...publicState, id: "walking", stateVersion: 1, status: "playing",
      roulette: null, allowedActions: [], players: publicState.players.map((p, i) =>
        ({ ...p, position: i ? 5 : 0, controller: { controllerKind: "human" } })),
      presentation: { phase: "move", actorSeat: 0, remaining: 8 } };
    const scene = window.testGame.scene.scenes[0];
    window.testGame.loop.sleep();
    window.testBoard.setState(snapshot);
    scene.update(0, 16);
    const samples = [];
    for (const [destination, expected] of [[1, 12], [0, 11], [21, 10], [0, 9]]) {
      snapshot.players[0].position = destination;
      snapshot.stateVersion++;
      window.testBoard.setState(structuredClone(snapshot));
      const frames = [];
      for (let tick = 0; tick < 6; tick++) {
        scene.update(0, 20);
        const sprite = scene.children.list.find(s => s.texture?.key.startsWith("actor-0-"));
        frames.push({ texture: sprite.texture.key, frame: sprite.frame.name });
      }
      scene.update(0, 100);
      scene.update(0, 16);
      const sprite = scene.children.list.find(s => s.texture?.key.startsWith("actor-0-"));
      // At rest the first idle frame's source offsets anchor its feet to the tile.
      const idle = metadata.characters[0].animations.find(a => a.id === 22);
      const frame = idle.sequence[0];
      samples.push({ expected, frames, texture: sprite.texture.key,
        x: sprite.x + idle.anchorX - frame.offsetX,
        y: sprite.y + idle.anchorY - frame.offsetY,
        destination: snapshot.tiles[destination] });
    }
    return samples;
  }, engine.public);
  for (const sample of result) {
    expect(sample.frames.every(f => f.texture === `actor-0-${sample.expected}`)).toBe(true);
    expect(new Set(sample.frames.map(f => f.frame)).size).toBeGreaterThan(1);
    expect(sample.texture).toBe("actor-0-22");
    expect(sample.x).toBeCloseTo(sample.destination.x);
    expect(sample.y).toBeCloseTo(sample.destination.y);
  }
  await page.evaluate(() => window.testGame.loop.wake());
  await page.waitForTimeout(50);
  await page.locator("canvas").screenshot({ path: "test-results/walking-destination.png" });
  expect(errors).toEqual([]);
  await page.evaluate(() => window.testBoard.destroy());
});
