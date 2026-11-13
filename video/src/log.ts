// Readers for the capture event logs (capture/logs/*.json).
// All times returned are clip seconds (0 = first frame of that clip's mp4).

export type Box = { x: number; y: number; width: number; height: number };
export type Ev = {
  t: number;
  type: "move" | "click" | "mark" | "box";
  name?: string;
  x?: number;
  y?: number;
  px?: Box;
  hash?: string;
  kind?: string;
  clip?: string | null;
};
export type Log = { t0: number; t1: number; scale: number; events: Ev[]; kind?: string };

export const dur = (log: Log) => log.t1 - log.t0;

/** Clip time of the nth marker `name` (or of a click/box with that name). */
export function at(log: Log, name: string, nth = 0): number {
  const hits = log.events.filter((e) => e.name === name);
  const e = hits[nth < 0 ? hits.length + nth : nth];
  if (!e) throw new Error(`marker ${name}[${nth}] not in log`);
  return e.t - log.t0;
}
export const has = (log: Log, name: string) => log.events.some((e) => e.name === name);

/** Frame-px box logged as `name` (viewport coordinates at that moment). */
export function box(log: Log, name: string, nth = 0): Box {
  const hits = log.events.filter((e) => e.name === name && e.px);
  const e = hits[nth < 0 ? hits.length + nth : nth];
  if (!e?.px) throw new Error(`box ${name} not in log`);
  return e.px;
}

export function hashes(log: Log): string[] {
  return log.events.filter((e) => e.name === "tx-sent" && e.hash).map((e) => e.hash!);
}

/** Pointer position at clip time t (frame px), interpolated between samples. */
export function pointer(log: Log, t: number): { x: number; y: number } | null {
  const pts = log.events.filter((e) => e.type === "move" || e.type === "click");
  if (!pts.length) return null;
  const abs = t + log.t0;
  if (abs <= pts[0].t) return { x: pts[0].x!, y: pts[0].y! };
  for (let i = 1; i < pts.length; i++) {
    if (pts[i].t >= abs) {
      const a = pts[i - 1];
      const b = pts[i];
      const k = b.t === a.t ? 1 : (abs - a.t) / (b.t - a.t);
      return { x: a.x! + (b.x! - a.x!) * k, y: a.y! + (b.y! - a.y!) * k };
    }
  }
  const last = pts[pts.length - 1];
  return { x: last.x!, y: last.y! };
}

export function clicks(log: Log): { t: number; x: number; y: number; name?: string }[] {
  return log.events.filter((e) => e.type === "click").map((e) => ({ t: e.t - log.t0, x: e.x!, y: e.y!, name: e.name }));
}

/** Clip time in log B of a clip time in log A (both wall-clock based). */
export const across = (a: Log, tA: number, b: Log) => tA + a.t0 - b.t0;

/** Clip time of the nth click named `name` (boxes with the same name come earlier). */
export function ck(log: Log, name: string, nth = 0): number {
  const hits = log.events.filter((e) => e.type === "click" && e.name === name);
  const e = hits[nth];
  if (!e) throw new Error(`click ${name}[${nth}] not in log`);
  return e.t - log.t0;
}
