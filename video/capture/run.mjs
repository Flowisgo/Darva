// Capture session: drives the real app with the real Varial wallet and
// records one clip per beat. Every action is a real Testnet transaction.
//
//   node capture/run.mjs all                 # the whole film, in order
//   node capture/run.mjs store-issue ...     # selected beats (state carries over)
//   node capture/run.mjs rehearse-handover 4 # unrecorded: collect rug 4
//
// Output: assets/clips/<beat>/clip.mp4 (+ <beat>-varial-N/ for wallet popups),
// capture/logs/<beat>.json (pointer, clicks, element boxes, markers, tx hashes)
// and capture/logs/state.json (rug/loan ids and hashes shared by beats).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Actor } from "./human.mjs";
import { APP, CLIPS, DSF, HERE, launch, settle, sleep } from "./lib.mjs";
import { assemble, startRecording } from "./recorder.mjs";
import { selectAccount } from "./wallet.mjs";

const LOGS = join(HERE, "logs");
mkdirSync(LOGS, { recursive: true });
mkdirSync(CLIPS, { recursive: true });
const STATE_FILE = join(LOGS, "state.json");
const state = existsSync(STATE_FILE) ? JSON.parse(readFileSync(STATE_FILE, "utf8")) : { txs: [] };
const saveState = () => writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

const RUG_HAPPY = "Wool kilim, madder red field, 160 × 230 cm";
const RUG_BUYOUT = "Wool kilim, indigo border, 120 × 180 cm";
const NAMES = { store: "Kaya Rug House", weaver: "Ayşe the weaver", investor: "Deniz the investor" };
const no = (id) => `No. ${String(id).padStart(4, "0")}`;

const { ctx, extId, extUrl } = await launch();
const killer = setTimeout(() => {
  console.error("run: hard timeout");
  process.exit(3);
}, 40 * 60 * 1000);

for (const pg of ctx.pages()) if (pg.url().includes(extId)) await pg.close();
const page = ctx.pages()[0] ?? (await ctx.newPage());
const actor = new Actor(page, { scale: DSF });
let beat = "setup";
let popupCount = 0;
let recording = null;

// Every transaction the app submits, from its own RPC traffic.
page.on("response", async (res) => {
  try {
    const req = res.request();
    if (req.method() !== "POST") return;
    const body = req.postDataJSON?.();
    if (!body || body.method !== "sendTransaction") return;
    const json = await res.json();
    const hash = json?.result?.hash;
    if (!hash) return;
    const tx = { beat, hash, status: json.result.status, at: new Date().toISOString() };
    state.txs.push(tx);
    saveState();
    actor.mark("tx-sent", { hash });
  } catch {}
});

async function goto(path) {
  await page.goto(APP + path);
  await settle(page);
}

/** Select `role`'s account in Varial and make sure the app is connected as it. */
async function as(role, path) {
  await selectAccount(ctx, extUrl, NAMES[role]);
  await goto(path);
  const connect = page.locator("header").getByRole("button", { name: "Connect wallet" });
  if (await connect.count()) {
    const appr = approve({ record: false });
    await connect.click();
    await appr;
    await sleep(2000);
    await settle(page);
  }
  const chip = (await page.locator("header").innerText()).replace(/\s+/g, " ");
  if (!chip.includes(NAMES[role])) {
    await page.reload();
    await settle(page);
  }
  const chip2 = (await page.locator("header").innerText()).replace(/\s+/g, " ");
  if (!chip2.includes(NAMES[role])) throw new Error(`app is not connected as ${NAMES[role]}: ${chip2}`);
  console.log(`as ${NAMES[role]} on ${path}`);
}

/**
 * Wait for the next Varial popup, show it at its natural popup size, record
 * it, and press its approve button like a person would.
 */
