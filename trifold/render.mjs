// Builds the trifold board from board.html.
//
//   cd trifold && npm install && npm run render
//
// 1. Replaces the placeholders in board.html:
//      <!--kilim:NUMBER:medallion|banded:full|short|none-->  a rug woven by the app's own generator
//      <!--border:SEED-->                                     a kilim border band
//      <!--qr:URL-->                                          a vector QR code
//    and writes build/board.html.
// 2. Opens it in Playwright's Chromium and checks the layout: nothing overflows
//    a panel, nothing below the banner sits within 0.5 in of a fold or 0.75 in of
//    the outer edge. Problems are printed and make the script exit 1.
// 3. Prints trifold.pdf (one 38 x 27 in page, vector text, fonts embedded) and
//    trifold-preview.png (downscaled, with dashed fold guides; the guides are
//    only ever added for the preview).
//
// Fold positions come from FOLDS below (inches from the left edge). Change them
// there and in board.html's :root (--fold-1 / --fold-2) if the real board differs.

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import QRCode from "qrcode";
import { kilimSvg, borderSvg } from "./kilim-svg.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("../video/node_modules/playwright");

const here = path.dirname(fileURLToPath(import.meta.url));
const BOARD_W = 38;
const BOARD_H = 27;
const FOLDS = [9.5, 28.5];
const FOLD_CLEAR = 0.5;
const EDGE_CLEAR = 0.75;

async function qrSvg(url) {
  const svg = await QRCode.toString(url, { type: "svg", errorCorrectionLevel: "M", margin: 4, color: { dark: "#1c2440", light: "#ffffff" } });
  return svg.replace("<svg ", '<svg class="qr" ');
}

