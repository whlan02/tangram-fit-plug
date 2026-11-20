import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AuthError, chunk, normalizeServerUrl, UploadError, uploadRecords } from "../src/ingest";
import type { IngestRecord } from "../src/types";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status });
}

function records(n: number): IngestRecord[] {
  return Array.from({ length: n }, (_, i) => ({ date: `2026-01-${String((i % 28) + 1).padStart(2, "0")}` }));
}

describe("normalizeServerUrl", () => {
  it("补上 https:// 并去掉末尾斜杠", () => {
    assert.equal(normalizeServerUrl("example.com"), "https://example.com");
    assert.equal(normalizeServerUrl("https://x.dev/"), "https://x.dev");
  });

  it("http 普通域名报错，localhost 允许", () => {
    assert.throws(() => normalizeServerUrl("http://example.com"), UploadError);
    assert.equal(normalizeServerUrl("http://localhost:8788"), "http://localhost:8788");
    assert.equal(normalizeServerUrl("http://127.0.0.1:8788"), "http://127.0.0.1:8788");
  });

  it("空字符串报错", () => {
    assert.throws(() => normalizeServerUrl(""), UploadError);
    assert.throws(() => normalizeServerUrl("   "), UploadError);
  });

  it("带路径的地址只保留协议和主机", () => {
    assert.equal(normalizeServerUrl("https://health.example.com/api/ingest"), "https://health.example.com");
    assert.equal(normalizeServerUrl("myhealth.example.com/v1/"), "https://myhealth.example.com");
  });
});

describe("chunk", () => {
  it("250 条按 100 分成 100/100/50", () => {
    const parts = chunk(Array.from({ length: 250 }, (_, i) => i), 100);
    assert.equal(parts.length, 3);
    assert.deepEqual(parts.map((p) => p.length), [100, 100, 50]);
    assert.equal(parts[0][0], 0);
    assert.equal(parts[1][0], 100);
    assert.equal(parts[2][0], 200);
    assert.equal(parts[2][49], 249);
  });

  it("空数组返回空数组", () => {
    assert.deepEqual(chunk([], 100), []);
  });
});

