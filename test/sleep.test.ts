import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { summarizeSleep, unionMinutes, type SleepSample } from "../src/sleep";

describe("unionMinutes", () => {
  it("重叠区间不重复计算", () => {
    const a = new Date(2026, 10, 19, 23, 0).getTime();
    assert.equal(unionMinutes([
      [a, a + 10 * 60000],
      [a + 5 * 60000, a + 15 * 60000],
    ]), 15);
  });

  it("相邻和不重叠区间相加", () => {
    const a = new Date(2026, 10, 19, 22, 0).getTime();
    assert.equal(unionMinutes([
      [a, a + 10 * 60000],
      [a + 10 * 60000, a + 20 * 60000],
    ]), 20);
    assert.equal(unionMinutes([
      [a, a + 10 * 60000],
      [a + 30 * 60000, a + 40 * 60000],
    ]), 20);
  });

  it("空数组为 0", () => {
    assert.equal(unionMinutes([]), 0);
  });

  it("结束早于开始的区间被忽略", () => {
    const a = new Date(2026, 10, 19, 22, 0).getTime();
    assert.equal(unionMinutes([[a + 10 * 60000, a]]), 0);
    assert.equal(unionMinutes([
      [a + 10 * 60000, a],
      [a, a + 8 * 60000],
    ]), 8);
  });
});

describe("summarizeSleep", () => {
  it("一整晚记在醒来那天，minutes 是睡着阶段并集", () => {
    const samples: SleepSample[] = [
      { start: new Date(2026, 10, 19, 23, 30), end: new Date(2026, 10, 20, 1, 0), kind: "light" },
      { start: new Date(2026, 10, 20, 1, 0), end: new Date(2026, 10, 20, 3, 0), kind: "deep" },
      { start: new Date(2026, 10, 20, 3, 0), end: new Date(2026, 10, 20, 4, 30), kind: "rem" },
      { start: new Date(2026, 10, 20, 4, 30), end: new Date(2026, 10, 20, 4, 45), kind: "awake" },
      { start: new Date(2026, 10, 20, 4, 45), end: new Date(2026, 10, 20, 7, 0), kind: "light" },
    ];
    const out = summarizeSleep(samples);
    assert.deepEqual(Object.keys(out), ["2026-11-20"]);
    const night = out["2026-11-20"];
    assert.equal(night.minutes, 90 + 120 + 90 + 135);
    assert.equal(night.light, 90 + 135);
    assert.equal(night.deep, 120);
    assert.equal(night.rem, 90);
    assert.equal(night.awake, 15);
    assert.equal(night.start, "23:30");
    assert.equal(night.end, "07:00");
    assert.equal(night.inbed, 450);
  });

  it("两个来源重叠的同一晚不重复计数", () => {
    const light: SleepSample = {
      start: new Date(2026, 10, 19, 23, 30),
      end: new Date(2026, 10, 20, 7, 0),
      kind: "light",
    };
    const out = summarizeSleep([light, { ...light }]);
    assert.equal(out["2026-11-20"].minutes, 450);
    assert.equal(out["2026-11-20"].light, 450);
  });

  it("只有 inbed 样本不产生结果", () => {
    const out = summarizeSleep([{
      start: new Date(2026, 10, 19, 23, 0),
      end: new Date(2026, 10, 20, 7, 0),
      kind: "inbed",
    }]);
    assert.deepEqual(out, {});
  });

  it("超过 16 小时的跨度被丢弃", () => {
    const out = summarizeSleep([{
      start: new Date(2026, 10, 19, 10, 0),
      end: new Date(2026, 10, 20, 3, 0),
      kind: "light",
    }]);
    assert.deepEqual(out, {});
  });

  it("同一醒来日两段睡眠间隔超过 3 小时时取睡着更长的那段", () => {
    const out = summarizeSleep([
      { start: new Date(2026, 10, 19, 23, 0), end: new Date(2026, 10, 20, 6, 0), kind: "light" },
      { start: new Date(2026, 10, 20, 13, 0), end: new Date(2026, 10, 20, 14, 0), kind: "light" },
    ]);
    assert.deepEqual(Object.keys(out), ["2026-11-20"]);
    assert.equal(out["2026-11-20"].minutes, 7 * 60);
    assert.equal(out["2026-11-20"].start, "23:00");
    assert.equal(out["2026-11-20"].end, "06:00");
  });

  it("两个不同醒来日各自产生一条", () => {
    const out = summarizeSleep([
      { start: new Date(2026, 10, 18, 23, 0), end: new Date(2026, 10, 19, 7, 0), kind: "deep" },
      { start: new Date(2026, 10, 19, 23, 30), end: new Date(2026, 10, 20, 6, 30), kind: "rem" },
    ]);
    assert.deepEqual(Object.keys(out).sort(), ["2026-11-19", "2026-11-20"]);
    assert.equal(out["2026-11-19"].minutes, 8 * 60);
    assert.equal(out["2026-11-19"].end, "07:00");
    assert.equal(out["2026-11-20"].minutes, 7 * 60);
    assert.equal(out["2026-11-20"].start, "23:30");
  });
});
