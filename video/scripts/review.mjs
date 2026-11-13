// Review aids for a rendered master.
//
//   node scripts/review.mjs [out/rugdealer-demo-60s.mp4]
//
// Writes:
//   out/contact-sheet.jpg           every 2 s, labelled with its timecode (one image)
//   .cache/review/beats/<beat>.jpg  3x3 sheet per beat
//   .cache/review/480/*.jpg         beat-midpoint frames scaled to 854x480 (caption legibility)
//   .cache/review/phone/*.jpg       the same at 390 px wide (a phone-sized player)
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { ffmpegPath } from "../capture/lib.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const file = resolve(process.argv[2] ?? join(ROOT, "out", "rugdealer-demo-60s.mp4"));
const FF = ffmpegPath();
const R = join(ROOT, ".cache", "review");
rmSync(R, { recursive: true, force: true });
for (const d of ["beats", "480", "phone", "t"]) mkdirSync(join(R, d), { recursive: true });
const ff = (args) => execFileSync(FF, ["-y", "-loglevel", "error", ...args], { cwd: ROOT });
const { rows, total } = JSON.parse(execFileSync("node", ["scripts/timeline-report.mjs", "--json"], { cwd: ROOT }).toString());

// Contact sheet: one frame every 2 s, timecode burned in, 6 across.
// drawtext needs a font path without a drive colon: copy one into the cache.
const font = ".cache/review/font.ttf";
for (const f of ["C:/Windows/Fonts/consola.ttf", "/System/Library/Fonts/Menlo.ttc", "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"])
  if (existsSync(f)) {
    copyFileSync(f, join(ROOT, font));
    break;
  }
ff([
  "-i", file,
  "-vf", `fps=1/2,scale=480:-1,drawtext=fontfile='${font}':text='%{pts\\:hms}':x=8:y=8:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.6,tile=6x5:padding=4:margin=4:color=0x1c2440`,
  "-frames:v", "1", "-q:v", "3",
  join(ROOT, "out", "contact-sheet.jpg"),
]);
console.log("wrote out/contact-sheet.jpg");

for (const r of rows.filter((x) => x.total)) {
  const [a, b] = r.total;
  const step = (b - a) / 9;
  ff(["-ss", String(a), "-t", String(b - a), "-i", file, "-vf", `fps=1/${step.toFixed(3)},scale=640:-1,tile=3x3:padding=3`, "-frames:v", "1", "-q:v", "3", join(R, "beats", `${r.beat}.jpg`)]);
  for (const c of r.captions) {
    const t = ((Number(c[0]) + Number(c[1])) / 2).toFixed(2);
    ff(["-ss", t, "-i", file, "-frames:v", "1", "-vf", "scale=854:480", join(R, "480", `${t}.jpg`)]);
    ff(["-ss", t, "-i", file, "-frames:v", "1", "-vf", "scale=390:-1", join(R, "phone", `${t}.jpg`)]);
  }
  ff(["-ss", String(a + 0.05), "-i", file, "-frames:v", "1", "-vf", "scale=960:-1", join(R, "t", `in-${r.beat}.jpg`)]);
}
console.log(`review frames in .cache/review (total ${total.toFixed(2)} s)`);
