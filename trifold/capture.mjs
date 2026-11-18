// Captures the weaver desk's fee breakdown from the live app at device scale 2,
// looking around as the demo weaver (no wallet). board.html crops it further.
// Usage: node capture.mjs   -> writes img/app-weaver-fees.png
import { createRequire } from "node:module";
import fs from "node:fs";
const require = createRequire(import.meta.url);
const { chromium } = require("../video/node_modules/playwright");
const APP = "https://rugdealer.vercel.app";
fs.mkdirSync("img", { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1000, height: 1000 }, deviceScaleFactor: 2 });
async function shot(path, name, look, clip) {
  await page.goto(APP + path, { waitUntil: "networkidle" });
  if (look) {
    await page.getByText(look, { exact: false }).first().click();
    await page.waitForLoadState("networkidle");
  }
  await page.waitForTimeout(4000);
  await page.screenshot({ path: `img/app-${name}.png`, fullPage: true, clip });
  console.log("wrote", name);
}
// Clips are in CSS px of the 1000 px-wide page (the PNG is 2x).
await shot("/weaver", "weaver-fees", "Look around as", { x: 0, y: 495, width: 1000, height: 715 });
await browser.close();
