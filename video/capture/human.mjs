// Human-looking input plus an event log for the composition.
//
// Playwright video doesn't show the pointer, so the page never draws one. We
// log every pointer position, click, element box and named marker with
// wall-clock time; the composition draws a crisp cursor and click ripple from
// that log, frame-accurate. Coordinates are logged in CSS px and in frame px
// (CSS px x deviceScaleFactor).
import { writeFileSync } from "node:fs";
import { sleep } from "./lib.mjs";

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export class Actor {
  constructor(page, { scale = 1, log = console.log } = {}) {
    this.page = page;
    this.scale = scale;
    this.say = log;
    this.events = [];
    this.pos = { x: 720, y: 600 };
  }
  setPage(page) {
    this.page = page;
  }
  now() {
    return Date.now() / 1000;
  }
  mark(name, extra = {}) {
    this.events.push({ t: this.now(), type: "mark", name, ...extra });
    this.say(`  · ${name}${extra.hash ? " " + extra.hash : ""}`);
  }
  async box(locator, name) {
    const b = await locator.boundingBox();
    if (b) this.events.push({ t: this.now(), type: "box", name, css: b, px: this.px(b) });
    return b;
  }
  px(b) {
    const s = this.scale;
    return { x: b.x * s, y: b.y * s, width: b.width * s, height: b.height * s };
  }
  /** Move the real mouse along an eased, slightly curved path. */
  async moveTo(x, y, { ms = 520 } = {}) {
    const from = { ...this.pos };
    const dist = Math.hypot(x - from.x, y - from.y);
    const dur = Math.max(220, Math.min(ms, 260 + dist * 0.55));
    const steps = Math.max(10, Math.round(dur / 16));
    const bend = Math.min(40, dist * 0.08);
    const nx = -(y - from.y) / (dist || 1);
    const ny = (x - from.x) / (dist || 1);
    for (let i = 1; i <= steps; i++) {
      const k = ease(i / steps);
      const arc = Math.sin(Math.PI * k) * bend;
      const px = from.x + (x - from.x) * k + nx * arc;
      const py = from.y + (y - from.y) * k + ny * arc;
      await this.page.mouse.move(px, py);
      this.events.push({ t: this.now(), type: "move", x: px * this.scale, y: py * this.scale });
      await sleep(dur / steps);
    }
    this.pos = { x, y };
  }
  /** Move to a locator (scrolling it into view first) and click it. */
  async click(locator, name, { settle = 110, dwell = 0, at } = {}) {
    await locator.scrollIntoViewIfNeeded();
    const b = await this.box(locator, name);
    if (!b) throw new Error(`no box for ${name}`);
    const tx = at ? b.x + at.x : b.x + b.width * 0.5 + Math.min(18, b.width * 0.12);
    const ty = at ? b.y + at.y : b.y + b.height * 0.55;
    await this.moveTo(tx, ty);
    await sleep(settle + dwell);
    this.events.push({ t: this.now(), type: "click", name, x: tx * this.scale, y: ty * this.scale, px: this.px(b) });
    await this.page.mouse.down();
    await sleep(70);
    await this.page.mouse.up();
    this.say(`  > click ${name}`);
  }
  async hover(locator, name, { dwell = 400 } = {}) {
    await locator.scrollIntoViewIfNeeded();
    const b = await this.box(locator, name);
    await this.moveTo(b.x + b.width * 0.5, b.y + b.height * 0.5);
    await sleep(dwell);
  }
  /** Park the pointer somewhere neutral so it never sits on a label. */
  async park(x = 1330, y = 760) {
    await this.moveTo(x, y, { ms: 420 });
  }
  async type(locator, text, name, { delay = 32 } = {}) {
    await this.click(locator, name);
    this.mark(`type:${name}`);
    for (const ch of text) {
      await this.page.keyboard.type(ch);
      await sleep(delay + (ch === " " ? 25 : Math.random() * 18));
    }
  }
  /** Smoothly scroll the window so `locator` sits `offset` CSS px from the top. */
  async scrollTo(locator, { offset = 140, ms = 700 } = {}) {
    const top = await locator.evaluate((el, off) => window.scrollY + el.getBoundingClientRect().top - off, offset);
    await this.scrollY(top, { ms });
  }
  async scrollY(target, { ms = 700 } = {}) {
    const start = await this.page.evaluate(() => window.scrollY);
    const max = await this.page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    const end = Math.max(0, Math.min(max, target));
    const steps = Math.max(8, Math.round(ms / 16));
    for (let i = 1; i <= steps; i++) {
      const y = start + (end - start) * ease(i / steps);
      await this.page.evaluate((v) => window.scrollTo(0, v), y);
      await sleep(ms / steps);
    }
    this.mark("scrolled", { y: end });
  }
  save(file, extra = {}) {
    writeFileSync(file, JSON.stringify({ scale: this.scale, ...extra, events: this.events }, null, 1));
  }
}
