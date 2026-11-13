// Shrink the assembled capture clips for git: re-encode at CRF 16 (visually
// lossless next to the CRF 18 master) and cut idle tails. Frame timing is
// unchanged, so the event logs still line up.
//
//   node scripts/pack-clips.mjs
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, renameSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { ffmpegPath } from "../capture/lib.mjs";

const CLIPS = resolve(import.meta.dirname, "..", "assets", "clips");
const FF = ffmpegPath();
// Seconds to keep, where a clip runs on after the last moment the cut uses.
const KEEP = { "investor-lend": 25 };

for (const d of readdirSync(CLIPS)) {
  const f = join(CLIPS, d, "clip.mp4");
  if (!existsSync(f) || d === "rug-timeline") continue;
  const before = statSync(f).size;
  const tmp = join(CLIPS, d, "clip.packed.mp4");
  const t = KEEP[d] ? ["-t", String(KEEP[d])] : [];
  execFileSync(FF, ["-y", "-loglevel", "error", "-i", f, ...t, "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p", "-an", "-movflags", "+faststart", tmp]);
  renameSync(tmp, f);
  console.log(`${d.padEnd(26)} ${(before / 1e6).toFixed(1)} MB -> ${(statSync(f).size / 1e6).toFixed(1)} MB`);
}
