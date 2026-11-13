// The cut. Every source time is computed from a named marker in the capture
// logs, so a re-capture moves the cuts with it. Times in a segment are clip
// seconds; captions are output seconds from the start of their beat.
import type { Box, Log } from "./log";
import { across, at, box, ck } from "./log";
import type { CamKey } from "./ui";

import landingL from "../capture/logs/landing.json";
import issueL from "../capture/logs/store-issue.json";
import issueV from "../capture/logs/store-issue-varial-1.json";
import borrowL from "../capture/logs/weaver-borrow.json";
import borrowV from "../capture/logs/weaver-borrow-varial-1.json";
import lendL from "../capture/logs/investor-lend.json";
import lendV from "../capture/logs/investor-lend-varial-1.json";
import repayL from "../capture/logs/weaver-repay.json";
import repayV1 from "../capture/logs/weaver-repay-varial-1.json";
import repayV2 from "../capture/logs/weaver-repay-varial-2.json";
import handL from "../capture/logs/store-handover.json";
import handV from "../capture/logs/store-handover-varial-1.json";
import buyL from "../capture/logs/buyout.json";
import buyV from "../capture/logs/buyout-varial-1.json";
import actL from "../capture/logs/activity.json";
import state from "../capture/logs/state.json";

const L = (x: unknown) => x as Log;
export const LOGS = {
  landing: L(landingL),
  "store-issue": L(issueL),
  "weaver-borrow": L(borrowL),
  "investor-lend": L(lendL),
  "weaver-repay": L(repayL),
  "store-handover": L(handL),
  buyout: L(buyL),
  activity: L(actL),
} as const;
export type ClipId = keyof typeof LOGS;

export type RingSpec = { b: Box; from: number; to: number; label?: string; labelSide?: "top" | "bottom"; pad?: number };
export type PopupSpec = { clip: string; log: Log; crop: number; rings?: RingSpec[] };
export type Seg = {
  clip: ClipId;
  from: number;
  to: number;
  speed: number;
  cam?: CamKey[];
  rings?: RingSpec[];
  popup?: PopupSpec;
  /** speed chip text; shown when speed > 1.5 unless false */
  chip?: string | false;
  hidePointer?: boolean;
};
export type CaptionSpec = { at: number; to: number; lines: string[] };
export type Beat = { id: string; desk?: string; note?: { text: string; to: number }; segs: Seg[]; captions: CaptionSpec[]; card?: "end"; cardSeconds?: number };

const P = (clip: string, log: unknown, crop = 280, rings?: RingSpec[]): PopupSpec => ({ clip: `clips/${clip}/clip.mp4`, log: L(log), crop, rings });

/** Measured time from the app sending a transaction to the app showing it confirmed. */
export const confirmSecs = (log: Log, done: string) => at(log, done) - at(log, "tx-sent");
const conf = (log: Log, done: string) => `Confirming on Testnet · ${confirmSecs(log, done).toFixed(1)} s`;

// Fee row inside the Varial popup (popup px, before crop), measured from the capture.
const FEE_ROW: Box = { x: 58, y: 530, width: 420, height: 48 };
// The "redeem" authorisation row in Varial's Confirm Authorizations sheet.
const REDEEM_ROW: Box = { x: 48, y: 658, width: 443, height: 66 };

const S = LOGS["store-issue"];
const B = LOGS["weaver-borrow"];
const I = LOGS["investor-lend"];
const R = LOGS["weaver-repay"];
const Hd = LOGS["store-handover"];
const Y = LOGS.buyout;
const A = LOGS.activity;
const Ld = LOGS.landing;

const C1 = { s: 1, x: 960, y: 540 };
const push = (t0: number, t1: number, x: number, y: number, s0 = 1, s1 = 1.06): CamKey[] => [
  { t: t0, s: s0, x, y },
  { t: t1, s: s1, x, y },
];

export const RUG_NO = (state as { rugHappy: number }).rugHappy;
export const RUG_BUYOUT = (state as { rugBuyout: number }).rugBuyout;

