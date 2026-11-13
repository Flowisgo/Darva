// Record a page with CDP Page.startScreencast: JPEG frames with wall-clock
// timestamps, assembled afterwards into a constant-60 fps H.264 clip.
// Playwright's recordVideo is ~25 fps VP8; this keeps every painted frame at
// full resolution.
import { execFileSync } from "node:child_process";
import { copyFileSync, linkSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { ffmpegPath } from "./lib.mjs";

export async function startRecording(page, dir, { width = 1920, height = 1080, quality = 92 } = {}) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(join(dir, "frames"), { recursive: true });
  const cdp = await page.context().newCDPSession(page);
  const frames = [];
  let n = 0;
  let stopped = false;
  cdp.on("Page.screencastFrame", async ({ data, metadata, sessionId }) => {
    if (!stopped) {
      const file = `f${String(n++).padStart(5, "0")}.jpg`;
      writeFileSync(join(dir, "frames", file), Buffer.from(data, "base64"));
      frames.push({ file, t: metadata.timestamp ?? Date.now() / 1000 });
    }
    await cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
  });
  await cdp.send("Page.startScreencast", { format: "jpeg", quality, maxWidth: width, maxHeight: height, everyNthFrame: 1 });
  const t0 = Date.now() / 1000;
  // Nudge a repaint so the first frame arrives at once even on a static page.
  await page.evaluate(() => {
    const d = document.createElement("div");
    d.style.cssText = "position:fixed;left:0;top:0;width:1px;height:1px;opacity:0.01;pointer-events:none";
    document.body.appendChild(d);
    requestAnimationFrame(() => requestAnimationFrame(() => d.remove()));
  }).catch(() => {});
  return {
    t0,
    async stop() {
      const t1 = Date.now() / 1000;
      stopped = true;
      await cdp.send("Page.stopScreencast").catch(() => {});
      await cdp.detach().catch(() => {});
      writeFileSync(join(dir, "frames.json"), JSON.stringify({ t0, t1, frames }, null, 1));
      return { t0, t1, count: frames.length };
    },
  };
}

/**
 * frames/*.jpg + frames.json -> clip.mp4 at exactly `fps`, starting at t0.
 * Output frame k shows the newest captured frame painted at or before
 * t0 + k/fps, so clip time maps 1:1 to wall-clock time in the event logs.
 * The sequence is built from hard links, so it costs no extra disk.
 */
export function assemble(dir, { fps = 60, out = join(resolve(dir), "clip.mp4"), width = 1920, height = 1080 } = {}) {
  const { t0, t1, frames } = JSON.parse(readFileSync(join(dir, "frames.json"), "utf8"));
  if (!frames.length) throw new Error(`no frames in ${dir}`);
  const seq = join(dir, "seq");
  rmSync(seq, { recursive: true, force: true });
  mkdirSync(seq);
  const total = Math.max(1, Math.round((t1 - t0) * fps));
  let j = 0;
  for (let k = 0; k < total; k++) {
    const t = t0 + k / fps;
    while (j + 1 < frames.length && frames[j + 1].t <= t) j++;
    const src = join(dir, "frames", frames[j].file);
    const dst = join(seq, `${String(k).padStart(6, "0")}.jpg`);
    try {
      linkSync(src, dst);
    } catch {
      copyFileSync(src, dst);
    }
  }
  execFileSync(
    ffmpegPath(),
    [
      "-y", "-loglevel", "error",
      "-framerate", String(fps), "-i", join(seq, "%06d.jpg"),
      "-vf", `scale=${width}:${height}:flags=lanczos`,
      "-c:v", "libx264", "-preset", "medium", "-crf", "12", "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
      resolve(out),
    ],
    { stdio: "inherit" },
  );
  rmSync(seq, { recursive: true, force: true });
  return { out, duration: t1 - t0, frames: frames.length };
}