describe("uploadRecords", () => {
  it("成功时 POST 到 /api/ingest，带 Bearer，汇总 accepted", async () => {
    const recs = records(2);
    let url = "";
    let method = "";
    let headers: Headers | undefined;
    let bodyText = "";
    const fetchFn: typeof fetch = async (input, init) => {
      url = String(input);
      method = init?.method ?? "";
      headers = new Headers(init?.headers);
      bodyText = String(init?.body ?? "");
      return jsonResponse(200, { ok: true, accepted: 2, rejected: [], ignored_fields: [] });
    };
    const result = await uploadRecords({
      serverUrl: "https://health.example.com/",
      token: "tok-abc",
      source: "healthkit",
      records: recs,
      fetchFn,
    });
    assert.equal(url, "https://health.example.com/api/ingest");
    assert.equal(method, "POST");
    assert.equal(headers?.get("authorization"), "Bearer tok-abc");
    const body = JSON.parse(bodyText);
    assert.equal(body.version, 1);
    assert.equal(body.source, "healthkit");
    assert.deepEqual(body.records, recs);
    assert.equal(result.accepted, 2);
    assert.deepEqual(result.rejected, []);
  });

  it("250 条分 3 次请求，rejected index 加上批次偏移", async () => {
    const recs = records(250);
    const calls: unknown[] = [];
    let batch = 0;
    const fetchFn: typeof fetch = async (_input, init) => {
      calls.push(JSON.parse(String(init?.body ?? "{}")));
      batch += 1;
      if (batch === 2) {
        return jsonResponse(200, { ok: true, accepted: 99, rejected: [{ index: 5, error: "bad" }], ignored_fields: [] });
      }
      return jsonResponse(200, { ok: true, accepted: batch === 3 ? 50 : 100, rejected: [], ignored_fields: [] });
    };
    const result = await uploadRecords({
      serverUrl: "https://health.example.com",
      token: "t",
      source: "health-connect",
      records: recs,
      fetchFn,
    });
    assert.equal(calls.length, 3);
    assert.equal((calls[0] as { records: unknown[] }).records.length, 100);
    assert.equal((calls[1] as { records: unknown[] }).records.length, 100);
    assert.equal((calls[2] as { records: unknown[] }).records.length, 50);
    assert.equal(result.accepted, 249);
    assert.deepEqual(result.rejected, [{ index: 105, error: "bad" }]);
  });

  it("401 抛 AuthError 且不重试", async () => {
    let n = 0;
    const fetchFn: typeof fetch = async () => {
      n += 1;
      return jsonResponse(401, { ok: false, error: "unauthorized" });
    };
    await assert.rejects(
      () => uploadRecords({ serverUrl: "https://x.dev", token: "bad", source: "healthkit", records: records(1), fetchFn }),
      AuthError,
    );
    assert.equal(n, 1);
  });

  it("500 后成功，退避 500 然后 1000", async () => {
    let n = 0;
    const sleeps: number[] = [];
    const fetchFn: typeof fetch = async () => {
      n += 1;
      if (n < 3) return jsonResponse(500, { ok: false });
      return jsonResponse(200, { ok: true, accepted: 1, rejected: [], ignored_fields: [] });
    };
    const result = await uploadRecords({
      serverUrl: "https://x.dev",
      token: "t",
      source: "healthkit",
      records: records(1),
      fetchFn,
      sleepFn: async (ms) => { sleeps.push(ms); },
    });
    assert.equal(result.accepted, 1);
    assert.deepEqual(sleeps, [500, 1000]);
  });

  it("一直 500 则重试 retries 次后抛 UploadError", async () => {
    let n = 0;
    const fetchFn: typeof fetch = async () => {
      n += 1;
      return jsonResponse(500, { ok: false });
    };
    await assert.rejects(
      () => uploadRecords({
        serverUrl: "https://x.dev",
        token: "t",
        source: "healthkit",
        records: records(1),
        fetchFn,
        retries: 2,
        sleepFn: async () => {},
      }),
      UploadError,
    );
    assert.equal(n, 3);
  });

  it("网络错误同样重试后抛 UploadError", async () => {
    let n = 0;
    const fetchFn: typeof fetch = async () => {
      n += 1;
      throw new Error("network down");
    };
    await assert.rejects(
      () => uploadRecords({
        serverUrl: "https://x.dev",
        token: "t",
        source: "healthkit",
        records: records(1),
        fetchFn,
        retries: 2,
        sleepFn: async () => {},
      }),
      (err: unknown) => {
        assert.ok(err instanceof UploadError);
        assert.match((err as UploadError).message, /连不上服务器/);
        return true;
      },
    );
    assert.equal(n, 3);
  });

  it("400 且 JSON 带 error 时抛 UploadError，不重试", async () => {
    let n = 0;
    const fetchFn: typeof fetch = async () => {
      n += 1;
      return jsonResponse(400, { ok: false, error: "日期格式不对" });
    };
    await assert.rejects(
      () => uploadRecords({ serverUrl: "https://x.dev", token: "t", source: "healthkit", records: records(1), fetchFn }),
      (err: unknown) => {
        assert.ok(err instanceof UploadError);
        assert.match((err as UploadError).message, /日期格式不对/);
        return true;
      },
    );
    assert.equal(n, 1);
  });

  it("ignored_fields 多批去重合并", async () => {
    const recs = records(150);
    let batch = 0;
    const fetchFn: typeof fetch = async () => {
      batch += 1;
      if (batch === 1) {
        return jsonResponse(200, { ok: true, accepted: 100, rejected: [], ignored_fields: ["vo2max", "skin_temp"] });
      }
      return jsonResponse(200, { ok: true, accepted: 50, rejected: [], ignored_fields: ["skin_temp", "breathing"] });
    };
    const result = await uploadRecords({
      serverUrl: "https://x.dev",
      token: "t",
      source: "healthkit",
      records: recs,
      fetchFn,
    });
    assert.deepEqual(result.ignored_fields, ["vo2max", "skin_temp", "breathing"]);
  });
});
