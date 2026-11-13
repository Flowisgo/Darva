// Shared capture helpers: browser launch with Varial, wallet secrets, paths.
// Secrets are read through the Stellar CLI and passed straight to the
// extension's input fields. They are never printed, logged or written.
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";

export const HERE = dirname(fileURLToPath(import.meta.url));
export const VIDEO = join(HERE, "..");
export const ASSETS = join(VIDEO, "assets");
export const CLIPS = join(ASSETS, "clips");
export const STATE = process.env.RUGDEALER_STATE || join(homedir(), ".rugdealer-demo");
export const CLI_CONFIG = join(STATE, "config");
export const EXT_DIR = join(STATE, "varial-ext");
export const PROFILE = join(STATE, "varial-profile");
export const APP = process.env.APP_URL || "http://localhost:3100";
export const W = 1920;
export const H = 1080;

/** The throwaway wallet password for the capture profile (kept in STATE). */
export function walletPassword() {
  const f = join(STATE, "varial-password");
  if (!existsSync(f)) writeFileSync(f, randomBytes(18).toString("base64url"), { mode: 0o600 });
  return readFileSync(f, "utf8").trim();
}

/** A demo identity's secret key, read through the Stellar CLI. Never log it. */
export function secretOf(identity) {
  return execFileSync("stellar", ["keys", "secret", identity, "--config-dir", CLI_CONFIG], { encoding: "utf8" }).trim();
}
export function addressOf(identity) {
  return execFileSync("stellar", ["keys", "address", identity, "--config-dir", CLI_CONFIG], { encoding: "utf8" }).trim();
}

/** Capture geometry: a 1440x810 CSS viewport at 4/3 device pixels renders
 * exactly 1920x1080. The app's content column fills the frame instead of
 * floating in a 1920-wide page, and text is a third larger. */
export const VIEW = { width: 1440, height: 810 };
export const DSF = 4 / 3;

// Capture-only page styling, injected by the browser, never shipped: hide
// scrollbars and freeze the blinking caret. Applies to the app origin only.
const CAPTURE_CSS = `
  html { scrollbar-width: none; }
  ::-webkit-scrollbar { display: none; }
  * { caret-color: transparent !important; }
`;

export async function launch({ headless = false } = {}) {
  mkdirSync(PROFILE, { recursive: true });
  const ctx = await chromium.launchPersistentContext(PROFILE, {
    headless,
    viewport: VIEW,
    deviceScaleFactor: DSF,
    colorScheme: "light",
    locale: "en-GB",
    timezoneId: "Europe/Istanbul",
    args: [
      `--disable-extensions-except=${EXT_DIR}`,
      `--load-extension=${EXT_DIR}`,
      "--hide-scrollbars",
      "--disable-features=Translate,PasswordManagerOnboarding",
      "--no-default-browser-check",
      "--window-size=1500,960",
    ],
  });
  await ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: new URL(APP).origin });
  await ctx.addInitScript(
    ({ css, origin }) => {
      if (location.origin !== origin) return;
      const add = () => {
        const s = document.createElement("style");
        s.dataset.capture = "1";
        s.textContent = css;
        document.head.appendChild(s);
      };
      if (document.head) add();
      else document.addEventListener("DOMContentLoaded", add);
    },
    { css: CAPTURE_CSS, origin: new URL(APP).origin },
  );
  let [sw] = ctx.serviceWorkers();
  if (!sw) sw = await ctx.waitForEvent("serviceworker", { timeout: 20000 });
  const extId = new URL(sw.url()).host;
  return { ctx, extId, extUrl: (hash = "") => `chrome-extension://${extId}/index.html${hash}` };
}

/** Wait for fonts, the ledger to load (no skeletons) and two quiet frames. */
export async function settle(page, { extra = 600 } = {}) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  await page
    .waitForFunction(() => !document.querySelector(".skeleton, [aria-busy=true], .loading") && !/Reading the ledger from testnet|Checking with the contract/i.test(document.body.innerText), null, { timeout: 30000 })
    .catch(() => {});
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  await sleep(extra);
}

/** ffmpeg: $FFMPEG, else PATH, else a winget install (Gyan.FFmpeg). */
export function ffmpegPath(bin = "ffmpeg") {
  const env = process.env[bin.toUpperCase()];
  if (env) return env;
  try {
    execFileSync(bin, ["-version"], { stdio: "ignore" });
    return bin;
  } catch {}
  const root = join(process.env.LOCALAPPDATA || "", "Microsoft", "WinGet", "Packages");
  if (existsSync(root))
    for (const d of readdirSync(root).filter((x) => x.startsWith("Gyan.FFmpeg")))
      for (const sub of readdirSync(join(root, d))) {
        const exe = join(root, d, sub, "bin", `${bin}.exe`);
        if (existsSync(exe)) return exe;
      }
  return bin;
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
