import Phaser from "phaser";
import { movementPreview } from "./movement-preview";
import { MOVEMENT_ATLAS, createMovementSprites } from "./movement-art";
import {
  createBoardCamera,
  beginCameraPan,
  stepCameraPan,
  cameraPixels,
  boardHudPositions,
} from "./native-camera";
import { createRouletteRenderer } from "./roulette";
import { updateRouletteAudio, sound } from "./audio";
import { barrierSealTiles, sealFrame } from "./seal";
import { createActorMotion, setActorDestination, remainingWalkMS,
  stepActorMotion, advanceSpriteSequence } from "./actor-motion";
import { SHURIKEN_ATLAS, shurikenFrames } from "./roulette-shuriken";
import {
  directionIndicator,
  wheelAngle,
  rouletteStopPlan,
  rouletteStopFrame,
  ROULETTE_ENTRY_MS,
} from "./presentation";

export async function createBoard(parent, onTile, onCameraMode = () => {}) {
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
  const sealResponse = await fetch("/assets/sprite/effects/seal.json");
  if (!sealResponse.ok) throw new Error("Animasi segel tidak tersedia.");
  const sealData = await sealResponse.json();
  const seals = new Map();
  let scene, readyResolve, readyReject;
  let camera = createBoardCamera({ width: 640, height: 480 }),
    cameraClock = 0;
  let animatingUntil = 0,
    previousTurn = null,
    overview = false,
    manualCamera = false,
    gesture = null;
  const pointers = new Set();
  let hud = [],
    wheelTexture,
    wheelImage,
    shade,
    heldWheel = null,
    wheelUntil = 0,
    wheelEnteredAt = 0,
    uiCamera,
    renderWheel,
    wheelSpin = null;
  const ready = new Promise((resolve, reject) => {
    readyResolve = resolve;
    readyReject = reject;
  });
  let state = null,
    actors = [],
    overlays = [],
    marks = [];
  function cancelGesture() {
    gesture = null;
    pointers.clear();
  }
  function canPan() {
    const now = performance.now();
    return !state?.roulette && now >= wheelUntil && now >= animatingUntil;
  }
  function moveGesture(pointer) {
    if (!gesture || pointer.id !== gesture.id || !pointer.isDown) return;
    const dx = pointer.x - gesture.x, dy = pointer.y - gesture.y;
    if (Math.hypot(dx, dy) > 4) gesture.dragged = true;
    if (!gesture.dragged || !gesture.pan || !canPan()) return;
    if (!manualCamera) {
      manualCamera = true;
      onCameraMode("manual");
    }
    // Pointer coordinates already account for Phaser's mobile/fullscreen scale.
    // Clamp the 320x240 viewport within the arena; HUD remains on its UI camera.
    camera = {
      ...camera,
      x16: Math.max(0, Math.min(camera.width - 320, gesture.camera.x - dx)) * 65536,
      y16: Math.max(0, Math.min(camera.height - 240, gesture.camera.y - dy)) * 65536,
      pan: null,
    };
  }
  class Arena extends Phaser.Scene {
    preload() {
      this.load.on("loaderror", (file) =>
        readyReject(new Error(`Aset gagal dimuat: ${file.key}`)),
      );
      this.load.image("movement-atlas", MOVEMENT_ATLAS);
      this.load.image("seal-atlas", sealData.atlas);
      this.load.image("arena", "/assets/image/arena1/map_00.png");
      this.load.image("roulette-shuriken-atlas", SHURIKEN_ATLAS);
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
        "crystal_0_overlay",
        "crystal_1_overlay",
        "crystal_2_overlay",
        "crystal_3_overlay",
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
          [7, 9, 10, 11, 12, 22].includes(a.id),
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
      const sealAtlas = this.textures.get("seal-atlas");
      for (const frame of sealData.frames) for (const s of frame) {
        const key = `${s.u}:${s.v}:${s.width}:${s.height}`;
        if (!sealAtlas.has(key)) sealAtlas.add(key, 0, s.u, s.v, s.width, s.height);
      }
      for (const [key, canvas] of Object.entries(createMovementSprites(this.textures.get("movement-atlas").getSourceImage())))
        this.textures.addCanvas(key, canvas);
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
      wheelImage.setInteractive(
        new Phaser.Geom.Ellipse(40, 124, 216, 192),
        Phaser.Geom.Ellipse.Contains,
      );
      wheelImage.setData("boardAction", "stop");
      // Handle taps on release so dragging from an arrow never selects a route.
      this.input.addPointer(1);
      this.input.on("pointerdown", (pointer, objects) => {
        if (!pointer.wasTouch && pointer.button !== 0) return;
        pointers.add(pointer.id);
        if (pointers.size > 1) {
          gesture = null;
          return;
        }
        gesture = {
          id: pointer.id,
          x: pointer.x,
          y: pointer.y,
          camera: cameraPixels(camera),
          action: objects.find(o => o.getData("boardAction"))?.getData("boardAction"),
          version: state?.stateVersion,
          matchId: state?.id,
          dragged: false,
          pan: !overview && canPan(),
        };
      });
      this.input.on("pointermove", moveGesture);
      this.input.on("pointerup", pointer => {
        if (gesture?.id === pointer.id &&
            Math.hypot(pointer.x - gesture.x, pointer.y - gesture.y) > 4)
          gesture.dragged = true;
        pointers.delete(pointer.id);
        const tap = gesture;
        if (tap?.id !== pointer.id) return;
        gesture = null;
        if (
          pointer.wasCanceled || tap.dragged || !tap.action ||
          tap.matchId !== state?.id || tap.version !== state?.stateVersion ||
          performance.now() < animatingUntil
        ) return;
        const enabled = state?.allowedActions.some(a =>
          a.options.some(o => o.id === tap.action && o.enabled));
        if (!enabled) return;
        if (tap.action === "stop" &&
            (!state.roulette || performance.now() - wheelEnteredAt < ROULETTE_ENTRY_MS)) return;
        onTile(tap.action);
      });
      this.input.on("pointerupoutside", cancelGesture);
      this.input.on("gameout", cancelGesture);
      window.addEventListener("blur", cancelGesture);
      document.addEventListener("visibilitychange", cancelGesture);
      this.events.once("shutdown", () => {
        window.removeEventListener("blur", cancelGesture);
        document.removeEventListener("visibilitychange", cancelGesture);
        cancelGesture();
      });
      draw();
      readyResolve();
    }
    update(_, delta) {
      const now = performance.now();
      let redraw = false;
      for (const [id, seal] of seals) {
        const frame = sealFrame(sealData, now - seal.startedAt);
        const sprites = [...sealData.frames[frame.frame]].reverse();
        for (const [i, image] of seal.images.entries()) {
          const s = sprites[i];
          image.setVisible(!frame.done && !!s);
          if (!s) continue;
          image.setTexture("seal-atlas", `${s.u}:${s.v}:${s.width}:${s.height}`)
            .setPosition(seal.x + frame.offsetX + s.x + s.width / 2,
              seal.y + frame.offsetY + s.y + s.height / 2)
            .setScale(s.scaleX / 4096, s.scaleY / 4096)
            .setRotation(s.rotation * Math.PI * 2 / 4096)
            .setBlendMode(s.translucent ? Phaser.BlendModes.ADD : Phaser.BlendModes.NORMAL)
            .setAlpha(s.translucent && s.blend === 3 ? 0.25 : 1);
        }
        if (seal.revealed !== frame.revealed) { seal.revealed = frame.revealed; redraw = true; }
        if (frame.done) {
          seal.images.forEach(image => image.destroy());
          seals.delete(id);
          redraw = true;
        }
      }
      if (redraw) draw();
      const wheel = state?.roulette ?? (now < wheelUntil ? heldWheel : null);
      cameraClock += wheel ? 0 : Math.min(delta, 100);
      while (cameraClock >= 1000 / 60) {
        camera = stepCameraPan(camera);
        cameraClock -= 1000 / 60;
      }
      if (!overview) {
        const p = cameraPixels(camera);
        this.cameras.main.setScroll(p.x, p.y);
      }
      for (const mark of marks)
        mark.setVisible(!wheel && now >= animatingUntil);
      shade.setVisible(!!wheel);
      wheelImage.setVisible(!!wheel);
      wheelImage.input.enabled =
        !!state?.roulette &&
        state.status === "playing" &&
        now - wheelEnteredAt >= ROULETTE_ENTRY_MS &&
        state.allowedActions.some((a) =>
          a.options.some((o) => o.id === "stop" && o.enabled),
        );
      wheelImage.input.cursor = wheelImage.input.enabled
        ? "pointer"
        : "default";
      if (wheel) {
        const settling = !state?.roulette;
        const frame = settling
          ? rouletteStopFrame(heldWheel.plan, now - heldWheel.stoppedAt)
          : null;
        const angle = settling
          ? frame.angle
          : wheelAngle(wheelSpin, now - wheelEnteredAt);
        const entry = Math.min(1, (now - wheelEnteredAt) / ROULETTE_ENTRY_MS);
        wheelImage.setX(-180 * ((1 - entry) ** 3 + (frame?.exit ?? 0) ** 2));
        renderWheel(wheelTexture.context, angle, wheel.faces, {
          result: frame?.frozen ? heldWheel.result : null,
          index: heldWheel?.plan?.index ?? null,
          otherNumbersOpacity: frame?.otherNumbersOpacity ?? 1,
          jolt: frame?.jolt ?? 0,
          flash: frame?.flash ?? 0,
          shurikens: settling
            ? shurikenFrames(heldWheel.plan, now - heldWheel.stoppedAt)
            : [],
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
        const walking = !wheel && actor.motion.segments.length > 0;
        const walkPose = stepActorMotion(actor.motion, wheel ? 0 : delta);
        actor.x = actor.motion.x;
        actor.y = actor.motion.y;
        const player = state?.players.find(p => p.seat === actor.seat);
        const canContinue = state?.presentation?.phase === "move" &&
          state.presentation.actorSeat === actor.seat && state.presentation.remaining > 0 &&
          (player?.controller.controllerKind === "cpu" ||
            state.allowedActions.flatMap(a => a.options).filter(o => o.enabled && o.id.startsWith("move:")).length === 1);
        const sealing = [...seals.values()].some(s => s.seat === actor.seat && s.tile === actor.tile);
        const desired = walking ? walkPose : sealing ? 7 :
          canContinue && [9, 10, 11, 12].includes(actor.animation) ? actor.animation : 22;
        if (actor.animation !== desired) {
          actor.animation = desired;
          actor.frame = 0;
          actor.counter = 0;
          actor.animationClock = 0;
          actor.sprite.setTexture(`actor-${actor.character}-${actor.animation}`);
        }
        const c = metadata.characters.find((c) => c.id === actor.character),
          anim = c.animations.find((a) => a.id === actor.animation);
        const sequence = anim.sequence;
        // Hold the last foot pose during the short network gap between steps.
        if (walking || ![9, 10, 11, 12].includes(actor.animation))
          advanceSpriteSequence(actor, sequence, delta);
        const blend = Math.min(1, delta / 100);
        actor.offsetX += (actor.targetOffsetX - actor.offsetX) * blend;
        actor.offsetY += (actor.targetOffsetY - actor.offsetY) * blend;
        const frame = sequence[actor.frame];
        actor.sprite.setFrame(frame.frame);
        actor.sprite.setPosition(
          actor.x + actor.offsetX - anim.anchorX + (frame.offsetX ?? 0),
          actor.y + actor.offsetY - anim.anchorY + (frame.offsetY ?? 0),
        );
        actor.sprite.setDepth(actor.y + 30 + actor.seat);
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
    const routes = movementPreview(state);
    const destinations = new Set(routes.flatMap(r => r.destinations));
    for (const nextTile of tiles) {
      const seal = seals.get(nextTile.id);
      const pendingSeal = seal && !seal.revealed;
      const tile = pendingSeal ? seal.previousTile : nextTile;
      if (pendingSeal && tile.ownerSeat === null) continue;
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
      else if (tile.typeCode === 1) {
        // FUN_800f6988: pedestal and orb are separate 32x32 sprites,
        // both anchored at (16,16) on the checkpoint's world position.
        const key = `crystal_${crystalIDs.indexOf(tile.id) % 4}`;
        art(key, tile.x, tile.y, 16, 16, tile.y);
        art(`${key}_overlay`, tile.x, tile.y, 16, 16, tile.y + 1);
      }
      else if (tile.typeCode === 2)
        art("chance", tile.x, tile.y, 16, 16, tile.y);
      else if (tile.typeCode === 4)
        art("vacant", tile.x, tile.y, 16, 16, tile.y);
      if (tile.ownerSeat !== null && tile.hp < tile.level + 1)
        art("damaged", tile.x, tile.y, 16, 16, tile.y + 1);
      if (tile.typeCode === 4 || tile.ownerSeat !== null) {
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
                  destinations.has(tile.id)
                    ? "#24d5ff"
                    : tile.ownerSeat === null
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
        const moving = state.presentation?.phase === "move";
        const arrow = moving ? null : scene.add
          .image(tile.x, tile.y - 19, directionIndicator(state, choices[0]).texture)
          .setDepth(1001);
        if (arrow) scene.tweens.add({
          targets: arrow,
          y: tile.y - 23,
          duration: 350,
          yoyo: true,
          repeat: -1,
        });
        if (arrow) marks.push(arrow);
        if (moving) circle.setAlpha(0);
        if (choices.length === 1) {
          circle.setInteractive({ useHandCursor: true });
          circle.setData("boardAction", choices[0].id);
          if (arrow) {
            arrow.setInteractive({ useHandCursor: true });
            arrow.setData("boardAction", choices[0].id);
          }
        }
        marks.push(circle);

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
        if (!manualCamera) camera = beginCameraPan(camera, tile);
        if (previousTurn !== key)
          animatingUntil = Math.max(animatingUntil, performance.now() + 450);
      }
      previousTurn = key;
    }
    if (active && routes.length) {
      const origin = state.tiles[active.position];
      for (const { option } of routes) {
        const direction = Number(directionIndicator(state, option).texture.slice(-1));
        const [dx, dy] = [[0, -24], [0, 24], [-24, 0], [24, 0]][direction];
        const arrow = scene.add.image(origin.x + dx, origin.y + dy,
          direction < 2 ? "move-up" : "move-left")
          .setFlipX(direction === 3).setFlipY(direction === 1)
          .setDepth(1001).setInteractive({ useHandCursor: true });
        arrow.setData("boardAction", option.id);
        marks.push(arrow);
      }
      for (const id of destinations) {
        const tile = tiles.find(t => t.id === id);
        const pin = scene.add.image(tile.x, tile.y - 4, "move-destination")
          .setOrigin(0.5, 1).setDepth(1002);
        scene.tweens.add({ targets: pin, y: tile.y - 6, duration: 350, yoyo: true, repeat: -1 });
        marks.push(pin);
      }
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
      const x = tile.x, y = tile.y;
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
          motion: createActorMotion(tile),
          offsetX: offset[0], offsetY: offset[1],
        };
        actors.push(actor);
      }
      actor.sprite
        .setAlpha(p.eliminated ? 0.4 : 1);
      actor.targetOffsetX = offset[0];
      actor.targetOffsetY = offset[1];
      if (actor.character !== p.characterId) {
        actor.character = p.characterId;
        actor.animation = 22;
        actor.frame = 0;
        actor.counter = 0;
        actor.animationClock = 0;
        actor.motion = createActorMotion(tile);
        actor.sprite.setTexture(`actor-${p.characterId}-22`);
      }
      const character = metadata.characters.find(c => c.id === p.characterId);
      setActorDestination(actor.motion, tile, state.tiles, character.directions,
        p.controller.controllerKind === "cpu");
      const remaining = remainingWalkMS(actor.motion);
      if (remaining > 0) animatingUntil = Math.max(animatingUntil, performance.now() + remaining);
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
    chanceCardBack: scene.textures.get("chance-back").getSourceImage().toDataURL("image/png"),
    setState(value) {
      const now = performance.now();
      if (value?.roulette) {
        if (value.id !== state?.id || value.roulette.id !== state?.roulette?.id) {
          wheelEnteredAt = now;
          // Keep one monotonic visual clock across repeated/delayed snapshots.
          wheelSpin = { serverTick: value.serverTick, roulette: { ...value.roulette } };
        }
      }
      if (state?.roulette && !value?.roulette && value?.id === state.id) {
        const result =
          state.roulette.kind === "movement" &&
          state.roulette.faces.includes(value.presentation.lastRoll)
            ? value.presentation.lastRoll
            : null;
        const plan = rouletteStopPlan(
          wheelAngle(wheelSpin, now - wheelEnteredAt),
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
        for (const actor of actors) actor.sprite.destroy();
        actors = [];
        for (const seal of seals.values()) {
          seal.images.forEach(image => image.destroy());
        }
        seals.clear();
        heldWheel = null;
        wheelUntil = 0;
        animatingUntil = 0;
        previousTurn = null;
        manualCamera = false;
        overview = false;
        scene.cameras.main.setZoom(1);
        cancelGesture();
        onCameraMode("follow");
        updateRouletteAudio(null);
      }
      for (const tile of barrierSealTiles(state, value)) {
        if (seals.has(tile.id)) continue;
        const images = Array.from({ length: Math.max(...sealData.frames.map(f => f.length)) },
          (_, i) => scene.add.image(0, 0, "seal-atlas").setVisible(false).setDepth(tile.y + 40 + i / 100));
        seals.set(tile.id, { images, x: tile.x - 1, y: tile.y + 2, tile: tile.id, seat: tile.ownerSeat,
          previousTile: { ...state.tiles.find(t => t.id === tile.id) },
          startedAt: now, revealed: false });
        animatingUntil = Math.max(animatingUntil, now + sealData.sequence.length * 1000 / sealData.fps);
        if (!manualCamera && !overview) camera = beginCameraPan(camera, tile);
        sound("seal");
      }
      if (!value?.roulette) wheelSpin = null;
      state = value;
      draw();
      game.scale.refresh();
    },
    isAnimating() {
      return performance.now() < animatingUntil || actors.some(a => a.motion.segments.length > 0);
    },
    toggleOverview() {
      cancelGesture();
      if (overview || manualCamera) {
        overview = false;
        manualCamera = false;
        scene.cameras.main.setZoom(1);
        const active = state?.players.find(p => p.seat === state.presentation?.actorSeat);
        if (active) camera = beginCameraPan(camera, state.tiles[active.position]);
        onCameraMode("follow");
      } else {
        overview = true;
        scene.cameras.main.setZoom(0.5).setScroll(160, 120);
        onCameraMode("overview");
      }
      return overview;
    },
    resize() {
      cancelGesture();
      game.scale.refresh();
    },
    destroy() {
      updateRouletteAudio(null);
      game.destroy(true);
    },
  };
}
