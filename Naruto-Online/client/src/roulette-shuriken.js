// Source: BOARD.c FUN_8010b084/FUN_8010b9b8, resource 57, tpage 21.
// Flying UV (112,96,44,44), landed UV (68,96,44,44), anchor (22,22).
// CLUT (112,511) is palette 27. Reuse existing palette-7 PNG by reversible
// 16-color lookup; no duplicate PNG or guessed shuriken artwork is introduced.
export const SHURIKEN_ATLAS =
  "/assets/texture/packed/packed_0001a000_4bpp_pal07.png";
const originalPalette = [
  [0, 0, 0, 0],
  [49, 8, 0, 255],
  [24, 24, 16, 255],
  [65, 32, 16, 255],
  [74, 16, 8, 255],
  [98, 24, 8, 255],
  [115, 32, 8, 255],
  [115, 49, 16, 255],
  [131, 41, 8, 255],
  [139, 57, 16, 255],
  [164, 74, 24, 255],
  [180, 82, 24, 255],
  [205, 90, 32, 255],
  [222, 106, 32, 255],
  [222, 115, 32, 255],
  [230, 131, 49, 255],
];
const shurikenPalette = [
  [0, 0, 0, 0],
  [32, 32, 32, 255],
  [49, 41, 41, 255],
  [57, 57, 57, 255],
  [65, 65, 65, 255],
  [82, 82, 74, 255],
  [90, 90, 90, 255],
  [106, 106, 98, 255],
  [115, 115, 115, 255],
  [123, 123, 123, 255],
  [139, 139, 139, 255],
  [156, 156, 156, 255],
  [172, 172, 172, 255],
  [189, 189, 189, 255],
  [205, 205, 205, 255],
  [230, 230, 230, 255],
];
export function createShurikenSprites(image) {
  const lookup = new Map(
    originalPalette.map((color, index) => [
      color.slice(0, 3).join(","),
      shurikenPalette[index],
    ]),
  );
  return [112, 68].map((x) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 44;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, x, 96, 44, 44, 0, 0, 44, 44);
    const pixels = ctx.getImageData(0, 0, 44, 44);
    for (let i = 0; i < pixels.data.length; i += 4) {
      if (pixels.data[i + 3] === 0) continue;
      const color = lookup.get(
        Array.from(pixels.data.slice(i, i + 3)).join(","),
      );
      if (!color) throw new Error("Palette atlas shuriken tidak cocok.");
      pixels.data.set(color, i);
    }
    ctx.putImageData(pixels, 0, 0);
    return canvas;
  });
}
// Native launches have 3-tick flights and 2-tick stagger. Stable X offsets
// replace unexposed native cosmetic jitter; no gameplay RNG is consumed.
export function shurikenFrames(plan, elapsed) {
  const flight = plan.flight,
    offsets = [0, -8, -4],
    ys = [124, 112, 136];
  function position(index, time) {
    const impact = plan.impacts[index],
      start = impact - flight;
    if (time < start) return null;
    const t = Math.min(1, (time - start) / flight),
      x = 340 + offsets[index] - 280 * t,
      y = ys[index] - 32 * (1 - t);
    return { x, y, rotation: t * 720 + 22.5, flying: t < 1 };
  }
  return plan.impacts.flatMap((impact, index) => {
    const current = position(index, elapsed);
    if (!current) return [];
    const trails = [];
    for (let n = 3; n >= 1; n--) {
      const past = position(index, elapsed - n * flight / 3);
      if (past?.flying) trails.push({ ...past, alpha: (4 - n) * 0.12 });
    }
    return [{ ...current, index, impactAge: elapsed - impact, trails }];
  });
}
