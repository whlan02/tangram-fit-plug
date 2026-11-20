import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parsePairingLink } from "../src/pairing-link";

describe("parsePairingLink", () => {
  it("解析编码后的 url 和 token", () => {
    const url = "tangramfitplug://pair?url=" + encodeURIComponent("https://health.example.com") + "&token=secret-1";
    assert.deepEqual(parsePairingLink(url), { serverUrl: "https://health.example.com", token: "secret-1" });
  });

  it("方案不对或缺少参数返回 null", () => {
    assert.equal(parsePairingLink("https://example.com/pair?url=https://x.dev&token=t"), null);
    assert.equal(parsePairingLink("tangramfitplug://pair?url=https://x.dev"), null);
    assert.equal(parsePairingLink("tangramfitplug://pair?token=t"), null);
    assert.equal(parsePairingLink("tangramfitplug://other?url=https://x.dev&token=t"), null);
    assert.equal(parsePairingLink("not a url"), null);
  });
});
