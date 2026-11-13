import React from "react";
import { AbsoluteFill, Easing, interpolate, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/SchibstedGrotesk";
import { clicks, pointer, type Box, type Log } from "./log";

export const { fontFamily } = loadFont("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin", "latin-ext"] });

export const C = {
  wall: "#e7e4dc",
  cotton: "#f7f5f0",
  ink: "#1c2440",
  slate: "#5e6475",
  madder: "#9b2a22",
  saffron: "#cf9f2f",
  wool: "#f1e8d5",
  indigo: "#24346b",
};
export const W = 1920;
export const H = 1080;
const easeIO = Easing.bezier(0.45, 0, 0.2, 1);

// ------------------------------------------------------------------ camera

export type Cam = { s: number; x: number; y: number }; // zoom and focus point in frame px
export type CamKey = Cam & { t: number }; // t = clip seconds

export function camAt(keys: CamKey[] | undefined, t: number): Cam {
  if (!keys || !keys.length) return { s: 1, x: W / 2, y: H / 2 };
  if (t <= keys[0].t) return keys[0];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i].t) {
      const a = keys[i - 1];
      const b = keys[i];
      const k = easeIO((t - a.t) / Math.max(1e-6, b.t - a.t));
      return { s: a.s + (b.s - a.s) * k, x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
    }
  }
  return keys[keys.length - 1];
}

/** Translate for a camera, clamped so the frame stays covered. */
export function camTransform(c: Cam) {
  const tx = Math.min(0, Math.max(W - W * c.s, W / 2 - c.x * c.s));
  const ty = Math.min(0, Math.max(H - H * c.s, H / 2 - c.y * c.s));
  return { tx, ty, s: c.s, css: `translate(${tx}px, ${ty}px) scale(${c.s})` };
}

// ------------------------------------------------------------------ cursor

export const Cursor: React.FC<{ x: number; y: number; scale?: number; down?: number }> = ({ x, y, scale = 1, down = 0 }) => (
  <svg
    width={34}
    height={40}
    viewBox="0 0 34 40"
    style={{
      position: "absolute",
      left: x - 6,
      top: y - 3,
      transform: `scale(${scale * (1 - 0.12 * down)})`,
      transformOrigin: "6px 3px",
      filter: "drop-shadow(0 3px 5px rgba(20,24,40,.35))",
      pointerEvents: "none",
    }}
  >
    <path d="M6 3 L6 31 L13 24.5 L18 36 L23 33.8 L18 22.6 L27.5 22.6 Z" fill={C.ink} stroke="#fff" strokeWidth={2.4} strokeLinejoin="round" />
  </svg>
);

export const Ripple: React.FC<{ x: number; y: number; age: number }> = ({ x, y, age }) => {
  if (age < 0 || age > 0.65) return null;
  const k = age / 0.65;
  const r = 14 + 46 * Easing.out(Easing.cubic)(k);
  return (
    <div
      style={{
        position: "absolute",
        left: x - r,
        top: y - r,
        width: r * 2,
        height: r * 2,
        borderRadius: "50%",
        border: `4px solid ${C.saffron}`,
        opacity: 1 - k,
        boxShadow: `0 0 0 ${8 * (1 - k)}px rgba(207,159,47,.18)`,
      }}
    />
  );
};

/** Pointer + click ripples for one log, at clip time t, in frame px. */
export const Pointer: React.FC<{ log: Log; t: number; hidden?: boolean; scale?: number }> = ({ log, t, hidden, scale = 1 }) => {
  if (hidden) return null;
  const p = pointer(log, t);
  if (!p) return null;
  const cl = clicks(log);
  const near = cl.find((c) => t - c.t >= -0.08 && t - c.t < 0.18);
  const down = near ? 1 - Math.abs(t - near.t - 0.035) / 0.15 : 0;
  return (
    <>
      {cl.map((c, i) => (
        <Ripple key={i} x={c.x} y={c.y} age={t - c.t} />
      ))}
      <Cursor x={p.x} y={p.y} scale={scale} down={Math.max(0, down)} />
    </>
  );
};

// --------------------------------------------------------------- highlight

