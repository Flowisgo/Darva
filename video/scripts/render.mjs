// Render the demo and check it against the spec.
//
//   node scripts/render.mjs master     -> out/rugdealer-demo-60s.mp4 (silent) + .srt
//   node scripts/render.mjs narrated   -> out/rugdealer-demo-60s-narrated.mp4 (needs assets/audio/narration.wav)
//   node scripts/render.mjs poster     -> out/poster.jpg
//   node scripts/render.mjs srt        -> out/rugdealer-demo-60s.srt
//   node scripts/render.mjs check <file> [--audio]
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { ffmpegPath } from "../capture/lib.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const OUT = join(ROOT, "out");
const TMP = join(ROOT, ".cache", "tmp");
mkdirSync(OUT, { recursive: true });
mkdirSync(TMP, { recursive: true });
// Remotion and its ffmpeg write to the temp dir; keep that inside the project
// (some sandboxes deny the system temp dir to child processes).
const env = { ...process.env, TEMP: TMP, TMP, TMPDIR: TMP };
const FFMPEG = ffmpegPath();
const FFPROBE = ffmpegPath("ffprobe");

function remotion(args) {
  const r = spawnSync(process.platform === "win32" ? "npx.cmd" : "npx", ["remotion", ...args, "--log=error"], { cwd: ROOT, env, stdio: "inherit", shell: process.platform === "win32" });
  if (r.status !== 0) throw new Error(`remotion ${args[0]} failed (${r.status})`);
}

/**
 * Final encode from Remotion's high-quality intermediate: Remotion stitches its
 * JPEG frames as full-range yuvj420p, so the delivery file is encoded here as
 * TV-range yuv420p, BT.709-tagged, CRF 18, +faststart.
 */
function finalEncode(src, file, { audio = false } = {}) {
  execFileSync(FFMPEG, [
    "-y", "-loglevel", "error", "-i", src,
    "-vf", "scale=in_range=full:out_range=tv:out_color_matrix=bt709,format=yuv420p",
    "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-profile:v", "high", "-r", "60",
    "-color_range", "tv", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
    ...(audio ? ["-c:a", "aac", "-b:a", "192k"] : ["-an"]),
    "-movflags", "+faststart", file,
  ]);
  rmSync(src);
}

export function check(file, { audio = false } = {}) {
  const j = JSON.parse(execFileSync(FFPROBE, ["-v", "error", "-show_streams", "-show_format", "-of", "json", file]).toString());
  const v = j.streams.find((s) => s.codec_type === "video");
  const a = j.streams.filter((s) => s.codec_type === "audio");
  const dur = Number(j.format.duration);
  const mb = statSync(file).size / 1e6;
  const moovFirst = (() => {
    // +faststart: the moov atom comes before mdat.
    const buf = execFileSync("node", ["-e", `const b=require('fs').readFileSync(${JSON.stringify(file)}).subarray(0,1<<20);process.stdout.write(String(b.indexOf('moov')<b.indexOf('mdat')||b.indexOf('mdat')<0))`]).toString();
    return buf === "true";
  })();
  const checks = [
    ["duration 58.0–60.0 s", dur >= 58 && dur <= 60, `${dur.toFixed(3)} s`],
    ["1920x1080", v.width === 1920 && v.height === 1080, `${v.width}x${v.height}`],
    ["60 fps", v.r_frame_rate === "60/1", v.r_frame_rate],
    ["H.264", v.codec_name === "h264", v.codec_name],
    ["yuv420p", v.pix_fmt === "yuv420p", v.pix_fmt],
    [audio ? "audio stream present" : "no audio stream", audio ? a.length === 1 : a.length === 0, `${a.length} audio`],
    ["under 60 MB", mb < 60, `${mb.toFixed(1)} MB`],
    ["+faststart (moov before mdat)", moovFirst, String(moovFirst)],
  ];
  let ok = true;
  for (const [name, pass, got] of checks) {
    console.log(`  ${pass ? "ok  " : "FAIL"} ${name.padEnd(30)} ${got}`);
    ok &&= pass;
  }
  if (!ok) throw new Error(`${file} does not meet the spec`);
  return { dur, mb };
}

async function srt() {
  const { rows } = JSON.parse(execFileSync("node", ["scripts/timeline-report.mjs", "--json"], { cwd: ROOT }).toString());
  const ts = (s) => {
    const ms = Math.round(Number(s) * 1000);
    const p = (n, w = 2) => String(n).padStart(w, "0");
    return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
  };
  const caps = rows.filter((r) => r.captions).flatMap((r) => r.captions.map((c) => ({ from: c[0], to: Math.min(Number(c[1]), r.total[1]), text: c[2] })));
  const body = caps.map((c, i) => `${i + 1}\n${ts(c.from)} --> ${ts(c.to)}\n${c.text.split(" / ").join("\n")}\n`).join("\n");
  writeFileSync(join(OUT, "rugdealer-demo-60s.srt"), body);
  console.log(`wrote out/rugdealer-demo-60s.srt (${caps.length} captions)`);
}

const [what, arg] = process.argv.slice(2);
if (what === "master") {
  const f = join(OUT, "rugdealer-demo-60s.mp4");
  const mid = join(TMP, "master-intermediate.mp4");
  remotion(["render", "src/index.ts", "Demo", mid, "--muted", "--crf=10"]);
  finalEncode(mid, f);
  check(f);
  await srt();
} else if (what === "narrated") {
  if (!existsSync(join(ROOT, "assets", "audio", "narration.wav"))) {
    console.error("No assets/audio/narration.wav. Record narration.md (see README), then run this again.");
    process.exit(2);
  }
  const f = join(OUT, "rugdealer-demo-60s-narrated.mp4");
  const mid = join(TMP, "narrated-intermediate.mp4");
  remotion(["render", "src/index.ts", "DemoNarrated", mid, "--crf=10", "--audio-codec=aac"]);
  finalEncode(mid, f, { audio: true });
  check(f, { audio: true });
} else if (what === "poster") {
  const log = JSON.parse(readFileSync(join(ROOT, "capture", "logs", "weaver-borrow.json"), "utf8"));
  const t = log.events.find((e) => e.name === "fee-breakdown-2").t - log.t0 + 0.8; // = posterTime() in src/Poster.tsx
  execFileSync(FFMPEG, ["-y", "-loglevel", "error", "-ss", t.toFixed(3), "-i", join(ROOT, "assets", "clips", "weaver-borrow", "clip.mp4"), "-frames:v", "1", "-q:v", "2", join(ROOT, "assets", "poster-frame.jpg")]);
  remotion(["still", "src/index.ts", "Poster", join(OUT, "poster.jpg"), "--image-format=jpeg", "--jpeg-quality=92"]);
} else if (what === "srt") {
  await srt();
} else if (what === "check") {
  check(resolve(arg), { audio: process.argv.includes("--audio") });
} else {
  console.error("usage: node scripts/render.mjs master|narrated|poster|srt|check <file>");
  process.exit(2);
}
