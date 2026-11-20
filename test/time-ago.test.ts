import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { syncFreshness, timeAgo } from "../src/time-ago";

describe("timeAgo", () => {
  const now = new Date(2026, 10, 21, 15, 0, 0);

  it("无效或空为还没同步过", () => {
    assert.equal(timeAgo(null, now, "zh"), "还没同步过");
    assert.equal(timeAgo("nope", now, "zh"), "还没同步过");
    assert.equal(timeAgo(null, now, "en"), "Not synced yet");
  });

  it("刚刚 / 分钟 / 小时 / 昨天 / 天", () => {
    assert.equal(timeAgo(new Date(2026, 10, 21, 14, 59, 30).toISOString(), now, "zh"), "刚刚");
    assert.equal(timeAgo(new Date(2026, 10, 21, 14, 50, 0).toISOString(), now, "zh"), "10 分钟前");
    assert.equal(timeAgo(new Date(2026, 10, 21, 12, 0, 0).toISOString(), now, "zh"), "3 小时前");
    assert.equal(timeAgo(new Date(2026, 10, 20, 18, 0, 0).toISOString(), now, "zh"), "昨天");
    assert.equal(timeAgo(new Date(2026, 10, 18, 15, 0, 0).toISOString(), now, "zh"), "3 天前");
    assert.equal(timeAgo(new Date(2026, 10, 21, 14, 50, 0).toISOString(), now, "en"), "10 minutes ago");
  });
});

describe("syncFreshness", () => {
  const now = new Date("2026-11-21T15:00:00.000Z");
  it("1 小时内为 fresh", () => {
    assert.equal(syncFreshness(new Date(now.getTime() - 30 * 60_000).toISOString(), now), "fresh");
    assert.equal(syncFreshness(new Date(now.getTime() - 2 * 3600_000).toISOString(), now), "stale");
    assert.equal(syncFreshness(null, now), "never");
    assert.equal(syncFreshness("bad", now), "never");
  });
});
