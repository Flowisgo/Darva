// Measure the landing clip's vertical scroll per frame (row-profile matching
// against the first frame), so overlays in clip space can follow the page.
//   node scripts/track-scroll.mjs <clip> <fromS> <toS> > out.json
import { execFileSync } from "node:child_process";
import { ffmpegPath } from "../capture/lib.mjs";
const [clip, a, b] = process.argv.slice(2);
const W = 1920, H = 1080, X0 = 230, X1 = 900, FPS = 60;
const grab = (args) => execFileSync(ffmpegPath(), ["-loglevel", "error", ...args, "-vf", `crop=${X1 - X0}:${H}:${X0}:0,format=gray`, "-f", "rawvideo", "-"], { maxBuffer: 1 << 30 });
const prof = (buf, off, w) => { const p = new Float64Array(H); for (let y = 0; y < H; y++) { let s = 0; for (let x = 0; x < w; x++) s += buf[off + y * w + x]; p[y] = s / w; } return p; };
const w = X1 - X0;
const ref = prof(grab(["-ss", "0.3", "-i", clip, "-frames:v", "1"]), 0, w);
const raw = grab(["-ss", a, "-i", clip, "-t", String(b - a)]);
const n = raw.length / (w * H);
let last = 0; const out = [];
for (let i = 0; i < n; i++) {
  const p = prof(raw, i * w * H, w);
  let best = 1e18, bd = last;
  for (let d = Math.max(0, last - 5); d <= Math.min(900, last + 120); d++) {
    let s = 0, c = 0;
    for (let y = 0; y + d < H && y < H; y += 2) { s += Math.abs(p[y] - ref[y + d]); c++; }
    s /= c; if (s < best) { best = s; bd = d; }
  }
  last = bd; out.push([+(Number(a) + i / FPS).toFixed(4), bd, +best.toFixed(2)]);
}
console.log(JSON.stringify(out));
