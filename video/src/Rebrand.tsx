import React from "react";
import scroll from "./landing-scroll.json";
import { C, fontFamily } from "./ui";

/**
 * The landing clip was captured before the rename, so its header still says
 * "RugDealer". This covers that wordmark, in clip pixels, with "Darva" set the
 * way the app sets its wordmark (Schibsted Grotesk 800, 1.25rem at 4/3 scale,
 * -0.02em). It follows the page as it scrolls (src/landing-scroll.json, from
 * scripts/track-scroll.mjs) and stops once the header has left the frame.
 */
const TABLE = scroll as [number, number][];
function scrollAt(t: number) {
  if (t <= TABLE[0][0]) return 0;
  const last = TABLE[TABLE.length - 1];
  if (t >= last[0]) return last[1];
  let i = 0;
  while (TABLE[i + 1][0] < t) i++;
  const [t0, y0] = TABLE[i];
  const [t1, y1] = TABLE[i + 1];
  return y0 + ((t - t0) / (t1 - t0)) * (y1 - y0);
}

export const LandingWordmark: React.FC<{ t: number }> = ({ t }) => {
  const dy = scrollAt(t);
  if (dy > 140) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 263,
        top: 80 - dy,
        width: 158,
        height: 48,
        background: "#e6e3db",
        display: "flex",
        alignItems: "center",
        paddingLeft: 5,
        fontFamily,
        fontWeight: 800,
        fontSize: 26.67,
        letterSpacing: "-0.02em",
        color: C.ink,
        lineHeight: 1,
      }}
    >
      Darva
    </div>
  );
};
