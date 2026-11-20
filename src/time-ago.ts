import { startOfDay } from "./dates";
import { interpolate, lookup, type Locale } from "./i18n";

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
  if (!iso) return lookup(locale, "time.never");
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return lookup(locale, "time.never");
  const diff = now.getTime() - then.getTime();
  if (diff < MINUTE) return lookup(locale, "time.justNow");
  if (diff < HOUR) return interpolate(lookup(locale, "time.minutesAgo"), { n: Math.floor(diff / MINUTE) });
  const dayGap = Math.round((startOfDay(now).getTime() - startOfDay(then).getTime()) / DAY);
  if (dayGap <= 0) return interpolate(lookup(locale, "time.hoursAgo"), { n: Math.max(1, Math.floor(diff / HOUR)) });
  if (dayGap === 1) return lookup(locale, "time.yesterday");
  return interpolate(lookup(locale, "time.daysAgo"), { n: dayGap });
}
