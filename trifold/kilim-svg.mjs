// The app's kilim, as static SVG strings: the rug from frontend/lib/kilim.ts
// with literal colours (no CSS variables), so it renders anywhere. Shared by
// the trifold build (render.mjs) and the high-res rug exports (rugs.mjs).
import { kilim, RUG_W, RUG_H, CELL_W, CELL_H, FRINGE_FULL, FRINGE_SHORT } from "../frontend/lib/kilim.ts";

export const DYES = { wool: "#f1e8d5", madder: "#9b2a22", indigo: "#24346b", walnut: "#3a2a20", saffron: "#cf9f2f" };

/** Mix two hex colours, a = share of the first (0..1). Same as the app's color-mix tints. */
function mix(h1, h2, a) {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(h1), p(h2)];
  return "#" + x.map((v, i) => Math.round(v * a + y[i] * (1 - a)).toString(16).padStart(2, "0")).join("");
}
function dye(d, tint) {
  if (tint === 1) return mix(DYES[d], DYES.wool, 0.86);
  if (tint === 2) return mix(DYES[d], DYES.walnut, 0.88);
  return DYES[d];
}

let uid = 0;
/** The app's <Kilim> component, as a static SVG string. */
export function kilimSvg(n, family, fringe) {
  const len = fringe === "full" ? FRINGE_FULL : fringe === "short" ? FRINGE_SHORT : 0;
  const k = kilim(n, family, len);
  const id = `k${++uid}`;
  const pad = len ? len + 1 : 1;
  const fr = (bundles, at) =>
    `<g transform="${at === "top" ? "scale(1,-1)" : `translate(0 ${RUG_H})`}">` +
    bundles
      .map(
        (b) =>
          b.threads.map((d) => `<path d="${d}" fill="none" stroke="${DYES.walnut}" stroke-opacity=".34" stroke-linecap="round" stroke-width=".95"/>`).join("") +
          b.threads.map((d) => `<path d="${d}" fill="none" stroke="${DYES.wool}" stroke-linecap="round" stroke-width=".55"/>`).join("") +
          `<rect x="${b.knot.x}" y="${b.knot.y}" width="${b.knot.w}" height="${b.knot.h}" rx=".8" fill="${DYES.wool}" stroke="${DYES.walnut}" stroke-opacity=".34" stroke-width=".35"/>`,
      )
      .join("") +
    `</g>`;
  const cells = k.rows
    .map((row, y) =>
      row.map((r) => `<rect x="${r.x * CELL_W}" y="${y * CELL_H}" width="${r.w * CELL_W + 0.06}" height="${CELL_H + 0.06}" fill="${dye(r.dye, r.tint)}"/>`).join(""),
    )
    .join("");
  return (
    `<svg class="kilim" viewBox="-1 ${-pad} ${RUG_W + 2} ${RUG_H + 2 * pad}" aria-hidden="true">` +
    `<defs><clipPath id="c${id}"><path d="${k.outline}"/></clipPath>` +
    `<pattern id="w${id}" width="${CELL_W}" height="${CELL_H / 2}" patternUnits="userSpaceOnUse">` +
    `<rect width="${CELL_W}" height=".32" fill="${DYES.walnut}" opacity=".1"/><rect y=".75" width="${CELL_W}" height=".28" fill="${DYES.wool}" opacity=".14"/></pattern></defs>` +
    (len ? fr(k.fringe.top, "top") + fr(k.fringe.bottom, "bottom") : "") +
    `<g clip-path="url(#c${id})">${cells}<rect width="${RUG_W}" height="${RUG_H}" fill="url(#w${id})"/></g></svg>`
  );
}

/** A kilim border band: walnut guards, a row of stepped diamonds, madder and indigo alternating. */
export function borderSvg(seed) {
  const cols = 380; // cells across the 38 in board: 0.1 in per cell
  const rows = 7;
  const out = [];
  const cell = (x, y, c) => out.push(`<rect x="${x}" y="${y}" width="1.03" height="1.03" fill="${c}"/>`);
  for (let x = 0; x < cols; x++) {
    cell(x, 0, DYES.walnut);
    cell(x, rows - 1, DYES.walnut);
    const p = (x + seed) % 12;
    const k = p > 6 ? 12 - p : p; // 0..6, a triangle wave
    const motif = Math.floor((x + seed) / 12) % 2 === 0 ? DYES.madder : DYES.indigo;
    for (let y = 1; y < rows - 1; y++) {
      const dy = Math.abs(y - 3);
      let c = DYES.wool;
      if (Math.abs(k - 3) + dy <= 2) c = motif;
      if (Math.abs(k - 3) + dy === 0) c = DYES.saffron;
      if ((y === 1 || y === rows - 2) && x % 4 === 0) c = DYES.walnut;
      cell(x, y, c);
    }
  }
  return `<svg class="border" viewBox="0 0 ${cols} ${rows}" preserveAspectRatio="none" aria-hidden="true">${out.join("")}</svg>`;
}

