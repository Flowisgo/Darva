// Phase 0 framing check: screenshot every route at two capture geometries.
import { chromium } from "playwright";
import { APP } from "./lib.mjs";
const out = process.argv[2];
const routes = ["/", "/store?as=store", "/weaver?as=weaver", "/investor?as=investor", "/platform?as=platform", "/activity", "/rug/1"];
const b = await chromium.launch();
for (const [tag, vp, dsf] of [["1920", { width: 1920, height: 1080 }, 1], ["1440", { width: 1440, height: 810 }, 4 / 3]]) {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: dsf });
  const p = await ctx.newPage();
  for (const r of routes) {
    await p.goto(APP + r, { waitUntil: "networkidle" });
    await p.waitForTimeout(2500);
    const name = r.replace(/[/?=]/g, "_") || "_home";
    await p.screenshot({ path: `${out}/${tag}${name}.png` });
  }
  await ctx.close();
}
await b.close();
console.log("done");
