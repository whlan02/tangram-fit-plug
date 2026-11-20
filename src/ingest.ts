import type { IngestRecord, SourceName, UploadResult } from "./types";

export const MAX_RECORDS = 100;

export class AuthError extends Error {}
export class UploadError extends Error {}

type FetchFn = typeof fetch;

/** "myhealth.example.com" or "https://x.dev/" -> "https://x.dev". Plain http is only allowed for localhost-style hosts. */
export function normalizeServerUrl(input: string): string {
  let s = input.trim().replace(/\/+$/, "");
  if (!s) throw new UploadError("请填写服务器地址");
  if (!/^[a-z]+:\/\//i.test(s)) s = `https://${s}`;
  let u: URL;
  try { u = new URL(s); } catch { throw new UploadError("服务器地址不合法"); }
  const local = /^(localhost|127\.0\.0\.1|\[::1\]|.+\.local|.+\.localhost)$/i.test(u.hostname);
  if (u.protocol !== "https:" && !(u.protocol === "http:" && local)) throw new UploadError("服务器地址必须是 https（本地调试除外）");
  return `${u.protocol}//${u.host}`;
}

export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export interface UploadOptions {
  serverUrl: string;
  token: string;
  source: SourceName;
  device?: string;
  records: IngestRecord[];
  fetchFn?: FetchFn;
  retries?: number; // extra attempts for network errors, 429 and 5xx
  sleepFn?: (ms: number) => Promise<void>;
}

/** Upload in batches of at most 100 days. Re-sending the same days is safe: the server merges by (date, source). */
export async function uploadRecords(opts: UploadOptions): Promise<UploadResult> {
  const base = normalizeServerUrl(opts.serverUrl);
  const doFetch = opts.fetchFn ?? fetch;
  const wait = opts.sleepFn ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const retries = opts.retries ?? 3;
  const total: UploadResult = { accepted: 0, rejected: [], ignored_fields: [] };

  let offset = 0;
  for (const batch of chunk(opts.records, MAX_RECORDS)) {
    const body = JSON.stringify({ version: 1, source: opts.source, device: opts.device, records: batch });
    let res: Response | null = null;
    for (let attempt = 0; ; attempt++) {
      try {
        res = await doFetch(`${base}/api/ingest`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${opts.token}` }, body });
      } catch {
        res = null;
      }
      const retryable = res === null || res.status === 429 || res.status >= 500;
      if (!retryable) break;
      if (attempt >= retries) throw new UploadError(res ? `服务器暂时不可用（${res.status}）` : "连不上服务器，请检查网络和地址");
      await wait(500 * 2 ** attempt);
    }
    if (!res) throw new UploadError("连不上服务器");
    if (res.status === 401) throw new AuthError("令牌无效或已吊销");
    let json: any = null;
    try { json = await res.json(); } catch { /* handled below */ }
    if (!res.ok || !json?.ok) throw new UploadError(json?.error ?? `上传失败（${res.status}）`);
    total.accepted += json.accepted ?? 0;
    for (const r of json.rejected ?? []) total.rejected.push({ index: r.index + offset, error: r.error });
    for (const f of json.ignored_fields ?? []) if (!total.ignored_fields.includes(f)) total.ignored_fields.push(f);
    offset += batch.length;
  }
  return total;
}
