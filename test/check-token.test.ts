import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AuthError, checkToken, UploadError } from "../src/ingest";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status });
}

describe("checkToken", () => {
  it("200 时 GET /api/ingest 带 Bearer，返回 source 和 label", async () => {
    let url = "";
    let method = "";
    let headers: Headers | undefined;
    const fetchFn: typeof fetch = async (input, init) => {
      url = String(input);
      method = init?.method ?? "";
      headers = new Headers(init?.headers);
      return jsonResponse(200, { source: "healthkit", label: "iPhone" });
    };
    const info = await checkToken("https://health.example.com/", "tok-abc", fetchFn);
    assert.equal(url, "https://health.example.com/api/ingest");
    assert.equal(method, "GET");
    assert.equal(headers?.get("authorization"), "Bearer tok-abc");
    assert.deepEqual(info, { source: "healthkit", label: "iPhone" });
  });

  it("label 缺失时为 null", async () => {
    const fetchFn: typeof fetch = async () => jsonResponse(200, { source: "health-connect" });
    const info = await checkToken("https://x.dev", "t", fetchFn);
    assert.equal(info.label, null);
  });

  it("401 抛 AuthError", async () => {
    const fetchFn: typeof fetch = async () => jsonResponse(401, { ok: false });
    await assert.rejects(() => checkToken("https://x.dev", "bad", fetchFn), AuthError);
  });

  it("网络错误和 5xx 抛固定 UploadError", async () => {
    await assert.rejects(
      () => checkToken("https://x.dev", "t", async () => { throw new Error("offline"); }),
      (err: unknown) => {
        assert.ok(err instanceof UploadError);
        assert.equal(err.message, "连不上服务器，请检查网络和地址");
        return true;
      },
    );
    await assert.rejects(
      () => checkToken("https://x.dev", "t", async () => jsonResponse(503, {})),
      (err: unknown) => {
        assert.ok(err instanceof UploadError);
        assert.equal(err.message, "连不上服务器，请检查网络和地址");
        return true;
      },
    );
  });

  it("其他状态抛 UploadError", async () => {
    await assert.rejects(
      () => checkToken("https://x.dev", "t", async () => jsonResponse(404, { error: "nope" })),
      UploadError,
    );
  });
});
