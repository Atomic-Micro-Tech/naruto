// Render the extracted PS1 textured quads into a Phaser canvas texture.
// Geometry/UV provenance: assets/sprite/common/assets.json, FUN_8001fd0c.
import { createShurikenSprites } from "./roulette-shuriken";
export function createRouletteRenderer(image, geometry) {
  const shurikenSprites = createShurikenSprites(
    image("roulette-shuriken-atlas"),
  );
  const center = [128, 128];
  const vertices = (array) =>
    Array.from({ length: array.length / 2 }, (_, i) => [
      array[i * 2],
      array[i * 2 + 1],
    ]);
  const rotate = (points, value) => {
    const a = (value * Math.PI * 2) / 4096,
      c = Math.cos(a),
      s = Math.sin(a);
    return points.map(([x, y]) => [
      center[0] + x * c - y * s,
      center[1] + x * s + y * c,
    ]);
  };
  let ctx;
  function layer(draw) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    draw();
    return canvas;
  }
  function quad(key, points) {
    const texture = image(key),
      w = texture.width,
      h = texture.height;
    const uv = [
      [0, 0],
      [w, 0],
      [0, h],
      [w, h],
    ];
    for (const ids of [
      [0, 1, 2],
      [1, 2, 3],
    ]) {
      const [p0, p1, p2] = ids.map((i) => points[i]);
      const [u0, u1, u2] = ids.map((i) => uv[i]);
      const du1 = u1[0] - u0[0],
        dv1 = u1[1] - u0[1],
        du2 = u2[0] - u0[0],
        dv2 = u2[1] - u0[1];
      const det = du1 * dv2 - du2 * dv1;
      const a = ((p1[0] - p0[0]) * dv2 - (p2[0] - p0[0]) * dv1) / det;
      const b = ((p1[1] - p0[1]) * dv2 - (p2[1] - p0[1]) * dv1) / det;
      const c = ((p2[0] - p0[0]) * du1 - (p1[0] - p0[0]) * du2) / det;
      const d = ((p2[1] - p0[1]) * du1 - (p1[1] - p0[1]) * du2) / det;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(...p0);
      ctx.lineTo(...p1);
      ctx.lineTo(...p2);
      ctx.closePath();
      ctx.clip();
      ctx.setTransform(
        a,
        b,
        c,
        d,
        p0[0] - a * u0[0] - c * u0[1],
        p0[1] - b * u0[0] - d * u0[1],
      );
      ctx.drawImage(texture, 0, 0);
      ctx.restore();
    }
  }
  const base = layer(() => {
    const outer = [...rotate(vertices(geometry.outerVertices), 511), center];
    for (let j = 3; j >= 0; j--)
      quad(
        `roulette_quadrant_${j}`,
        geometry.outerQuads[j].map((i) => outer[i]),
      );
    for (let j = 11; j >= 0; j--)
      quad(
        "roulette_rim",
        rotate(vertices(geometry.rimVertices), 341 + j * 341),
      );
    for (let j = 11; j >= 0; j--)
      quad(
        "roulette_spoke",
        rotate(vertices(geometry.spokeVertices).slice(0, 4), 511 + j * 341),
      );
    quad(
      "roulette_center_shadow",
      rotate(vertices(geometry.centerVertices), 0),
    );
  });
  const hub = layer(() =>
    quad("roulette_center", rotate(vertices(geometry.centerVertices), 682)),
  );
  const numbers = new Map();
  function numberLayer(faces, selected) {
    const key = faces.join(",") + ":" + selected;
    if (!numbers.has(key)) {
      if (numbers.size > 24) numbers.clear();
      numbers.set(
        key,
        layer(() => {
          for (let j = 11; j >= 0; j--)
            if (selected === null || 11 - j === selected)
              quad(
                `roulette_number_${faces[11 - j]}`,
                rotate(
                  vertices(geometry.numberVertices).slice(0, 4),
                  341 + j * 341,
                ),
              );
        }),
      );
    }
    return numbers.get(key);
  }
  return (
    output,
    angle,
    faces,
    { result = null, index = null, jolt = 0, flash = 0, shurikens = [] } = {},
  ) => {
    output.clearRect(0, 0, 320, 240);
    output.imageSmoothingEnabled = false;
    function paint(texture, rotation) {
      output.save();
      output.translate(40 + jolt, 124);
      output.scale(575 / 512, 1);
      output.rotate((rotation * Math.PI * 2) / 4096);
      output.drawImage(texture, -128, -128);
      output.restore();
    }
    paint(base, angle);
    paint(numberLayer(faces, result === null ? null : index), angle);
    paint(hub, angle * 2);
    function star(item, alpha = 1) {
      output.save();
      output.globalAlpha = alpha;
      output.translate(item.x + jolt, item.y);
      if (item.flying) output.rotate((item.rotation * Math.PI) / 180);
      output.drawImage(shurikenSprites[item.flying ? 0 : 1], -22, -22);
      output.restore();
    }
    for (const shuriken of [...shurikens].reverse()) {
      for (const trail of shuriken.trails) star(trail, trail.alpha);
      star(shuriken);
      if (shuriken.impactAge >= 0 && shuriken.impactAge < 100) {
        output.save();
        output.globalAlpha = 1 - shuriken.impactAge / 100;
        output.strokeStyle = "#fff3a0";
        output.lineWidth = 1.5;
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4,
            distance = 8 + shuriken.impactAge / 5;
          output.beginPath();
          output.moveTo(
            shuriken.x - 22 + Math.cos(a) * 5,
            shuriken.y + Math.sin(a) * 5,
          );
          output.lineTo(
            shuriken.x - 22 + Math.cos(a) * distance,
            shuriken.y + Math.sin(a) * distance,
          );
          output.stroke();
        }
        output.restore();
      }
    }
    output.drawImage(image("roulette_pointer"), 108 + jolt / 2, 116);
    if (flash > 0) {
      output.save();
      output.globalAlpha = flash * 0.65;
      output.strokeStyle = "#fff3a0";
      output.lineWidth = 2;
      for (let i = 0; i < 7; i++) {
        const a = (i * Math.PI * 2) / 7;
        output.beginPath();
        output.moveTo(137 + Math.cos(a) * 8, 124 + Math.sin(a) * 8);
        output.lineTo(137 + Math.cos(a) * 23, 124 + Math.sin(a) * 23);
        output.stroke();
      }
      output.restore();
    }
    if (result !== null) {
      output.fillStyle = "#122922";
      output.fillRect(111, 108, 39, 33);
      output.strokeStyle = "#ddb447";
      output.lineWidth = 2;
      output.strokeRect(111, 108, 39, 33);
      output.drawImage(image(`roulette_number_${result}`), 118, 108);
    }
  };
}
