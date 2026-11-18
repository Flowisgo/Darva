// README screenshots of the running app (read-only ?as= views, no wallet).
//
//   node capture/readme-shots.mjs      (app running at APP_URL, default :3100)
//
// Writes frontend/screenshots/{landing,weaver,investor}-1280.jpg.
import { join } from "node:path";
import { chromium } from "playwright";
import { APP, VIDEO } from "./lib.mjs";

const OUT = join(VIDEO, "..", "frontend", "screenshots");
const SHOTS = [
  { name: "landing", path: "/" },
  { name: "weaver", path: "/weaver?as=weaver" },
  { name: "investor", path: "/investor?as=investor", scrollTo: "text=Your loans" },
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
for (const s of SHOTS) {
  await page.goto(APP + s.path, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500); // contract reads settle after hydration
  if (s.scrollTo) await page.locator(s.scrollTo).first().evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 24));
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(OUT, `${s.name}-1280.jpg`), type: "jpeg", quality: 85 });
  console.log(`wrote frontend/screenshots/${s.name}-1280.jpg`);
}
await browser.close();
