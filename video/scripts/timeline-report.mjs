// Print the cut: each beat and segment with output in/out, source range and speed.
//   node scripts/timeline-report.mjs [--json]
import { build } from "esbuild";
import { mkdirSync } from "node:fs";

import { join } from "node:path";
import { pathToFileURL } from "node:url";

mkdirSync(".cache", { recursive: true });
const out = join(process.cwd(), ".cache", "timeline.mjs");
await build({ entryPoints: ["src/timeline.ts"], bundle: true, platform: "node", format: "esm", outfile: out, logLevel: "error", external: ["remotion", "@remotion/*", "react"] });
const { BEATS, TX_ON_SCREEN } = await import(pathToFileURL(out).href);
const FPS = 60;
const fr = (s) => Math.round(s * FPS);
let f = 0;
const rows = [];
for (const b of BEATS) {
  const start = f;
  if (b.card) f += fr(b.cardSeconds ?? 4);
  for (const s of b.segs) {
    const d = Math.max(1, fr((s.to - s.from) / s.speed));
    rows.push({ beat: b.id, out: [f / FPS, (f + d) / FPS], clip: s.clip, src: [s.from, s.to], speed: s.speed, popup: !!s.popup });
    f += d;
  }
  rows.push({ beat: b.id, total: [start / FPS, f / FPS], captions: b.captions.map((c) => [((start + fr(c.at)) / FPS).toFixed(2), ((start + fr(c.to)) / FPS).toFixed(2), c.lines.join(" / ")]) });
}
if (process.argv.includes("--json")) console.log(JSON.stringify({ total: f / FPS, rows, tx: TX_ON_SCREEN }, null, 1));
else {
  for (const r of rows) {
    if (r.total) {
      console.log(`== ${r.beat.padEnd(14)} ${r.total[0].toFixed(2)}–${r.total[1].toFixed(2)}  (${(r.total[1] - r.total[0]).toFixed(2)} s)`);
      for (const c of r.captions) console.log(`     cap ${c[0]}–${c[1]}  ${c[2]}`);
    } else console.log(`   ${r.out[0].toFixed(2)}–${r.out[1].toFixed(2)}  ${r.clip.padEnd(15)} ${r.src[0].toFixed(2)}→${r.src[1].toFixed(2)} @${r.speed}${r.popup ? "  [Varial]" : ""}`);
  }
  console.log(`TOTAL ${(f / FPS).toFixed(2)} s, ${f} frames`);
}
