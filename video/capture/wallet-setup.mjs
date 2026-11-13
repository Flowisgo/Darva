// One-time setup of the capture profile's Varial wallet.
//
//   node capture/wallet-setup.mjs
//
// Creates a throwaway Varial wallet in STATE/varial-profile (password in
// STATE/varial-password), switches it to Testnet and imports the demo
// identities from the Stellar CLI config. Idempotent: re-running skips what is
// already done. Nothing is recorded or screenshotted while a secret is on
// screen, and secrets are never printed.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { addressOf, launch, secretOf, sleep, STATE, walletPassword } from "./lib.mjs";

export const WALLET_ACCOUNTS = [
  { id: "rd-store", name: "Kaya Rug House" },
  { id: "rd-weaver", name: "Ayşe the weaver" },
  { id: "rd-investor", name: "Deniz the investor" },
];

const MARK = join(STATE, "varial-imported.json");
const done = existsSync(MARK) ? JSON.parse(readFileSync(MARK, "utf8")) : {};

const { ctx, extId, extUrl } = await launch();

/** Open the wallet sheet, closing any overlay a previous step left open. */
async function openSheet(p) {
  for (let i = 0; i < 4; i++) {
    if (!(await p.locator(".LoadingBackground--active").count())) break;
    await p.keyboard.press("Escape");
    await sleep(500);
    if (await p.locator(".LoadingBackground--active").count()) {
      await p.reload();
      await sleep(2000);
    }
  }
  await p.getByTestId("account-chip").click();
  await sleep(700);
}
const kill = setTimeout(() => {
  console.error("wallet-setup: timed out");
  process.exit(2);
}, 240000);
try {
  await sleep(2000);
  const p = ctx.pages().find((x) => x.url().includes(extId)) || (await ctx.newPage());
  await p.goto(extUrl("#/"));
  await sleep(2000);

  if (/welcome/.test(p.url())) {
    console.log("creating wallet");
    await p.getByText("Create new wallet").click();
    await sleep(800);
    const pw = walletPassword();
    await p.locator("input[type=password]").nth(0).fill(pw);
    await p.locator("input[type=password]").nth(1).fill(pw);
    await p.locator("input[type=checkbox]").check({ force: true });
    await p.getByRole("button", { name: "Confirm" }).click();
    await p.getByText("Do this later").click({ timeout: 15000 });
    await sleep(2500);
    await p.goto(extUrl("#/"));
    await sleep(2000);
  }
  if (await p.locator("input[type=password]").count()) {
    await p.locator("input[type=password]").first().fill(walletPassword());
    await p.keyboard.press("Enter");
    await sleep(2500);
  }

  // Testnet.
  await p.getByTestId("account-chip").click();
  await sleep(600);
  await p.getByTestId("account-sheet-settings").click();
  await sleep(600);
  await p.getByTestId("settings-network-link").click();
  await sleep(800);
  await p.getByTestId("network-settings-select").selectOption({ label: "Test Net" });
  await sleep(1500);
  console.log("network:", await p.getByTestId("network-settings-select").inputValue());

  for (const a of WALLET_ACCOUNTS) {
    const address = addressOf(a.id);
    if (done[a.id] === address) {
      console.log(`already imported: ${a.name}`);
      continue;
    }
    await p.goto(extUrl("#/"));
    await sleep(1500);
    await openSheet(p);
    await p.getByTestId("add-wallet").click();
    await sleep(600);
    await p.getByText("Import a Stellar secret key").click();
    await sleep(800);
    await p.locator("input[placeholder='Your Stellar secret key']").fill(secretOf(a.id));
    await p.locator("input[placeholder='Enter password']").fill(walletPassword());
    await p.locator("input[type=checkbox]").check({ force: true });
    await p.getByTestId("import-account-button").click();
    await sleep(3000);
    if (/account\/import/.test(p.url())) {
      // Leave the import screen before reporting, so nothing secret stays up.
      const err = (await p.innerText("body")).match(/(invalid|already|error)[^\n]*/i)?.[0] ?? "unknown";
      await p.goto(extUrl("#/"));
      throw new Error(`import of ${a.name} failed: ${err}`);
    }
    done[a.id] = address;
    writeFileSync(MARK, JSON.stringify(done, null, 2));
    console.log(`imported: ${a.name} ${address.slice(0, 6)}…`);

    // Rename the account so the wallet shows the demo name.
    try {
      await p.goto(extUrl("#/"));
      await sleep(1500);
      await openSheet(p);
      await p.getByTestId("wallets-header-edit-name").click();
      await sleep(600);
      const input = p.locator("input:visible").first();
      await input.fill(a.name);
      await p.keyboard.press("Enter");
      await sleep(1200);
    } catch (e) {
      console.log(`rename skipped for ${a.name}: ${e.message.split("\n")[0]}`);
    }
  }

  await p.goto(extUrl("#/"));
  await sleep(1500);
  await openSheet(p);
  console.log("wallets:", (await p.getByTestId("AccountSheet").innerText()).replace(/\s+/g, " ").slice(0, 400));
} finally {
  clearTimeout(kill);
  await ctx.close();
}
