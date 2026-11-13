// Drive Varial from Playwright: choose the selected account, approve popups.
import { sleep, walletPassword } from "./lib.mjs";

async function unlockIfNeeded(p) {
  if (await p.locator("input[type=password]").count()) {
    await p.locator("input[type=password]").first().fill(walletPassword());
    await p.keyboard.press("Enter");
    await sleep(2500);
  }
}

async function openSheet(p) {
  for (let i = 0; i < 4 && (await p.locator(".LoadingBackground--active").count()); i++) {
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

/** Make `name` the account Varial has selected. Uses a background tab. */
export async function selectAccount(ctx, extUrl, name) {
  const p = await ctx.newPage();
  try {
    await p.goto(extUrl("#/"));
    await sleep(1800);
    await unlockIfNeeded(p);
    const current = (await p.getByTestId("account-chip").innerText()).trim();
    if (current.includes(name)) return;
    await openSheet(p);
    await p.getByTestId("wallet-row-select").filter({ hasText: name }).first().click();
    await sleep(1500);
    const now = (await p.getByTestId("account-chip").innerText()).trim();
    if (!now.includes(name)) throw new Error(`Varial: could not select ${name} (shows ${now})`);
  } finally {
    await p.close();
  }
}

/** Unlock Varial (the extension locks itself after a while). */
export async function unlock(ctx, extUrl) {
  const p = await ctx.newPage();
  await p.goto(extUrl("#/"));
  await sleep(1800);
  await unlockIfNeeded(p);
  await p.close();
}

export const APPROVE = /^(Connect|Confirm|Sign|Approve|Sign transaction|Confirm transaction|Continue)$/i;

/**
 * Wait for the next Varial popup window, let it settle, optionally call
 * `onOpen(popup)` (e.g. to start recording it), then press its approve button.
 * Returns the popup's visible text for the log.
 */
export async function approveNextPopup(ctx, extId, { onOpen, dwellMs = 1600, timeout = 60000, log = console.log } = {}) {
  const popup = await ctx.waitForEvent("page", { predicate: (pg) => pg.url().includes(extId), timeout });
  await popup.waitForLoadState("domcontentloaded");
  await sleep(1200);
  await unlockIfNeeded(popup);
  if (onOpen) await onOpen(popup);
  const text = (await popup.innerText("body").catch(() => "")).replace(/\s+\n/g, "\n");
  log(`[varial popup] ${popup.url().split("#")[1] ?? ""}\n${text.slice(0, 700)}`);
  await sleep(dwellMs);
  // Some screens need a scroll or a checkbox before the button enables.
  const box = popup.locator("input[type=checkbox]:visible");
  for (let i = 0; i < (await box.count()); i++) await box.nth(i).check({ force: true }).catch(() => {});
  const btn = popup.getByRole("button", { name: APPROVE }).last();
  await btn.waitFor({ state: "visible", timeout: 15000 });
  for (let i = 0; i < 20 && (await btn.isDisabled()); i++) await sleep(500);
  await btn.click();
  return { popup, text };
}
