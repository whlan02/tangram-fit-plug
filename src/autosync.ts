const HOUR_MS = 60 * 60 * 1000;

export function shouldAutoSync(
  lastSyncIso: string | null,
  now: Date,
  enabled: boolean,
  busy: boolean,
): boolean {
  if (!enabled || busy) return false;
  if (!lastSyncIso) return true;
  const last = new Date(lastSyncIso);
  if (Number.isNaN(last.getTime())) return true;
  return now.getTime() - last.getTime() > HOUR_MS;
}
