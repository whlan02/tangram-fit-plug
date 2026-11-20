import { localDate, localTime } from "./dates";
import type { Sleep } from "./types";

export type SleepKind = "inbed" | "awake" | "light" | "deep" | "rem";
export interface SleepSample {
  start: Date;
  end: Date;
  kind: SleepKind;
}

/** Sessions are split where there is a gap longer than this between samples. */
const SESSION_GAP_MS = 3 * 3600e3;
const MAX_SESSION_MS = 16 * 3600e3;

type Interval = [number, number];

/** Total minutes covered by the union of the intervals (several sources may report the same night). */
export function unionMinutes(intervals: Interval[]): number {
  const sorted = intervals.filter(([a, b]) => b > a).sort((x, y) => x[0] - y[0]);
  let total = 0, curStart = 0, curEnd = 0, open = false;
  for (const [a, b] of sorted) {
    if (!open) { curStart = a; curEnd = b; open = true; }
    else if (a <= curEnd) curEnd = Math.max(curEnd, b);
    else { total += curEnd - curStart; curStart = a; curEnd = b; }
  }
  if (open) total += curEnd - curStart;
  return Math.round(total / 60000);
}

/**
 * Turn raw sleep-stage samples into one Sleep summary per wake-up date (local time).
 * Per wake-up date the main session (most time asleep) wins; stage minutes are interval unions,
 * so overlapping sources are not double-counted. "In bed" samples only widen the in-bed span.
 */
export function summarizeSleep(samples: SleepSample[]): Record<string, Sleep> {
  const sorted = [...samples].filter((s) => s.end > s.start).sort((a, b) => a.start.getTime() - b.start.getTime());
  const sessions: SleepSample[][] = [];
  let lastEnd = -Infinity;
  for (const s of sorted) {
    if (!sessions.length || s.start.getTime() - lastEnd > SESSION_GAP_MS) sessions.push([]);
    sessions[sessions.length - 1].push(s);
    lastEnd = Math.max(lastEnd, s.end.getTime());
  }

  const byDate: Record<string, { sleep: Sleep; asleep: number }> = {};
  for (const ses of sessions) {
    const startMs = Math.min(...ses.map((s) => s.start.getTime()));
    const endMs = Math.max(...ses.map((s) => s.end.getTime()));
    if (endMs - startMs > MAX_SESSION_MS) continue; // implausible (>16 h), like the Google sync
    const iv = (kinds: SleepKind[]): Interval[] => ses.filter((s) => kinds.includes(s.kind)).map((s): Interval => [s.start.getTime(), s.end.getTime()]);
    const light = unionMinutes(iv(["light"]));
    const deep = unionMinutes(iv(["deep"]));
    const rem = unionMinutes(iv(["rem"]));
    const asleep = unionMinutes(iv(["light", "deep", "rem"]));
    if (asleep <= 0) continue;
    const sleep: Sleep = { minutes: asleep, inbed: Math.round((endMs - startMs) / 60000), start: localTime(new Date(startMs)), end: localTime(new Date(endMs)) };
    if (light) sleep.light = light;
    if (deep) sleep.deep = deep;
    if (rem) sleep.rem = rem;
    const awake = unionMinutes(iv(["awake"]));
    if (awake) sleep.awake = awake;
    const date = localDate(new Date(endMs));
    if (!byDate[date] || asleep > byDate[date].asleep) byDate[date] = { sleep, asleep };
  }
  return Object.fromEntries(Object.entries(byDate).map(([d, v]) => [d, v.sleep]));
}
