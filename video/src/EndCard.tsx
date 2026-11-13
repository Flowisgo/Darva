import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { kilim, type Dye } from "../../frontend/lib/kilim";
import { C, fontFamily } from "./ui";

const DYE: Record<Dye, string> = { wool: "#f1e8d5", madder: "#9b2a22", indigo: "#24346b", walnut: "#3a2a20", saffron: "#cf9f2f" };
const tinted = (d: Dye, t: 0 | 1 | 2) => (t === 0 ? DYE[d] : t === 1 ? mix(DYE[d], DYE.wool, 0.14) : mix(DYE[d], DYE.walnut, 0.12));
function mix(a: string, b: string, k: number) {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return `rgb(${x.map((v, i) => Math.round(v * (1 - k) + y[i] * k)).join(",")})`;
}

/** The app's own woven pattern for a certificate number, drawn row by row. */
export const Rug: React.FC<{ no: number; height: number; reveal?: number }> = ({ no, height, reveal = 1 }) => {
  const k = kilim(no, "medallion", 0);
  const rows = k.rows.length;
  const shown = Math.round(rows * reveal);
  return (
    <svg viewBox={`0 0 84 126`} height={height} style={{ display: "block", filter: "drop-shadow(0 18px 30px rgba(20,24,40,.35))" }}>
      {k.rows.slice(0, shown).map((row, y) =>
        row.map((r, i) => <rect key={`${y}-${i}`} x={r.x * 4} y={y * 3} width={r.w * 4 + 0.05} height={3.05} fill={tinted(r.dye, r.tint)} />),
      )}
    </svg>
  );
};

export const EndCard: React.FC<{ contract: string; url: string; txCount: number; rugNo: number }> = ({ contract, url, txCount, rugNo }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = (s: number, d = 0.45) => interpolate(f, [s * fps, (s + d) * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const reveal = interpolate(f, [0, 1.1 * fps], [0.15, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });
  return (
    <AbsoluteFill style={{ background: C.wall, fontFamily, color: C.ink }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 14, background: C.madder }} />
      <div style={{ position: "absolute", left: 160, top: 170, opacity: a(0) }}>
        <Rug no={rugNo} height={700} reveal={reveal} />
      </div>
      <div style={{ position: "absolute", left: 720, top: 178, right: 120 }}>
        <div style={{ fontSize: 34, fontWeight: 600, color: C.madder, opacity: a(0.1), letterSpacing: 0.2 }}>Live on Stellar Testnet</div>
        <div style={{ fontSize: 96, fontWeight: 700, lineHeight: 1.0, letterSpacing: -2.5, marginTop: 14, opacity: a(0.2) }}>
          Borrow against
          <br />
          your rug.
        </div>
        <div style={{ fontSize: 48, fontWeight: 500, color: C.slate, marginTop: 18, opacity: a(0.45) }}>Don't sell it cheap.</div>

        <div style={{ marginTop: 56, display: "grid", gap: 22, opacity: a(0.8) }}>
          <Row k="Try it" v={url} big />
          <Row k="Contract" v={contract} mono />
          <Row k="On screen" v={`${txCount} real Testnet transactions, every one signed in Varial`} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Row: React.FC<{ k: string; v: string; mono?: boolean; big?: boolean }> = ({ k, v, mono, big }) => (
  <div style={{ display: "grid", gridTemplateColumns: "190px 1fr", alignItems: "baseline", gap: 18 }}>
    <div style={{ fontSize: 28, fontWeight: 600, color: C.slate, textTransform: "uppercase", letterSpacing: 2 }}>{k}</div>
    <div
      style={{
        fontSize: big ? 52 : mono ? 27 : 34,
        fontWeight: big ? 700 : 500,
        fontFamily: mono ? "Consolas, 'Cascadia Mono', monospace" : fontFamily,
        background: mono ? C.cotton : undefined,
        border: mono ? "2px solid rgba(28,36,64,.14)" : undefined,
        borderRadius: 8,
        padding: mono ? "10px 14px" : 0,
        color: big ? C.madder : C.ink,
        wordBreak: "break-all",
      }}
    >
      {v}
    </div>
  </div>
);