async function approve({ record = !!recording, dwell = 1500 } = {}) {
  const popup = await ctx.waitForEvent("page", { predicate: (pg) => pg.url().includes(extId), timeout: 90000 });
  await popup.setViewportSize({ width: 400, height: 640 });
  await popup.waitForLoadState("domcontentloaded");
  if (await popup.locator("input[type=password]").count()) throw new Error("Varial is locked; run wallet-setup or unlock first");
  await popup.getByRole("button", { name: /^(Connect|Confirm|Sign|Approve)$/ }).last().waitFor({ timeout: 20000 });
  await sleep(500);
  const kind = popup.url().match(/#\/([a-z-]+)/)?.[1] ?? "popup";
  const text = (await popup.innerText("body")).replace(/\s+/g, " ").slice(0, 300);
  actor.mark("varial-open", { kind });
  console.log(`  [varial ${kind}] ${text.slice(0, 160)}`);
  const name = `${beat}-varial-${++popupCount}`;
  const pa = new Actor(popup, { scale: DSF, log: () => {} });
  pa.pos = { x: 200, y: 330 };
  let rec = null;
  if (record) rec = await startRecording(popup, join(CLIPS, name), { width: 534, height: 854 });
  await sleep(dwell);
  const btn = popup.getByRole("button", { name: /^(Connect|Confirm|Sign|Approve)$/ }).last();
  for (let i = 0; i < 20 && (await btn.isDisabled()); i++) await sleep(400);
  const closed = popup.waitForEvent("close", { timeout: 15000 }).catch(() => {});
  await pa.click(btn, "varial-approve", { settle: 160 });
  actor.mark("varial-approved", { kind, clip: record ? name : null });
  await sleep(250);
  if (rec) {
    const r = await rec.stop();
    pa.save(join(LOGS, `${name}.json`), { t0: r.t0, t1: r.t1, kind, text });
  }
  await closed;
  if (rec) assemble(join(CLIPS, name), { width: 534, height: 854 });
  return { kind, name };
}

/** Click an app button that triggers a signature, approve it, wait for `until`. */
async function signed(button, name, until, { timeout = 120000 } = {}) {
  const appr = approve();
  await actor.click(button, name);
  await appr;
  await actor.park();
  actor.mark("confirming");
  await until.waitFor({ timeout });
  actor.mark(`done:${name}`);
}

async function record(name, fn) {
  beat = name;
  popupCount = 0;
  actor.events = [];
  console.log(`\n== ${name}`);
  recording = await startRecording(page, join(CLIPS, name));
  actor.mark("start");
  try {
    await fn();
  } finally {
    actor.mark("end");
    const r = await recording.stop();
    recording = null;
    actor.save(join(LOGS, `${name}.json`), { t0: r.t0, t1: r.t1, view: { w: 1440, h: 810, dsf: DSF } });
    const a = assemble(join(CLIPS, name));
    console.log(`  clip ${a.duration.toFixed(1)} s, ${a.frames} frames`);
  }
}

// After funding, the request card leaves "Open requests" and comes back
// under "Your loans" as a running loan with a due-date countdown.
const running = (id) => page.locator("article.entry").filter({ hasText: no(id) }).filter({ hasText: "Due in" }).first();
const card = (id) => page.locator("article.entry").filter({ hasText: no(id) }).first();
async function latestRugId() {
  const t = await page.locator("article.entry .entry-no").allInnerTexts();
  return Math.max(...t.map((x) => Number(x.replace(/\D/g, ""))).filter(Boolean));
}

// ---------------------------------------------------------------- beats

const BEATS = {
  async landing() {
    await selectAccount(ctx, extUrl, NAMES.store);
    await goto("/");
    await page.evaluate(() => window.scrollTo(0, 0));
    await actor.moveTo(1250, 700, { ms: 10 });
    await record("landing", async () => {
      await sleep(2600);
      await actor.hover(page.locator(".hero-tag"), "worked-example", { dwell: 300 });
      await actor.box(page.locator(".hero-tag .ledger-rows, .hero-tag dl, .hero-tag").last(), "worked-rows");
      await sleep(2200);
      await actor.park(1300, 760);
      await actor.scrollTo(page.locator(".outcomes"), { offset: 120, ms: 900 });
      await actor.box(page.locator(".outcome").nth(0), "outcome-repay");
      await actor.box(page.locator(".outcome").nth(1), "outcome-buyout");
      await actor.box(page.locator(".outcome").nth(2), "outcome-claim");
      await sleep(3200);
    });
  },

  async "store-issue"() {
    await as("store", "/store");
    await page.evaluate(() => window.scrollTo(0, 0));
    await record("store-issue", async () => {
      await sleep(1200);
      const form = page.locator(".split").first();
      await actor.scrollTo(form, { offset: 70, ms: 800 });
      await actor.box(form, "issue-form");
      await actor.type(form.locator("textarea"), RUG_HAPPY, "description");
      await sleep(300);
      await actor.box(form.locator("input.mono"), "price");
      await actor.box(page.locator(".split .panel").nth(1), "payout-preview");
      await sleep(900);
      await signed(page.getByRole("button", { name: "Issue rug certificate" }), "issue", page.getByText("Certificate issued"));
      await sleep(1200);
      const list = page.locator("section, .section").filter({ hasText: "This store's rugs" }).last();
      await settle(page, { extra: 300 });
      const id = await latestRugId();
      state.rugHappy = id;
      saveState();
      await actor.scrollTo(card(id), { offset: 160, ms: 900 });
      await actor.box(card(id), "new-certificate");
      await actor.box(card(id).locator(".entry-no"), "certificate-no");
      await sleep(2600);
      void list;
    });
  },

  async "weaver-borrow"() {
    const id = state.rugHappy;
    await as("weaver", "/weaver");
    await page.evaluate(() => window.scrollTo(0, 0));
    await record("weaver-borrow", async () => {
      await sleep(1000);
      await actor.scrollTo(card(id), { offset: 90, ms: 900 });
      await actor.box(card(id), "rug-card");
      const months = card(id).locator(".months");
      await actor.click(months.getByText("12", { exact: true }), "months-12");
      await sleep(900);
      await actor.click(months.getByText("6", { exact: true }), "months-6");
      await page.getByText("Figures checked with the contract").first().waitFor({ timeout: 20000 });
      actor.mark("quote-checked");
      await actor.box(card(id).locator(".ledger, dl, table").first(), "fee-breakdown");
      await sleep(400);
      const ask = card(id).getByRole("button", { name: "Ask for 600.00 USDC" });
      await actor.scrollTo(ask, { offset: 520, ms: 600 });
      await actor.box(card(id).locator(".ledger, dl, table").first(), "fee-breakdown-2");
      await sleep(1400);
      await signed(ask, "ask", card(id).getByText("Waiting for an investor").first());
      await sleep(2000);
    });
  },

  async "investor-lend"() {
    const id = state.rugHappy;
    await as("investor", "/investor");
    await record("investor-lend", async () => {
      await sleep(1000);
      await actor.box(page.locator(".wallet-chip"), "wallet-chip");
      await actor.scrollTo(card(id), { offset: 140, ms: 800 });
      await actor.box(card(id), "request-card");
      await sleep(1600);
      const lend = card(id).getByRole("button", { name: "Lend 600.00 USDC" });
      await signed(lend, "lend", running(id));
      await sleep(600);
      await actor.scrollY(0, { ms: 700 });
      await actor.box(page.locator(".wallet-chip"), "wallet-chip-after");
      await sleep(2400);
    });
  },

  async "investor-after"() {
    const id = state.rugHappy;
    await as("investor", "/investor");
    await page.evaluate(() => window.scrollTo(0, 0));
    await record("investor-after", async () => {
      await sleep(600);
      await actor.box(page.locator(".wallet-chip"), "wallet-chip");
      await actor.scrollTo(running(id), { offset: 140, ms: 900 });
      await actor.box(running(id), "running-loan");
      await sleep(2600);
    });
  },

  async "weaver-repay"() {
    const id = state.rugHappy;
    await as("weaver", "/weaver");
    await page.evaluate(() => window.scrollTo(0, 0));
    await record("weaver-repay", async () => {
      await sleep(800);
      await actor.scrollTo(card(id), { offset: 110, ms: 800 });
      await actor.box(card(id), "loan-card");
      await sleep(1500);
      await signed(card(id).getByRole("button", { name: "Repay 600.00 USDC" }), "repay", card(id).getByRole("button", { name: "Collect the rug" }));
      await sleep(700);
      const collect = card(id).getByRole("button", { name: "Collect the rug" });
      await actor.scrollTo(collect, { offset: 420, ms: 700 });
      await signed(collect, "collect", card(id).getByText("Your part is signed."));
      await sleep(600);
      await actor.click(card(id).getByRole("button", { name: "Copy link for the store" }), "copy-link");
      await card(id).getByText("Link copied").waitFor({ timeout: 5000 });
      actor.mark("link-copied");
      state.handoverLink = await page.evaluate(() => navigator.clipboard.readText());
      saveState();
      await sleep(1600);
    });
  },

  async "store-handover"() {
    const link = state.handoverLink;
    if (!link) throw new Error("no hand-over link; run weaver-repay first");
    await selectAccount(ctx, extUrl, NAMES.store);
    await goto(link.replace(/^https?:\/\/[^/]+/, ""));
    await page.evaluate(() => window.scrollTo(0, 0));
    await record("store-handover", async () => {
      await sleep(1400);
      const panel = page.locator(".panel").filter({ hasText: "wants to collect rug" }).first();
      await actor.scrollTo(panel, { offset: 120, ms: 700 });
      await actor.box(panel, "cosign-panel");
      await sleep(1500);
      await signed(panel.getByRole("button", { name: "Sign to close the certificate" }), "cosign", page.locator(".handed-over"));
      await actor.box(page.locator(".handed-over"), "handed-over");
      await sleep(2800);
    });
  },

  // Unrecorded staging for the buy-out: a 1-month loan, funded, then overdue.
  async "stage-buyout"() {
    if (!state.rugBuyout) await stageIssue();
    await stageBorrowFund();
  },
};

async function stageIssue() {
  {
    await as("store", "/store");
    const form = page.locator(".split").first();
    await form.locator("textarea").fill(RUG_BUYOUT);
    beat = "stage-buyout";
    const appr = approve({ record: false });
    await page.getByRole("button", { name: "Issue rug certificate" }).click();
    await appr;
    await page.getByText("Certificate issued").waitFor({ timeout: 120000 });
    await sleep(1500);
    await settle(page);
    state.rugBuyout = await latestRugId();
    saveState();
    const id = state.rugBuyout;
    console.log(`  staged rug ${id}`);
  }
}

async function stageBorrowFund() {
  {
    const id = state.rugBuyout;
    await as("weaver", "/weaver");
    await card(id).locator(".months label").nth(0).click();
    await page.getByText("Figures checked with the contract").first().waitFor({ timeout: 20000 });
    const a2 = approve({ record: false });
    await card(id).getByRole("button", { name: "Ask for 600.00 USDC" }).click();
    await a2;
    await card(id).getByText("Waiting for an investor").first().waitFor({ timeout: 120000 });

    await as("investor", "/investor");
    const a3 = approve({ record: false });
    await card(id).getByRole("button", { name: "Lend 600.00 USDC" }).click();
    await a3;
    await running(id).waitFor({ timeout: 120000 });
    state.buyoutFundedAt = Date.now();
    saveState();
    console.log("  funded; overdue in 60 s");
  }
}

Object.assign(BEATS, {

  async buyout() {
    const id = state.rugBuyout;
    await as("store", "/store");
    // Wait until the loan is overdue and the buy-out window is open.
    for (let i = 0; i < 40; i++) {
      const c = page.locator("article.entry").filter({ hasText: no(id) }).filter({ hasText: "Buy-out window closes in" });
      if (await c.count()) break;
      await sleep(4000);
      await page.reload();
      await settle(page, { extra: 200 });
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await record("buyout", async () => {
      await sleep(900);
      await actor.scrollTo(card(id), { offset: 110, ms: 800 });
      await actor.box(card(id), "overdue-card");
      await sleep(1600);
      const buy = card(id).getByRole("button", { name: "Buy the rug for 600.00 USDC" });
      await actor.box(buy, "buy-button");
      await signed(buy, "buy", page.locator("article.entry").filter({ hasText: no(id) }).filter({ hasText: "Bought by this store" }).first());
      await sleep(900);
      await settle(page, { extra: 200 });
      const bought = page.locator("article.entry").filter({ hasText: no(id) }).filter({ hasText: "Bought by this store" }).first();
      await actor.scrollTo(bought, { offset: 160, ms: 900 });
      await actor.box(bought, "bought-card");
      await actor.box(bought.locator(".kv").filter({ hasText: "Price" }), "store-price");
      await sleep(2600);
    });
  },

  async activity() {
    await goto("/activity");
    await page.evaluate(() => window.scrollTo(0, 0));
    await actor.moveTo(1380, 300, { ms: 10 });
    await record("activity", async () => {
      await sleep(1600);
      await actor.box(page.locator("section, .section").filter({ hasText: "Ledger" }).first(), "ledger");
      await actor.scrollY(380, { ms: 1100 });
      await sleep(1200);
      await actor.scrollY(1500, { ms: 2600 });
      await sleep(900);
      await actor.scrollY(2600, { ms: 2400 });
      await sleep(1200);
    });
  },

  async "rug-timeline"() {
    await goto(`/rug/${state.rugHappy}`);
    await record("rug-timeline", async () => {
      await sleep(2500);
      await actor.scrollY(420, { ms: 1200 });
      await sleep(2500);
    });
  },

  // Unrecorded: collect a rug the weaver holds (rehearses the two-signature hand-over).
  async "rehearse-handover"(id) {
    await as("weaver", "/weaver");
    const c = card(id);
    const a1 = approve({ record: false });
    await c.getByRole("button", { name: "Collect the rug" }).click();
    await a1;
    await c.getByText("Your part is signed.").waitFor({ timeout: 60000 });
    await c.getByRole("button", { name: "Copy link for the store" }).click();
    await sleep(500);
    const link = await page.evaluate(() => navigator.clipboard.readText());
    await selectAccount(ctx, extUrl, NAMES.store);
    await goto(link.replace(/^https?:\/\/[^/]+/, ""));
    const a2 = approve({ record: false });
    await page.getByRole("button", { name: "Sign to close the certificate" }).click();
    await a2;
    await page.locator(".handed-over").waitFor({ timeout: 120000 });
    console.log("  " + (await page.locator(".handed-over").innerText()).replace(/\s+/g, " "));
  },
});

const ORDER = ["landing", "store-issue", "weaver-borrow", "investor-lend", "weaver-repay", "store-handover", "stage-buyout", "buyout", "activity"];

let code = 0;
try {
  const args = process.argv.slice(2);
  if (args[0] === "rehearse-handover") {
    beat = "rehearse-handover";
    await BEATS["rehearse-handover"](Number(args[1]));
  } else {
    const list = args[0] === "all" ? ORDER : args;
    if (args[0] === "all") {
      // A full take starts a fresh record, so verification only sees this take's hashes.
      for (const k of Object.keys(state)) delete state[k];
      state.txs = [];
      saveState();
    }
    for (const b of list) {
      if (!BEATS[b]) throw new Error(`unknown beat ${b}`);
      beat = b;
      await BEATS[b]();
    }
  }
  saveState();
} catch (e) {
  code = 1;
  console.error("FAILED in", beat, "-", e.message.split("\n").slice(0, 8).join("\n"));
  await page.screenshot({ path: join(LOGS, `fail-${beat}.png`) }).catch(() => {});
} finally {
  clearTimeout(killer);
  await ctx.close();
  process.exit(code);
}
