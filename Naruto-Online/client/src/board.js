import Phaser from "phaser";
import {
  createBoardCamera,
  beginCameraPan,
  stepCameraPan,
  cameraPixels,
  boardWalkPlan,
  boardHudPositions,
} from "./native-camera";
import { createRouletteRenderer } from "./roulette";
import { updateRouletteAudio } from "./audio";
import {
  wheelAngle,
  rouletteStopPlan,
  rouletteStopFrame,
} from "./presentation";

export async function createBoard(parent, onTile) {
  const response = await fetch(
    "/assets/sprite/board-characters/characters.json",
  );
  if (!response.ok) throw new Error("Metadata karakter tidak tersedia.");
  const metadata = await response.json();
  const mapResponse = await fetch("/assets/image/arena1/map_00.json");
  if (!mapResponse.ok) throw new Error("Data arena tidak tersedia.");
  const boardData = await mapResponse.json();
  const commonResponse = await fetch("/assets/sprite/common/assets.json");
  if (!commonResponse.ok) throw new Error("Metadata UI tidak tersedia.");
  const common = await commonResponse.json();
  let scene, readyResolve, readyReject;
  let camera = createBoardCamera({ width: 640, height: 480 }),
    cameraClock = 0;
  let receivedAt = 0,
    animatingUntil = 0,
    previousTurn = null,
    overview = false;
  let hud = [],
    wheelTexture,
    wheelImage,
    shade,
    heldWheel = null,
    wheelUntil = 0,
    wheelEnteredAt = 0,
    uiCamera,
    renderWheel,
    displayedAngle = 0,
    angleCorrection = 0;
  const ready = new Promise((resolve, reject) => {
    readyResolve = resolve;
    readyReject = reject;
  });
  let state = null,
    actors = [],
    overlays = [],
    marks = [];
  class Arena extends Phaser.Scene {
    preload() {
      this.load.on("loaderror", (file) =>
        readyReject(new Error(`Aset gagal dimuat: ${file.key}`)),
      );
      this.load.image("arena", "/assets/image/arena1/map_00.png");
      for (const a of common.assets.filter(
        (a) =>
          a.id.startsWith("roulette_") ||
          a.id.startsWith("arrow_") ||
          a.id.startsWith("digits_style0_"),
      ))
        this.load.image(a.id, `/assets/sprite/common/${a.file}`);
      for (let i = 0; i < 4; i++) {
        this.load.image(
          `face${i}`,
          `/assets/sprite/common/character_0${i}_face.png`,
        );
        this.load.image(
          `name${i}`,
          `/assets/sprite/common/character_0${i}_name.png`,
        );
        this.load.image(
          `panel${i}`,
          `/assets/sprite/hud/panel_player_${i}.png`,
        );
      }
      for (let i = 0; i < 5; i++)
        this.load.image(
          `hud-crystal${i}`,
          `/assets/sprite/hud/crystal_${i}.png`,
        );
      this.load.image("hud-scroll", "/assets/sprite/hud/scroll.png");
      for (const key of [
        "source",
        "chance",
        "vacant",
        "link_dot",
        "crystal_0",
        "crystal_1",
        "crystal_2",
        "crystal_3",
        "damaged",
      ])
        this.load.image(key, `/assets/sprite/board/${key}.png`);
      for (let p = 0; p < 4; p++)
        for (let level = 1; level <= 5; level++)
          this.load.image(
            `barrier-${p}-${level}`,
            `/assets/sprite/board/barrier_p${p}_level${level}.png`,
          );
      for (const character of metadata.characters.filter((c) => c.id < 4)) {
        for (const anim of character.animations.filter((a) =>
          [9, 10, 11, 12, 22].includes(a.id),
        ))
          this.load.spritesheet(
            `actor-${character.id}-${anim.id}`,
            `/assets/sprite/board-characters/${anim.sprite}`,
            { frameWidth: anim.frameWidth, frameHeight: anim.frameHeight },
          );
      }
    }
    create() {
      scene = this;
      this.add.image(320, 240, "arena");
      this.cameras.main.setScroll(160, 120);
      uiCamera = this.cameras.add(0, 0, 320, 240);
      shade = this.add
        .rectangle(0, 0, 320, 240, 0x000000, 0.6)
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(2000)
        .setVisible(false);
      wheelTexture = this.textures.createCanvas("wheel-live", 320, 240);
      renderWheel = createRouletteRenderer(
        (key) => this.textures.get(key).getSourceImage(),
        common.rouletteGeometry,
      );
      wheelImage = this.add
        .image(0, 0, "wheel-live")
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(2001)
        .setVisible(false);
      draw();
      readyResolve();
    }
    update(_, delta) {
      const now = performance.now();
      cameraClock += Math.min(delta, 100);
      while (cameraClock >= 1000 / 60) {
        camera = stepCameraPan(camera);
        cameraClock -= 1000 / 60;
      }
      if (!overview) {
        const p = cameraPixels(camera);
        this.cameras.main.setScroll(p.x, p.y);
      }
      const wheel = state?.roulette ?? (now < wheelUntil ? heldWheel : null);
      shade.setVisible(!!wheel);
      wheelImage.setVisible(!!wheel);
      if (wheel) {
        const settling = !state?.roulette;
        const frame = settling
          ? rouletteStopFrame(heldWheel.plan, now - heldWheel.stoppedAt)
          : null;
        const angle = settling
          ? frame.angle
          : wheelAngle(state, now - receivedAt) +
            angleCorrection * Math.exp(-(now - receivedAt) / 120);
        displayedAngle = ((angle % 4096) + 4096) % 4096;
        const entry = Math.min(1, (now - wheelEnteredAt) / 240);
        wheelImage.setX(-180 * ((1 - entry) ** 3 + (frame?.exit ?? 0) ** 2));
        renderWheel(wheelTexture.context, angle, wheel.faces, {
          result: frame?.frozen ? heldWheel.result : null,
          index: heldWheel?.plan?.index ?? null,
          jolt: frame?.jolt ?? 0,
          flash: frame?.flash ?? 0,
        });
        updateRouletteAudio(
          settling
            ? {
                key: heldWheel.audioKey,
                stoppingAt: heldWheel.stoppedAt,
                impacts: heldWheel.plan.impacts,
              }
            : { key: `${state.id}:${state.roulette.id}` },
        );
        wheelTexture.refresh();
      }
      if (!wheel) updateRouletteAudio(null);
      for (const item of hud)
        item.setVisible(
          !wheel && !["chance", "discard"].includes(state?.presentation?.phase),
        );
      for (const item of this.children.list)
        item.cameraFilter =
          hud.includes(item) || item === shade || item === wheelImage
            ? this.cameras.main.id
            : uiCamera.id;

      for (const actor of actors) {
        const c = metadata.characters.find((c) => c.id === actor.character),
          anim = c.animations.find((a) => a.id === actor.animation);
        const sequence = anim.sequence;
        actor.counter += ((Math.min(delta, 100) * 60) / 1000) * 16;
        const duration = Math.max(1, sequence[actor.frame].duration * 8);
        if (actor.counter > duration) {
          actor.counter %= duration;
          actor.frame = (actor.frame + 1) % sequence.length;
        }
        const frame = sequence[actor.frame];
        actor.sprite.setFrame(frame.frame);
        actor.sprite.setPosition(
          actor.x - anim.anchorX + (frame.offsetX ?? 0),
          actor.y - anim.anchorY + (frame.offsetY ?? 0),
        );
      }
    }
  }
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 320,
    height: 240,
    pixelArt: true,
    backgroundColor: "#151f23",
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: Arena,
    audio: { noAudio: true },
  });
  function draw() {
    if (!scene) return;
    for (const o of [...overlays, ...marks, ...hud]) {
      scene.tweens.killTweensOf(o);
      o.destroy();
    }
    hud = [];
    overlays = [];
    marks = [];
    const tiles =
      state?.tiles ??
      boardData.tiles.map((t) => ({
        ...t,
        ownerSeat: null,
        purchasePrice: t.buyCost,
      }));
    const crystalIDs = boardData.tiles
      .filter((t) => t.type === "crystal")
      .map((t) => t.id);
    const art = (key, x, y, ax = 16, ay = 16, depth = 1) => {
      const sprite = scene.add
        .image(x - ax, y - ay, key)
        .setOrigin(0, 0)
        .setDepth(depth);
      overlays.push(sprite);
      return sprite;
    };
    for (const t of boardData.tiles)
      for (const id of t.neighbors) {
        if (id < t.id) continue;
        const other = boardData.tiles[id],
          distance = Math.hypot(other.x - t.x, other.y - t.y);
        for (let d = 16; d < distance - 10; d += 12)
          art(
            "link_dot",
            t.x + ((other.x - t.x) * d) / distance,
            t.y + ((other.y - t.y) * d) / distance,
            4,
            4,
          );
      }
    for (const tile of tiles) {
      if (tile.ownerSeat !== null)
        art(
          `barrier-${tile.ownerSeat}-${tile.level}`,
          tile.x,
          tile.y,
          16,
          24,
          tile.y,
        );
      else if (tile.typeCode === 0)
        art("source", tile.x, tile.y, 24, 24, tile.y);
      else if (tile.typeCode === 1)
        art(
          `crystal_${crystalIDs.indexOf(tile.id) % 4}`,
          tile.x,
          tile.y,
          16,
          24,
          tile.y,
        );
      else if (tile.typeCode === 2)
        art("chance", tile.x, tile.y, 16, 16, tile.y);
      else if (tile.typeCode === 4)
        art("vacant", tile.x, tile.y, 16, 16, tile.y);
      if (tile.ownerSeat !== null && tile.hp < tile.level + 1)
        art("damaged", tile.x, tile.y, 16, 16, tile.y + 1);
      if (tile.typeCode === 4) {
        overlays.push(
          scene.add
            .text(
              tile.x,
              tile.y + 12,
              String(
                tile.ownerSeat === null
                  ? tile.purchasePrice
                  : tile.rents[Math.max(0, tile.level - 1)],
              ),
              {
                fontFamily: "Arial",
                fontSize: "8px",
                fontStyle: "bold",
                color:
                  tile.ownerSeat === null
                    ? "#ffffff"
                    : ["#ff7373", "#78aaff", "#ff9fe1", "#9bff86"][
                        tile.ownerSeat
                      ],
                stroke: "#142822",
                strokeThickness: 2,
              },
            )
            .setOrigin(0.5, 0)
            .setDepth(tile.y + 2),
        );
      }
      const choices =
        state?.allowedActions
          .flatMap((a) => a.options)
          .filter((o) => o.enabled && o.tileId === tile.id) ?? [];
      if (choices.length) {
        const circle = scene.add
          .circle(tile.x, tile.y, 19, 0xffca61, 0.12)
          .setDepth(1000);
        const arrow = scene.add
          .image(tile.x, tile.y - 19, "arrow_2")
          .setDepth(1001);
        scene.tweens.add({
          targets: arrow,
          y: tile.y - 23,
          duration: 350,
          yoyo: true,
          repeat: -1,
        });
        marks.push(arrow);
        if (choices.length === 1) {
          circle.setInteractive();
          circle.on("pointerdown", () => {
            if (performance.now() >= animatingUntil) onTile(choices[0].id);
          });
        }
        marks.push(circle);
        marks.push(
          scene.add
            .text(tile.x, tile.y + 17, String(tile.id + 1), {
              fontFamily: "sans-serif",
              fontSize: "11px",
              color: "#fff3d1",
              backgroundColor: "#162726",
              padding: { x: 3, y: 1 },
            })
            .setOrigin(0.5, 0)
            .setDepth(1001),
        );
      }
    }
    if (!state) {
      for (const a of actors) {
        scene.tweens.killTweensOf(a);
        a.sprite.destroy();
      }
      actors = [];
      previousTurn = null;
      return;
    }
    const active = state.players.find(
      (p) => p.seat === state.presentation?.actorSeat,
    );
    if (active) {
      const tile = state.tiles[active.position];
      const key = `${state.id}:${state.turnSeat}:${state.round}`;
      if (
        previousTurn !== key ||
        !actors.some(
          (a) => a.seat === active.seat && a.tile === active.position,
        )
      ) {
        camera = beginCameraPan(camera, tile);
        if (previousTurn !== key)
          animatingUntil = Math.max(animatingUntil, performance.now() + 450);
      }
      previousTurn = key;
    }
    const screenImage = (key, x, y) => {
      const image = scene.add
        .image(x, y, key)
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(1500);
      hud.push(image);
      return image;
    };
    for (const [i, p] of state.players.entries()) {
      const pos = boardHudPositions(state.players.length, i);
      screenImage(`panel${p.seat}`, pos.panel.x, pos.panel.y).setAlpha(
        p.seat === state.turnSeat ? 1 : 0.75,
      );
      screenImage(`face${p.characterId}`, pos.face.x, pos.face.y);
      screenImage(`name${p.characterId}`, pos.name.x, pos.name.y);
      const digits = String(Math.abs(p.chakra)).padStart(5, " ");
      [...digits].forEach((d, index) => {
        if (d !== " ")
          screenImage(
            `digits_style0_palette${p.chakra < 0 ? 2 : 0}_${d}`,
            pos.chakra.x + index * 8,
            pos.chakra.y,
          );
      });
      crystalIDs.forEach((id, index) =>
        screenImage(
          `hud-crystal${p.crystalTileIds.includes(id) ? index : 4}`,
          pos.crystalStart.x + index * 8,
          pos.crystalStart.y,
        ),
      );
      if (p.hasScroll) screenImage("hud-scroll", pos.scroll.x, pos.scroll.y);
    }
    if (state.presentation?.remaining > 0) {
      const box = scene.add
        .rectangle(15, 80, 39, 24, 0x152920, 0.9)
        .setOrigin(0)
        .setStrokeStyle(2, 0xd5b343)
        .setScrollFactor(0)
        .setDepth(1500);
      hud.push(box);
      screenImage(`roulette_number_${state.presentation.remaining}`, 22, 76);
    }
    const offsets = [
      [-10, -3],
      [10, 4],
      [-16, 8],
      [16, -1],
    ];
    for (const p of state.players) {
      const tile = state.tiles[p.position],
        same = state.players.filter((q) => q.position === p.position),
        offset =
          same.length > 1
            ? offsets[same.findIndex((q) => q.seat === p.seat)]
            : [0, 0];
      const x = tile.x + offset[0],
        y = tile.y + offset[1];
      let actor = actors.find((a) => a.seat === p.seat);
      if (!actor) {
        const sprite = scene.add
          .sprite(x, y, `actor-${p.characterId}-22`)
          .setOrigin(0, 0);
        actor = {
          sprite,
          seat: p.seat,
          character: p.characterId,
          x,
          y,
          counter: 0,
          frame: 0,
          animation: 22,
        };
        actors.push(actor);
      }
      actor.sprite
        .setDepth(tile.y + 30 + p.seat)
        .setAlpha(p.eliminated ? 0.4 : 1);
      if (actor.character !== p.characterId) {
        actor.character = p.characterId;
        actor.animation = 22;
        actor.frame = 0;
        actor.sprite.setTexture(`actor-${p.characterId}-22`);
      }
      if (actor.targetX !== x || actor.targetY !== y) {
        const dx = x - actor.x,
          dy = y - actor.y;
        actor.targetX = x;
        actor.targetY = y;
        if (Math.abs(dx) + Math.abs(dy) > 1) {
          scene.tweens.killTweensOf(actor);
          actor.animation =
            Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 12 : 11) : dy > 0 ? 10 : 9;
          actor.frame = 0;
          actor.counter = 0;
          actor.sprite.setTexture(`actor-${p.characterId}-${actor.animation}`);
          const plan = boardWalkPlan(
            { x: actor.x, y: actor.y },
            { x, y },
            { actorFlags: p.controller.controllerKind === "cpu" ? 256 : 0 },
          );
          const duration = Math.max(100, (plan.frames * 1000) / 60);
          animatingUntil = Math.max(
            animatingUntil,
            performance.now() + duration + 80,
          );
          scene.tweens.add({
            targets: actor,
            x,
            y,
            duration,
            onComplete: () => {
              actor.animation = 22;
              actor.frame = 0;
              actor.counter = 0;
              actor.sprite.setTexture(`actor-${p.characterId}-22`);
            },
          });
        }
      }
      actor.tile = p.position;
      if (p.seat === state.presentation?.actorSeat)
        marks.push(
          scene.add
            .circle(tile.x + offset[0], tile.y + offset[1] - 52, 4, 0xffbc53)
            .setDepth(1001),
        );
    }
  }
  await ready;
  return {
    setState(value) {
      const now = performance.now();
      if (value?.roulette) {
        if (value.roulette.id !== state?.roulette?.id) {
          wheelEnteredAt = now;
          angleCorrection = 0;
        } else {
          const next = wheelAngle(value, 0);
          angleCorrection = ((displayedAngle - next + 6144) % 4096) - 2048;
        }
      }
      if (state?.roulette && !value?.roulette && value?.id === state.id) {
        const result =
          state.roulette.kind === "movement" &&
          value.presentation?.phase === "move" &&
          state.roulette.faces.includes(value.presentation.lastRoll)
            ? value.presentation.lastRoll
            : null;
        const plan = rouletteStopPlan(
          displayedAngle,
          state.roulette.faces,
          result,
        );
        heldWheel = {
          ...state.roulette,
          audioKey: `${state.id}:${state.roulette.id}`,
          result,
          stoppedAt: now,
          plan,
        };
        wheelUntil = now + plan.endAt;
        animatingUntil = Math.max(animatingUntil, wheelUntil);
      }
      if (!value || value.id !== state?.id) {
        heldWheel = null;
        wheelUntil = 0;
        animatingUntil = 0;
        previousTurn = null;
        updateRouletteAudio(null);
      }
      receivedAt = performance.now();
      state = value;
      draw();
      game.scale.refresh();
    },
    isAnimating() {
      return performance.now() < animatingUntil;
    },
    toggleOverview() {
      overview = !overview;
      scene.cameras.main.setZoom(overview ? 0.5 : 1);
      if (overview) scene.cameras.main.setScroll(160, 120);
      return overview;
    },
    resize() {
      game.scale.refresh();
    },
    destroy() {
      updateRouletteAudio(null);
      game.destroy(true);
    },
  };
}