// ---------- 1. build ----------
let html = fs.readFileSync(path.join(here, "board.html"), "utf8");
html = html.replace(/<!--kilim:(\d+):(medallion|banded):(full|short|none)-->/g, (_, n, fam, fr) => kilimSvg(Number(n), fam, fr));
html = html.replace(/<!--border:(\d+)-->/g, (_, s) => borderSvg(Number(s)));
for (const m of [...html.matchAll(/<!--qr:(\S+?)-->/g)]) html = html.replace(m[0], await qrSvg(m[1]));
fs.mkdirSync(path.join(here, "build"), { recursive: true });
const built = path.join(here, "build", "board.html");
// The built page lives in build/, so asset paths step up one level.
html = html.replace(/(src|href)="(fonts|img)\//g, '$1="../$2/').replace(/url\("(fonts)\//g, 'url("../$1/');
fs.writeFileSync(built, html);

// ---------- 2. check ----------
const DPI = 96;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: BOARD_W * DPI, height: BOARD_H * DPI } });
await page.goto(pathToFileURL(built).href, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
const report = await page.evaluate(
  ({ FOLDS, FOLD_CLEAR, EDGE_CLEAR, BOARD_W, BOARD_H, DPI }) => {
    const problems = [];
    const inch = (v) => v / DPI;
    // Panels must not overflow.
    for (const el of document.querySelectorAll(".panel, .box, .col, .step, .end")) {
      if (el.scrollHeight > el.clientHeight + 2 || el.scrollWidth > el.clientWidth + 2)
        problems.push(`overflow: ${el.className} "${el.textContent.trim().slice(0, 40)}" (${inch(el.scrollHeight - el.clientHeight).toFixed(2)} in)`);
    }
    // Text, images and key graphics below the banner: clear of folds and edges.
    const bannerBottom = document.querySelector(".banner").getBoundingClientRect().bottom;
    const leaves = [...document.querySelectorAll(".panel *")].filter(
      (el) => (el.children.length === 0 && el.textContent.trim()) || ["IMG", "svg"].includes(el.tagName),
    );
    for (const el of leaves) {
      if (el.closest("svg") && el.tagName !== "svg") continue;
      let r = el.getBoundingClientRect();
      const crop = el.closest(".shot-crop");
      if (crop) {
        const c = crop.getBoundingClientRect();
        r = { left: Math.max(r.left, c.left), right: Math.min(r.right, c.right), top: Math.max(r.top, c.top), bottom: Math.min(r.bottom, c.bottom), width: 1 };
      }
      if (!r.width || r.top < bannerBottom) continue;
      const L = inch(r.left), R = inch(r.right), T = inch(r.top), B = inch(r.bottom);
      const tag = `${el.tagName.toLowerCase()} "${el.textContent.trim().slice(0, 30)}"`;
      for (const f of FOLDS) if (R > f - FOLD_CLEAR && L < f + FOLD_CLEAR) problems.push(`fold gutter ${f} in: ${tag} [${L.toFixed(2)}–${R.toFixed(2)}]`);
      if (L < EDGE_CLEAR || R > BOARD_W - EDGE_CLEAR || B > BOARD_H - EDGE_CLEAR) problems.push(`edge margin: ${tag} [${L.toFixed(2)}–${R.toFixed(2)}, bottom ${B.toFixed(2)}]`);
    }
    // Smallest body text below the banner (sources and IDs are marked .fine).
    let minBody = 999, minFine = 999;
    for (const el of leaves) {
      if (el.tagName === "svg" || el.closest("svg")) continue;
      const pt = parseFloat(getComputedStyle(el).fontSize) * 0.75;
      if (el.closest(".fine")) minFine = Math.min(minFine, pt);
      else minBody = Math.min(minBody, pt);
    }
    // Title cap height: measure "R" with canvas in the title's font.
    const t = document.querySelector(".title");
    const cs = getComputedStyle(t);
    const ctx = document.createElement("canvas").getContext("2d");
    ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const cap = inch(ctx.measureText("R").actualBoundingBoxAscent);
    return { problems, minBody, minFine, titleCapIn: cap, fonts: [...document.fonts].filter((f) => f.status === "loaded").length };
  },
  { FOLDS, FOLD_CLEAR, EDGE_CLEAR, BOARD_W, BOARD_H, DPI },
);
console.log(`title cap height ${report.titleCapIn.toFixed(2)} in · smallest body text ${report.minBody} pt · smallest fine print ${report.minFine} pt · fonts loaded ${report.fonts}`);
for (const p of report.problems) console.log("  ✗ " + p);

// ---------- 3. export ----------
await page.emulateMedia({ media: "print" });
await page.pdf({ path: path.join(here, "trifold.pdf"), width: `${BOARD_W}in`, height: `${BOARD_H}in`, printBackground: true, pageRanges: "1" });
await page.emulateMedia({ media: "screen" });
await page.evaluate(() => document.body.classList.add("guides"));
const scale = Number(process.env.PREVIEW_SCALE ?? 0.5);
const prev = await browser.newPage({ viewport: { width: BOARD_W * DPI, height: BOARD_H * DPI }, deviceScaleFactor: scale });
await prev.goto(pathToFileURL(built).href, { waitUntil: "load" });
await prev.evaluate(() => document.fonts.ready);
await prev.evaluate(() => document.body.classList.add("guides"));
await prev.screenshot({ path: path.join(here, "trifold-preview.png") });
if (process.env.DETAIL) {
  const det = await browser.newPage({ viewport: { width: BOARD_W * DPI, height: BOARD_H * DPI }, deviceScaleFactor: 1 });
  await det.goto(pathToFileURL(built).href, { waitUntil: "load" });
  await det.evaluate(() => document.fonts.ready);
  await det.evaluate(() => document.body.classList.add("guides"));
  for (const [name, x] of [["left", 0], ["center", 9.5], ["right", 28.5]]) {
    const w = name === "center" ? 19 : 9.5;
    await det.screenshot({ path: path.join(here, "build", `detail-${name}.png`), clip: { x: x * DPI, y: 0, width: w * DPI, height: BOARD_H * DPI } });
  }
}
await browser.close();
console.log("wrote trifold.pdf and trifold-preview.png");
process.exit(report.problems.length ? 1 : 0);
