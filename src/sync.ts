import { addDays, startOfDay } from "./dates";
import { uploadRecords } from "./ingest";
import type { HealthReader, UploadResult } from "./types";

export const FIRST_SYNC_DAYS = 30;
export const MIN_SYNC_DAYS = 3; // always re-send a few recent days: today is still changing, and the server merges by day
export const MAX_SYNC_DAYS = 90;

/** How many days back to read: first sync = 30; later = days since the last successful sync plus one, between 3 and 90. */
export function daysToSync(lastSyncIso: string | null, now: Date): number {
  if (!lastSyncIso) return FIRST_SYNC_DAYS;
  const last = new Date(lastSyncIso);
  if (Number.isNaN(last.getTime())) return FIRST_SYNC_DAYS;
  const gap = Math.ceil((startOfDay(now).getTime() - startOfDay(last).getTime()) / 86400e3) + 1;
  return Math.min(MAX_SYNC_DAYS, Math.max(MIN_SYNC_DAYS, gap));
}

export interface SyncSummary {
  days: number;
  records: number;
  accepted: number;
  rejected: UploadResult["rejected"];
  ignored_fields: string[];
}

export interface SyncDeps {
  reader: HealthReader;
  serverUrl: string;
  token: string;
  device?: string;
  now?: Date;
  upload?: typeof uploadRecords; // injectable for tests
}

/** Read the last `days` local days from the phone and upload them. Nothing is uploaded when there is nothing to send. */
export async function runSync(days: number, deps: SyncDeps): Promise<SyncSummary> {
  const now = deps.now ?? new Date();
  const from = startOfDay(addDays(now, -(days - 1)));
  const records = await deps.reader.readDays(from, now);
  if (!records.length) return { days, records: 0, accepted: 0, rejected: [], ignored_fields: [] };
  const upload = deps.upload ?? uploadRecords;
  const res = await upload({ serverUrl: deps.serverUrl, token: deps.token, source: deps.reader.source, device: deps.device, records });
  return { days, records: records.length, accepted: res.accepted, rejected: res.rejected, ignored_fields: res.ignored_fields };
}
