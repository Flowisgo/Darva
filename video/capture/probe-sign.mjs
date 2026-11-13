// Phase 0 probe: connect as the store and issue one real rug certificate.
import { launch, sleep, APP } from "./lib.mjs";
import { selectAccount, approveNextPopup } from "./wallet.mjs";
const OUT = process.argv[2] || ".";
setTimeout(() => { console.log("TIMEOUT"); process.exit(2); }, 240000);
const { ctx, extId, extUrl } = await launch();
try {
  await sleep(1500);
  for (const pg of ctx.pages()) if (pg.url().includes(extId)) await pg.close();
  await selectAccount(ctx, extUrl, "Kaya Rug House");
  const p = ctx.pages()[0] ?? await ctx.newPage();
  await p.goto(`${APP}/store`); await sleep(3000);
  console.log("before:", (await p.locator("header").innerText()).replace(/\s+/g," "));
  if (await p.getByRole("button", { name: "Connect wallet" }).count()) {
    const appr = approveNextPopup(ctx, extId, { onOpen: (pp) => pp.screenshot({ path: `${OUT}/popup-connect.png` }) });
    await p.getByRole("button", { name: "Connect wallet" }).first().click();
    await appr; await sleep(3000);
  }
  console.log("after:", (await p.locator("header").innerText()).replace(/\s+/g," "));
  await p.screenshot({ path: `${OUT}/store-connected.png` });
  await p.locator("textarea").first().fill("Probe: wool kilim, madder red, 120 × 180 cm");
  const appr = approveNextPopup(ctx, extId, { onOpen: (pp) => pp.screenshot({ path: `${OUT}/popup-sign.png` }) });
  await p.getByRole("button", { name: "Issue rug certificate" }).click();
  await appr;
  await p.getByText("Certificate issued").waitFor({ timeout: 90000 });
  const href = await p.getByRole("link", { name: "See it on the explorer" }).getAttribute("href");
  console.log("OK tx:", href);
  await p.screenshot({ path: `${OUT}/store-issued.png` });
} catch (e) { console.log("ERR", e.message.split("\n").slice(0,6).join("\n")); }
finally { await ctx.close(); process.exit(0); }