export const BEATS: Beat[] = [
  {
    id: "problem",
    segs: [
      {
        clip: "landing",
        from: 0.2,
        to: 5.8,
        speed: 1,
        cam: [
          { t: 0.2, s: 1, x: 960, y: 540 },
          { t: 5.8, s: 1.2, x: 1320, y: 560 },
        ],
        rings: [{ b: box(Ld, "worked-example"), from: at(Ld, "start") + 3.0, to: 5.8, pad: 8 }],
      },
    ],
    captions: [
      { at: 0.15, to: 2.85, lines: ["A buyer would pay about 1,500 USDC for Ayşe's rug.", "Finding that buyer takes months."] },
      { at: 2.85, to: 5.6, lines: ["The store will pay 600 today.", "She needs the cash, so she sells cheap."] },
    ],
  },
  {
    id: "solution",
    segs: [
      {
        clip: "landing",
        from: 7.6,
        to: 12.2,
        speed: 1.9,
        chip: false,
        cam: [
          { t: 7.6, s: 1.04, x: 960, y: 540 },
          { t: 12.2, s: 1.0, x: 960, y: 540 },
        ],
        rings: [
          { b: box(Ld, "outcome-repay"), from: at(Ld, "scrolled") + 0.1, to: 12.2, pad: 6 },
          { b: box(Ld, "outcome-buyout"), from: at(Ld, "scrolled") + 0.5, to: 12.2, pad: 6 },
        ],
      },
    ],
    captions: [{ at: 0.1, to: 2.4, lines: ["RugDealer: she borrows that price instead,", "and keeps the rug until a real buyer comes."] }],
  },
  {
    id: "store-issue",
    desk: "Store desk · Kaya Rug House",
    segs: [
      { clip: "store-issue", from: ck(S, "description") - 0.6, to: at(S, "price") + 0.05, speed: 3, cam: push(3.6, 7.3, 700, 420, 1.08, 1.1) },
      { clip: "store-issue", from: at(S, "price") + 0.05, to: ck(S, "issue") + 0.25, speed: 1.8, cam: push(7.3, 9.5, 700, 420, 1.1, 1.1) },
      { clip: "store-issue", from: ck(S, "issue") + 0.25, to: at(S, "varial-open"), speed: 5, chip: false, cam: push(9.5, 12.1, 700, 420, 1.1, 1.06) },
      {
        clip: "store-issue",
        from: at(S, "varial-open"),
        to: at(S, "varial-approved") + 0.12,
        speed: 1.2,
        hidePointer: true,
        cam: push(12.1, 15.1, 700, 420, 1.06, 1.04),
        popup: P("store-issue-varial-1", issueV, 280, [{ b: FEE_ROW, from: 0.6, to: L(issueV).t1 - L(issueV).t0, pad: 4 }]),
      },
      { clip: "store-issue", from: at(S, "tx-sent"), to: at(S, "done:issue"), speed: 8, chip: conf(S, "done:issue"), cam: push(15, 22, 700, 420, 1.04, 1.04) },
      { clip: "store-issue", from: at(S, "done:issue"), to: at(S, "done:issue") + 0.45, speed: 1, cam: push(21.9, 22.6, 700, 420, 1.04, 1.04) },
      {
        clip: "store-issue",
        from: at(S, "new-certificate") - 0.4,
        to: at(S, "end") - 0.2,
        speed: 1.35,
        cam: push(24.3, 27.7, 960, 330, 1.0, 1.08),
        rings: [
          { b: box(S, "new-certificate"), from: at(S, "new-certificate"), to: at(S, "end"), pad: 6 },
          { b: box(S, "certificate-no"), from: at(S, "new-certificate") + 0.4, to: at(S, "end"), pad: 6, label: "On Testnet" },
        ],
      },
    ],
    captions: [
      { at: 0.0, to: 3.0, lines: ["Kaya Rug House holds the rug and writes its certificate", "at 600 USDC, its own buying price."] },
      { at: 3.0, to: 5.6, lines: ["Each step is signed in a real wallet.", "Network fee: 0.0058 XLM, a fraction of a cent."] },
      { at: 5.6, to: 8.9, lines: [`Certificate No. ${String(RUG_NO).padStart(4, "0")} now lives in the contract.`, "Ayşe owns it. The store keeps the rug safe."] },
    ],
  },
  {
    id: "weaver-borrow",
    desk: "Weaver desk · Ayşe the weaver",
    segs: [
      { clip: "weaver-borrow", from: at(B, "scrolled") - 0.4, to: at(B, "quote-checked") + 0.1, speed: 2, chip: false, cam: push(2.3, 6.3, 960, 500, 1.0, 1.04) },
      {
        clip: "weaver-borrow",
        from: at(B, "quote-checked") + 0.1,
        to: ck(B, "ask") + 0.3,
        speed: 1.4,
        cam: push(6.2, 9.6, 1070, 480, 1.04, 1.07),
        rings: [{ b: box(B, "fee-breakdown-2"), from: at(B, "fee-breakdown-2") + 0.05, to: ck(B, "ask") + 0.3, pad: 8, label: "600 − 45 − 6 − 9 = 540.00 USDC" }],
      },
      { clip: "weaver-borrow", from: ck(B, "ask") + 0.3, to: at(B, "varial-open"), speed: 6, chip: false, cam: push(9.6, 12.6, 1070, 480, 1.07, 1.05) },
      {
        clip: "weaver-borrow",
        from: at(B, "varial-approved") - 1.6,
        to: at(B, "varial-approved") + 0.1,
        speed: 1.4,
        hidePointer: true,
        popup: P("weaver-borrow-varial-1", borrowV),
        cam: push(13.6, 15.3, 1070, 480, 1.05, 1.04),
      },
      { clip: "weaver-borrow", from: at(B, "tx-sent"), to: at(B, "done:ask"), speed: 8, chip: conf(B, "done:ask"), cam: push(15.3, 22, 1070, 480, 1.04, 1.04) },
      { clip: "weaver-borrow", from: at(B, "done:ask"), to: at(B, "done:ask") + 1.0, speed: 1, cam: push(22, 23.3, 1070, 480, 1.04, 1.06) },
    ],
    captions: [
      { at: 0.0, to: 3.0, lines: ["Ayşe borrows the store's price for 6 months.", "In this demo, 1 month lasts 1 minute."] },
      { at: 3.0, to: 8.4, lines: ["Fees come off once: she receives 540.00 USDC today,", "≈ 24,300 TRY, and the rug is still hers."] },
    ],
  },
  {
    id: "investor-lend",
    desk: "Investor desk · Deniz the investor",
    segs: [
      {
        clip: "investor-lend",
        from: at(I, "scrolled") - 0.5,
        to: ck(I, "lend") + 0.3,
        speed: 1.5,
        cam: push(1.9, 5.5, 960, 470, 1.0, 1.06),
        rings: [{ b: { ...box(I, "request-card"), y: box(I, "request-card").y + 250, height: 160, x: box(I, "request-card").x + 240, width: box(I, "request-card").width - 240 }, from: at(I, "request-card") + 0.2, to: ck(I, "lend") + 0.3, pad: 10, label: "45.00 interest, 645.00 back" }],
      },
      { clip: "investor-lend", from: ck(I, "lend") + 0.3, to: at(I, "varial-open"), speed: 6, chip: false, cam: push(5.5, 7.2, 960, 470, 1.06, 1.04) },
      {
        clip: "investor-lend",
        from: at(I, "varial-approved") - 1.4,
        to: at(I, "varial-approved") + 0.1,
        speed: 1.4,
        hidePointer: true,
        popup: P("investor-lend-varial-1", lendV),
        cam: push(8.4, 10, 960, 470, 1.04, 1.04),
      },
      { clip: "investor-lend", from: at(I, "tx-sent"), to: at(I, "done:lend"), speed: 8, chip: conf(I, "done:lend"), cam: push(9.9, 16.3, 960, 470, 1.04, 1.0) },
      {
        clip: "investor-lend",
        from: at(I, "done:lend"),
        to: at(I, "done:lend") + 1.7,
        speed: 1,
        cam: push(16.3, 18, 960, 540, 1.0, 1.05),
        // Measured from the frame at done:lend + 0.7 s (the running card wasn't box-logged).
        rings: [{ b: { x: 235, y: 430, width: 1451, height: 220 }, from: at(I, "done:lend") + 0.15, to: at(I, "done:lend") + 1.7, pad: 6, label: "Running" }],
      },
    ],
    captions: [{ at: 0.1, to: 5.7, lines: ["Deniz funds the whole loan in one transaction,", "and will get back 645.00 USDC."] }],
  },
  {
    id: "repay-collect",
    desk: "Weaver desk · Ayşe the weaver",
    segs: [
      {
        clip: "weaver-repay",
        from: at(R, "scrolled") - 0.3,
        to: ck(R, "repay") + 0.25,
        speed: 1.7,
        cam: push(2.0, 5.1, 960, 380, 1.04, 1.08),
        rings: [{ b: box(R, "loan-card"), from: at(R, "loan-card") + 0.1, to: ck(R, "repay") + 0.25, pad: 6 }],
      },
      { clip: "weaver-repay", from: ck(R, "repay") + 0.25, to: at(R, "varial-open"), speed: 6, chip: false, cam: push(5.1, 6.9, 960, 380, 1.08, 1.05) },
      { clip: "weaver-repay", from: at(R, "varial-approved", 0) - 1.0, to: at(R, "varial-approved", 0) + 0.1, speed: 1.4, hidePointer: true, popup: P("weaver-repay-varial-1", repayV1), cam: push(8.6, 9.7, 960, 380, 1.05, 1.05) },
      { clip: "weaver-repay", from: at(R, "tx-sent"), to: at(R, "done:repay"), speed: 10, chip: conf(R, "done:repay"), cam: push(9.7, 16.4, 960, 380, 1.05, 1.0) },
      { clip: "weaver-repay", from: at(R, "done:repay"), to: ck(R, "collect") + 0.2, speed: 3, chip: false, cam: push(16.4, 19.6, 960, 560, 1.0, 1.04) },
      { clip: "weaver-repay", from: ck(R, "collect") + 0.2, to: at(R, "varial-open", 1), speed: 5, chip: false, cam: push(19.6, 21, 960, 560, 1.04, 1.04) },
      {
        clip: "weaver-repay",
        from: at(R, "varial-approved", 1) - 1.7,
        to: at(R, "varial-approved", 1) + 0.1,
        speed: 1.3,
        hidePointer: true,
        popup: P("weaver-repay-varial-2", repayV2, 280, [{ b: REDEEM_ROW, from: 0.3, to: L(repayV2).t1 - L(repayV2).t0, pad: 4 }]),
        cam: push(22, 23.8, 960, 560, 1.04, 1.04),
      },
      { clip: "weaver-repay", from: at(R, "done:collect") + 0.3, to: at(R, "link-copied") + 0.5, speed: 1.6, cam: push(25.4, 28, 960, 560, 1.04, 1.07) },
      {
        clip: "store-handover",
        from: at(Hd, "cosign-panel") - 0.3,
        to: ck(Hd, "cosign") + 0.25,
        speed: 2,
        cam: push(2.3, 5.3, 960, 420, 1.0, 1.06),
        rings: [{ b: box(Hd, "cosign-panel"), from: at(Hd, "cosign-panel"), to: ck(Hd, "cosign") + 0.25, pad: 6 }],
      },
      { clip: "store-handover", from: ck(Hd, "cosign") + 0.25, to: at(Hd, "varial-open"), speed: 6, chip: false, cam: push(5.3, 7.2, 960, 420, 1.06, 1.04) },
      { clip: "store-handover", from: at(Hd, "varial-approved") - 0.9, to: at(Hd, "varial-approved") + 0.1, speed: 1.3, hidePointer: true, popup: P("store-handover-varial-1", handV), cam: push(8.8, 9.9, 960, 420, 1.04, 1.04) },
      { clip: "store-handover", from: at(Hd, "tx-sent"), to: at(Hd, "done:cosign"), speed: 10, chip: conf(Hd, "done:cosign"), cam: push(9.8, 16.5, 960, 420, 1.04, 1.0) },
      {
        clip: "store-handover",
        from: at(Hd, "done:cosign"),
        to: at(Hd, "done:cosign") + 1.7,
        speed: 1,
        cam: push(16.5, 18.5, 960, 330, 1.0, 1.08),
        rings: [{ b: box(Hd, "handed-over"), from: at(Hd, "done:cosign") + 0.15, to: at(Hd, "done:cosign") + 2.0, pad: 6 }],
      },
    ],
    captions: [
      { at: 0.0, to: 3.9, lines: ["A buyer turns up: she repays 600 USDC.", "The loan cost her 60, not the 900 lost selling cheap."] },
      { at: 3.9, to: 8.2, lines: ["To collect the rug she signs her half,", "then Kaya Rug House co-signs."] },
      { at: 8.2, to: 12.5, lines: ["Two signatures close the certificate.", "The rug goes home with Ayşe."] },
    ],
  },
  {
    id: "buyout",
    desk: "Store desk · Kaya Rug House",
    note: { text: `A second rug, No. ${String((state as { rugBuyout: number }).rugBuyout).padStart(4, "0")}: 1-month loan, unpaid, 60 s later`, to: 3.2 },
    segs: [
      {
        clip: "buyout",
        from: at(Y, "overdue-card") - 0.4,
        to: ck(Y, "buy") + 0.25,
        speed: 1.25,
        cam: push(2.0, 5.4, 960, 400, 1.02, 1.08),
        rings: [{ b: box(Y, "overdue-card"), from: at(Y, "overdue-card") + 0.05, to: ck(Y, "buy") + 0.25, pad: 6 }],
      },
      { clip: "buyout", from: ck(Y, "buy") + 0.25, to: at(Y, "varial-open"), speed: 6, chip: false, cam: push(5.4, 7.5, 960, 400, 1.08, 1.05) },
      { clip: "buyout", from: at(Y, "varial-approved") - 1.0, to: at(Y, "varial-approved") + 0.1, speed: 1.3, hidePointer: true, popup: P("buyout-varial-1", buyV), cam: push(9.5, 10.6, 960, 400, 1.05, 1.05) },
      { clip: "buyout", from: at(Y, "tx-sent"), to: at(Y, "done:buy"), speed: 10, chip: conf(Y, "done:buy"), cam: push(10.6, 17.3, 960, 400, 1.05, 1.0) },
      {
        clip: "buyout",
        from: at(Y, "bought-card") - 1.1,
        to: at(Y, "end") - 0.05,
        speed: 1.3,
        cam: push(18.6, 22.7, 960, 380, 1.0, 1.08),
        rings: [
          { b: box(Y, "bought-card"), from: at(Y, "bought-card"), to: at(Y, "end"), pad: 6 },
          { b: box(Y, "store-price"), from: at(Y, "bought-card") + 0.35, to: at(Y, "end"), pad: 8, label: "Its own price", labelSide: "bottom" },
        ],
      },
    ],
    captions: [
      { at: 0.0, to: 3.6, lines: ["No repayment? The store must buy the rug", "at the price it set. The contract enforces it."] },
      { at: 3.6, to: 7.3, lines: ["That's why it can't lowball her,", "and the investor is repaid from the purchase."] },
    ],
  },
  {
    id: "activity",
    desk: "Activity · every contract event",
    segs: [
      { clip: "activity", from: 1.3, to: at(A, "scrolled", 0) + 0.1, speed: 2, chip: false },
      {
        clip: "activity",
        from: at(A, "scrolled", 0) + 0.1,
        to: at(A, "scrolled", 0) + 3.0,
        speed: 1,
        cam: push(3.6, 6.5, 1000, 360, 1.0, 1.05),
        // Rows measured on the held frame after the first scroll (activity clip, 5.0 s).
        rings: [
          { b: { x: 450, y: 560, width: 1250, height: 78 }, from: at(A, "scrolled", 0) + 0.2, to: at(A, "scrolled", 0) + 3.0, pad: 4 },
          { b: { x: 450, y: 458, width: 1250, height: 78 }, from: at(A, "scrolled", 0) + 0.9, to: at(A, "scrolled", 0) + 3.0, pad: 4 },
          { b: { x: 450, y: 42, width: 1250, height: 78 }, from: at(A, "scrolled", 0) + 1.6, to: at(A, "scrolled", 0) + 3.0, pad: 4 },
        ],
      },
    ],
    captions: [{ at: 0.0, to: 4.0, lines: ["Every step above is a Testnet transaction.", "Each line here links to its own."] }],
  },
  { id: "end", segs: [], captions: [], card: "end", cardSeconds: 4.1 },
];

export const TX_ON_SCREEN = (state as { txs: { beat: string; hash: string }[] }).txs.filter((t) =>
  ["store-issue", "weaver-borrow", "investor-lend", "weaver-repay", "store-handover", "buyout"].includes(t.beat),
);
