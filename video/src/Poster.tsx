import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { at, box } from "./log";
import { LOGS } from "./timeline";
import { C, Ring, camTransform, fontFamily } from "./ui";

/** Clip time of the poster frame in weaver-borrow: the breakdown, ringed, before the click. */
export const posterTime = () => at(LOGS["weaver-borrow"], "fee-breakdown-2") + 0.8;

/** Devpost thumbnail: a real frame of the weaver desk, with the fee ring and a title. */
export const Poster: React.FC = () => {
  const B = LOGS["weaver-borrow"];
  const t = posterTime();
  const c = camTransform({ s: 1.12, x: 1070, y: 420 });
  return (
    <AbsoluteFill style={{ background: C.wall, fontFamily }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transformOrigin: "0 0", transform: c.css }}>
        {/* Extracted by `render.mjs poster` with ffmpeg at POSTER_T (a still can't seek video reliably). */}
        <Img src={staticFile("poster-frame.jpg")} style={{ width: 1920, height: 1080 }} />
        <Ring b={box(B, "fee-breakdown-2")} t={t} from={t - 1} to={t + 5} pad={8} label="600 − 45 − 6 − 9 = 540.00 USDC" />
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 300,
          background: "linear-gradient(180deg, rgba(28,36,64,0) 0%, rgba(28,36,64,0.92) 38%, rgba(28,36,64,0.97) 100%)",
        }}
      />
      <div style={{ position: "absolute", left: 80, bottom: 64, color: "#fff" }}>
        <div style={{ fontSize: 34, fontWeight: 600, color: C.saffron }}>RugDealer · live on Stellar Testnet</div>
        <div style={{ fontSize: 76, fontWeight: 700, letterSpacing: -1.5, lineHeight: 1.05, marginTop: 8 }}>Borrow against your rug. Don't sell it cheap.</div>
      </div>
    </AbsoluteFill>
  );
};
