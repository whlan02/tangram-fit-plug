import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { shouldAutoSync } from "../src/autosync";

describe("shouldAutoSync", () => {
  const now = new Date("2026-11-21T15:00:00.000Z");

  it("未开启则否", () => {
    assert.equal(shouldAutoSync(null, now, false, false), false);
  });

  it("正在同步则否", () => {
    assert.equal(shouldAutoSync(null, now, true, true), false);
  });

  it("从未同步过则是", () => {
    assert.equal(shouldAutoSync(null, now, true, false), true);
  });

  it("时间字符串无效则是", () => {
    assert.equal(shouldAutoSync("not-a-date", now, true, false), true);
  });

  it("刚同步过则否，超过 1 小时则是", () => {
    const recent = new Date(now.getTime() - 10 * 60_000).toISOString();
    const old = new Date(now.getTime() - 61 * 60_000).toISOString();
    assert.equal(shouldAutoSync(recent, now, true, false), false);
    assert.equal(shouldAutoSync(old, now, true, false), true);
  });
});