/** A saffron ring around a real element, drawn from its logged box. */
export const Ring: React.FC<{ b: Box; t: number; from: number; to: number; pad?: number; label?: string; labelSide?: "top" | "bottom" }> = ({
  b,
  t,
  from,
  to,
  pad = 10,
  label,
  labelSide = "top",
}) => {
  const fin = interpolate(t, [from, from + 0.3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fout = interpolate(t, [to - 0.25, to], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const o = Math.min(fin, fout);
  if (o <= 0) return null;
  const grow = 1 + 0.04 * (1 - fin);
  return (
    <div
      style={{
        position: "absolute",
        left: b.x - pad,
        top: b.y - pad,
        width: b.width + pad * 2,
        height: b.height + pad * 2,
        border: `5px solid ${C.saffron}`,
        borderRadius: 12,
        opacity: o,
        transform: `scale(${grow})`,
        boxShadow: "0 0 0 9999px rgba(28,36,64,0.16)",
      }}
    >
      {label && (
        <div
          style={{
            position: "absolute",
            [labelSide === "top" ? "bottom" : "top"]: "100%",
            left: -5,
            margin: labelSide === "top" ? "0 0 10px" : "10px 0 0",
            background: C.saffron,
            color: C.ink,
            fontFamily,
            fontWeight: 700,
            fontSize: 30,
            padding: "6px 14px",
            borderRadius: 8,
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------------------- captions

export type Line = { text: string; from: number; to: number; strong?: boolean };

/** Lower-band caption: one or two lines, fades in/out, never over the button. */
export const Caption: React.FC<{ lines: string[]; f: number; from: number; to: number; top?: boolean }> = ({ lines, f, from, to, top }) => {
  const { fps } = useVideoConfig();
  const o = Math.min(
    interpolate(f, [from, from + 0.22 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    interpolate(f, [to - 0.2 * fps, to], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
  );
  if (o <= 0) return null;
  const y = interpolate(f, [from, from + 0.3 * fps], [14, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        ...(top ? { top: 60 } : { bottom: 54 }),
        display: "flex",
        justifyContent: "center",
        opacity: o,
        transform: `translateY(${y}px)`,
      }}
    >
      <div
        style={{
          background: "rgba(28,36,64,0.94)",
          color: "#fff",
          fontFamily,
          fontWeight: 600,
          fontSize: 56,
          lineHeight: 1.2,
          letterSpacing: -0.3,
          padding: "20px 38px 22px",
          borderRadius: 14,
          maxWidth: 1800,
          textAlign: "center",
          boxShadow: "0 12px 40px rgba(20,24,40,.28)",
          borderBottom: `6px solid ${C.madder}`,
        }}
      >
        {lines.map((l, i) => (
          <div key={i} style={i > 0 ? { color: "#f1e8d5", fontWeight: 500, fontSize: 48, marginTop: 4 } : undefined}>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------- chips

export const Chip: React.FC<{ children: React.ReactNode; f: number; from: number; to: number; x?: number; y?: number; tone?: "ink" | "saffron" | "cotton" }> = ({
  children,
  f,
  from,
  to,
  x = 48,
  y = 40,
  tone = "ink",
}) => {
  const o = Math.min(
    interpolate(f, [from, from + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    interpolate(f, [to - 10, to], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
  );
  if (o <= 0) return null;
  const bg = tone === "saffron" ? C.saffron : tone === "cotton" ? C.cotton : C.ink;
  const fg = tone === "ink" ? "#fff" : C.ink;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        opacity: o,
        background: bg,
        color: fg,
        fontFamily,
        fontWeight: 600,
        fontSize: 32,
        padding: "10px 20px",
        borderRadius: 999,
        boxShadow: "0 8px 24px rgba(20,24,40,.22)",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      {children}
    </div>
  );
};

// --------------------------------------------------------------- clip layer

/** One source clip, played from `from` (clip s) at `speed`, under a camera. */
export const ClipLayer: React.FC<{
  src: string;
  from: number;
  speed: number;
  cam?: CamKey[];
  children?: (t: number) => React.ReactNode;
}> = ({ src, from, speed, cam, children }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = from + (f / fps) * speed;
  const c = camTransform(camAt(cam, t));
  return (
    <AbsoluteFill style={{ background: C.wall, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "0 0", transform: c.css }}>
        <OffthreadVideo src={staticFile(src)} startFrom={Math.round(from * fps)} playbackRate={speed} muted style={{ width: W, height: H }} />
        {children?.(t)}
      </div>
    </AbsoluteFill>
  );
};

// ----------------------------------------------------------- Varial window

/**
 * The real Varial popup clip, floated over the app like the wallet's own
 * window. Place inside a <Sequence from={open}>; local frame 0 = window opens.
 */
export const VarialWindow: React.FC<{
  src: string;
  log: Log;
  /** local frames until it closes */
  close: number;
  /** popup clip time at local frame 0 */
  startAt: number;
  x?: number;
  y?: number;
  scale?: number;
  speed?: number;
  /** popup px hidden at the top (the extension's empty backdrop above its sheet) */
  crop?: number;
  children?: (t: number) => React.ReactNode;
}> = ({ src, log, close, startAt, x = 1290, y = 96, scale = 1.0, speed = 1, crop = 0, children }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tIn = interpolate(f, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const tOut = interpolate(f, [close, close + 10], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const t = Math.min(startAt + (f / fps) * speed, log.t1 - log.t0 - 0.02);
  const w = 534;
  const h = 854 - crop;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + (1 - tIn) * 40,
        width: w * scale,
        opacity: Math.min(tIn, tOut),
        filter: "drop-shadow(0 30px 60px rgba(10,14,30,.45))",
      }}
    >
      <div
        style={{
          background: "#2b2f3a",
          color: "#e9ebf2",
          fontFamily,
          fontSize: 22,
          fontWeight: 600,
          height: 44,
          borderRadius: "14px 14px 0 0",
          display: "flex",
          alignItems: "center",
          padding: "0 18px",
          gap: 10,
        }}
      >
        <span style={{ width: 12, height: 12, borderRadius: 6, background: "#7a7f8c" }} />
        Varial wallet
      </div>
      <div style={{ position: "relative", width: w * scale, height: h * scale, overflow: "hidden", borderRadius: "0 0 14px 14px", background: "#fff" }}>
        <div style={{ position: "absolute", left: 0, top: -crop * scale, width: w, height: 854, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
          <OffthreadVideo src={staticFile(src)} startFrom={Math.max(0, Math.round(startAt * fps))} playbackRate={speed} muted style={{ width: w, height: 854 }} />
          {children?.(t)}
          <Pointer log={log} t={t} />
        </div>
      </div>
    </div>
  );
};
