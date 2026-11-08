// Render the extracted PS1 textured quads into a Phaser canvas texture.
// Geometry/UV provenance: assets/sprite/common/assets.json, FUN_8001fd0c.
export function drawRoulette(
  ctx,
  image,
  geometry,
  angle,
  faces,
  result = null,
) {
  ctx.clearRect(0, 0, 320, 240);
  ctx.imageSmoothingEnabled = false;
  const center = [40, 124];
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
      center[0] + ((x * c - y * s) * 575) / 512,
      center[1] + x * s + y * c,
    ]);
  };
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
  const outer = [
    ...rotate(vertices(geometry.outerVertices), angle + 511),
    center,
  ];
  for (let j = 3; j >= 0; j--)
    quad(
      `roulette_quadrant_${j}`,
      geometry.outerQuads[j].map((i) => outer[i]),
    );
  for (let j = 11; j >= 0; j--)
    quad(
      "roulette_rim",
      rotate(vertices(geometry.rimVertices), angle + 341 + j * 341),
    );
  for (let j = 11; j >= 0; j--)
    quad(
      "roulette_spoke",
      rotate(
        vertices(geometry.spokeVertices).slice(0, 4),
        angle + 511 + j * 341,
      ),
    );
  for (let j = 11; j >= 0; j--) {
    const value = faces[11 - j];
    if (result === null || value === result)
      quad(
        `roulette_number_${value}`,
        rotate(
          vertices(geometry.numberVertices).slice(0, 4),
          angle + 341 + j * 341,
        ),
      );
  }
  quad("roulette_center_shadow", rotate(vertices(geometry.centerVertices), 0));
  quad(
    "roulette_center",
    rotate(vertices(geometry.centerVertices), (angle + 341) * 2),
  );
  ctx.drawImage(image("roulette_pointer"), 108, 116);
  if (result !== null) {
    ctx.fillStyle = "#122922";
    ctx.fillRect(111, 108, 39, 33);
    ctx.strokeStyle = "#ddb447";
    ctx.lineWidth = 2;
    ctx.strokeRect(111, 108, 39, 33);
    ctx.drawImage(image(`roulette_number_${result}`), 118, 108);
  }
}
