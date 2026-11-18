import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import deployment from "../../frontend/lib/deployment.json";
import { EndCard } from "./EndCard";
import { across } from "./log";
import { BEATS, LOGS, RUG_NO, TX_ON_SCREEN, type Beat, type Seg } from "./timeline";
import { C, Caption, Chip, ClipLayer, Pointer, Ring, VarialWindow, fontFamily } from "./ui";

export const FPS = 60;
const frames = (s: number) => Math.round(s * FPS);
const segFrames = (s: Seg) => Math.max(1, frames((s.to - s.from) / s.speed));
export const beatFrames = (b: Beat) => (b.card ? frames(b.cardSeconds ?? 4) : b.segs.reduce((n, s) => n + segFrames(s), 0));

export type Placed = { beat: Beat; start: number; dur: number; segs: { seg: Seg; start: number; dur: number }[] };
export function layout(): { placed: Placed[]; total: number } {
  let f = 0;
  const placed: Placed[] = BEATS.map((beat) => {
    const start = f;
    let g = start;
    const segs = beat.segs.map((seg) => {
      const dur = segFrames(seg);
      const r = { seg, start: g, dur };
      g += dur;
      return r;
    });
    const dur = beatFrames(beat);
    f += dur;
    return { beat, start, dur, segs };
  });
  return { placed, total: f };
}

const SegView: React.FC<{ seg: Seg }> = ({ seg }) => {
  const log = LOGS[seg.clip];
  return (
    <ClipLayer src={`clips/${seg.clip}/clip.mp4`} from={seg.from} speed={seg.speed} cam={seg.cam}>
      {(t) => (
        <>
          {seg.rings?.map((r, i) => <Ring key={i} b={r.b} t={t} from={r.from} to={r.to} label={r.label} labelSide={r.labelSide} pad={r.pad} />)}
          <Pointer log={log} t={t} hidden={seg.hidePointer} />
        </>
      )}
    </ClipLayer>
  );
};

const PopupView: React.FC<{ seg: Seg; dur: number }> = ({ seg, dur }) => {
  const p = seg.popup!;
  const startAt = Math.max(0, across(LOGS[seg.clip], seg.from, p.log));
  return (
    <VarialWindow src={p.clip} log={p.log} close={dur - 6} startAt={startAt} speed={seg.speed} crop={p.crop} scale={1.0} x={1300} y={70}>
      {(t) => <>{p.rings?.map((r, i) => <Ring key={i} b={r.b} t={t} from={r.from} to={r.to} label={r.label} labelSide={r.labelSide} pad={r.pad} />)}</>}
    </VarialWindow>
  );
};

const speedText = (s: number) => `${Number.isInteger(s) ? s : s.toFixed(1)}×`;

export const Demo: React.FC<{ narrated?: boolean; captions?: boolean }> = ({ narrated = false, captions = true }) => {
  const f = useCurrentFrame();
  const { placed } = layout();
  return (
    <AbsoluteFill style={{ background: C.wall, fontFamily }}>
      {placed.map(({ beat, start, dur, segs }) => (
        <React.Fragment key={beat.id}>
          {beat.card === "end" ? (
            <Sequence from={start} durationInFrames={dur}>
              <EndCard contract={deployment.contract} url="darvarugs.vercel.app" txCount={TX_ON_SCREEN.length} rugNo={RUG_NO} />
            </Sequence>
          ) : (
            segs.map(({ seg, start: s0, dur: d }, i) => (
              <React.Fragment key={i}>
                <Sequence from={s0} durationInFrames={d}>
                  <SegView seg={seg} />
                </Sequence>
                {seg.popup && (
                  <Sequence from={s0} durationInFrames={d + 10}>
                    <PopupView seg={seg} dur={d} />
                  </Sequence>
                )}
                {seg.speed >= 1.5 && seg.chip !== false && (
                  <Chip f={f} from={s0} to={s0 + d} x={48} y={128} tone="saffron">
                    <span style={{ letterSpacing: -2 }}>▸▸</span> {speedText(seg.speed)}
                    {typeof seg.chip === "string" ? <span style={{ fontWeight: 500 }}>· {seg.chip}</span> : null}
                  </Chip>
                )}
              </React.Fragment>
            ))
          )}
          {beat.desk && (
            <Chip f={f} from={start} to={start + dur} x={48} y={44}>
              {beat.desk}
            </Chip>
          )}
          {beat.note && (
            <Chip f={f} from={start} to={start + frames(beat.note.to)} x={48} y={128} tone="cotton">
              {beat.note.text}
            </Chip>
          )}
          {captions &&
            beat.captions.map((c, i) => (
              <Caption key={i} lines={c.lines} f={f} from={start + frames(c.at)} to={Math.min(start + dur, start + frames(c.to))} />
            ))}
        </React.Fragment>
      ))}
      {narrated && <Audio src={staticFile("audio/narration.wav")} />}
    </AbsoluteFill>
  );
};
