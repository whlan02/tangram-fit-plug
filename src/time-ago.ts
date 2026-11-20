import { startOfDay } from "./dates";
import { interpolate } from "./i18n";
import { en } from "./i18n/en";
import { zh } from "./i18n/zh";
import type { Locale } from "./i18n";

export type SyncFreshness = "never" | "fresh" | "stale";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function syncFreshness(iso: string | null, now: Date): SyncFreshness {
  if (!iso) return "never";
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return "never";
  if (now.getTime() - then.getTime() <= HOUR) return "fresh";
  return "stale";
}

export function timeAgo(iso: string | null, now: Date, locale: Locale): string {
  const dict = locale === "zh" ? zh : en;
  if (!iso) return dict["time.never"];
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return dict["time.never"];
  const diff = now.getTime() - then.getTime();
  if (diff < MINUTE) return dict["time.justNow"];
  if (diff < HOUR) return interpolate(dict["time.minutesAgo"], { n: Math.floor(diff / MINUTE) });
  const dayGap = Math.round((startOfDay(now).getTime() - startOfDay(then).getTime()) / DAY);
  if (dayGap <= 0) return interpolate(dict["time.hoursAgo"], { n: Math.max(1, Math.floor(diff / HOUR)) });
  if (dayGap === 1) return dict["time.yesterday"];
  return interpolate(dict["time.daysAgo"], { n: dayGap });
}
