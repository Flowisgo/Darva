// High-resolution rug exports: every rug the site and the trifold show, plus a
// wider collection of designs, all woven by the app's own generator.
//
//   cd trifold && node rugs.mjs
//
// Writes ../rugs/:
//   featured/<name>.svg, <name>.png, <name>-nofringe.png   the rugs in use
//   collection/<family>-<n>.svg, .png                      seeds 1..24, both families
//   border/trifold-border.svg, .png                        the trifold's kilim band
//   contact-sheet-featured.png, contact-sheet-collection.png
// PNGs are transparent, RUG_PX wide (fringe included). SVGs scale to any size.

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { kilimSvg, borderSvg, DYES } from "./kilim-svg.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("../video/node_modules/playwright");

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, "..", "rugs");
const RUG_PX = 3000; // output width of each rug PNG
const SCALE = 2; // device pixels per CSS pixel
const COLLECTION = 24;

const FEATURED = [
  { name: "site-hero-rug-2", n: 2, family: "medallion", note: "Landing page hero" },
  { name: "site-logo-rug-0", n: 0, family: "medallion", note: "Header mark" },
  { name: "site-rug-1", n: 1, family: "medallion", note: "Rug #1 card" },
  { name: "site-rug-2", n: 2, family: "medallion", note: "Rug #2 card" },
  { name: "site-rug-3", n: 3, family: "medallion", note: "Rug #3 card" },
  { name: "trifold-rug-5-medallion", n: 5, family: "medallion", note: "Trifold banner + steps" },
  { name: "trifold-rug-6-banded", n: 6, family: "banded", note: "Trifold banner" },
];

const write = (p, s) => (fs.mkdirSync(path.dirname(p), { recursive: true }), fs.writeFileSync(p, s));
const standalone = (svg) => svg.replace('<svg class="kilim"', '<svg xmlns="http://www.w3.org/2000/svg" class="kilim"').replace('<svg class="border"', '<svg xmlns="http://www.w3.org/2000/svg" class="border"');

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: SCALE, viewport: { width: 800, height: 800 } });

/** Render an SVG string to a transparent PNG `cssW` CSS pixels wide. */
async function png(svg, cssW, file) {
  const [, , , vw, vh] = svg.match(/viewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"/).map(Number);
  const cssH = Math.round((cssW * vh) / vw);
  await page.setViewportSize({ width: cssW, height: cssH });
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${cssW}px;height:${cssH}px}</style>${svg}`);
  await page.screenshot({ path: file, omitBackground: true, clip: { x: 0, y: 0, width: cssW, height: cssH } });
}

/** A grid of rugs on a wool ground, each captioned. */
async function sheet(items, cols, file, title) {
  const cell = 260;
  const html = `<style>
    @font-face{font-family:S;src:url("${path.join(here, "fonts/schibsted-grotesk-latin-600.woff2").replace(/\\/g, "/")}")}
    body{margin:0;background:${DYES.wool};font-family:S,system-ui;color:${DYES.walnut}}
    h1{margin:0;padding:40px 48px 8px;font-size:34px;letter-spacing:-.01em}
    .g{display:grid;grid-template-columns:repeat(${cols},${cell}px);gap:28px 36px;padding:24px 48px 48px}
    figure{margin:0;text-align:center} svg{width:${cell * 0.62}px;height:auto;display:block;margin:0 auto}
    figcaption{font-size:14px;margin-top:8px;opacity:.8}</style>
    <h1>${title}</h1><div class="g">${items.map((i) => `<figure>${i.svg}<figcaption>${i.label}</figcaption></figure>`).join("")}</div>`;
  await page.setViewportSize({ width: 48 * 2 + cols * cell + (cols - 1) * 36, height: 400 });
  await page.setContent(html);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: file, fullPage: true });
}

const cssW = RUG_PX / SCALE;

// Featured: the rugs in use, with and without fringe.
for (const f of FEATURED) {
  const svg = standalone(kilimSvg(f.n, f.family, "full"));
  write(path.join(OUT, "featured", `${f.name}.svg`), svg);
  await png(svg, cssW, path.join(OUT, "featured", `${f.name}.png`));
  await png(standalone(kilimSvg(f.n, f.family, "none")), cssW, path.join(OUT, "featured", `${f.name}-nofringe.png`));
  console.log("featured", f.name);
}

// Collection: more designs from the same generator.
for (const family of ["medallion", "banded"]) {
  for (let n = 1; n <= COLLECTION; n++) {
    const svg = standalone(kilimSvg(n, family, "full"));
    write(path.join(OUT, "collection", `${family}-${String(n).padStart(2, "0")}.svg`), svg);
    await png(svg, cssW, path.join(OUT, "collection", `${family}-${String(n).padStart(2, "0")}.png`));
  }
  console.log("collection", family);
}

// The trifold's border band, at 20 px per weft cell.
const border = standalone(borderSvg(0)).replace('preserveAspectRatio="none" ', "");
write(path.join(OUT, "border", "trifold-border.svg"), border);
await png(border, (380 * 20) / SCALE, path.join(OUT, "border", "trifold-border.png"));

await sheet(
  FEATURED.map((f) => ({ svg: kilimSvg(f.n, f.family, "full"), label: `${f.note} · #${f.n} ${f.family}` })),
  4,
  path.join(OUT, "contact-sheet-featured.png"),
  "RugDealer rugs in use",
);
await sheet(
  ["medallion", "banded"].flatMap((family) =>
    Array.from({ length: COLLECTION }, (_, i) => ({ svg: kilimSvg(i + 1, family, "full"), label: `${family} #${i + 1}` })),
  ),
  8,
  path.join(OUT, "contact-sheet-collection.png"),
  "RugDealer kilim collection: medallion and banded, #1–24",
);

await browser.close();
console.log("done ->", OUT);
