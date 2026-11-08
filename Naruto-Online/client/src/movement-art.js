// BOARD resource 38, FUN_800bb5d8 (cyan direction arrows), 800b9e30 (landing pin).
// Reuse existing atlas. Palette 0 has 16 distinct colors, so indices can be
// recovered exactly and remapped to native CLUT (112,242) / (128,242).
export const MOVEMENT_ATLAS = "/assets/texture/packed/packed_018ec800_4bpp_pal00.png";
const palettes = [[0, 40383, 3242, 6447, 7540, 8599, 9689, 13851, 12718, 19094, 21175, 23289, 25402, 27516, 29629, 32767], [0, 65535, 62050, 62148, 61222, 61320, 61418, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 33791, 33791, 61279, 55999, 49695, 44383, 38079, 32799, 32781, 32776, 44479, 49727, 55007, 60287, 65535]];
const rgba = value => [0, 5, 10].map(shift => Math.floor(((value >> shift) & 31) * 255 / 31)).concat(value === 0 ? 0 : 255);
export function createMovementSprites(image) {
  const source = new Map(palettes[0].map((v, i) => [rgba(v).slice(0, 3).join(","), i]));
  const result = {};
  // Atlas starts at VRAM x448; tpage24 starts at512: +256 pixels at4bpp.
  for (const [key, x, y, w, h, palette] of [
    ["move-left", 256 + 80, 176, 24, 24, 1],
    ["move-up", 256 + 104, 176, 24, 24, 1],
    ["move-destination", 256 + 88, 16, 16, 32, 2],
  ]) {
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(image, x, y, w, h, 0, 0, w, h);
    const pixels = ctx.getImageData(0, 0, w, h);
    for (let i = 0; i < pixels.data.length; i += 4) {
      if (!pixels.data[i + 3]) continue;
      const index = source.get(Array.from(pixels.data.slice(i, i + 3)).join(","));
      if (index === undefined) throw new Error("Palette atlas penanda jalur tidak cocok.");
      pixels.data.set(rgba(palettes[palette][index]), i);
    }
    ctx.putImageData(pixels, 0, 0);
    result[key] = canvas;
  }
  return result;
}
