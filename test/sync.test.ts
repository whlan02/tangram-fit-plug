import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { daysToSync, runSync } from "../src/sync";
import type { HealthReader, IngestRecord, UploadResult } from "../src/types";
import type { UploadOptions } from "../src/ingest";

describe("daysToSync", () => {
  const now = new Date(2026, 10, 21, 15, 30);

  it("没有上次同步为 30", () => {
    assert.equal(daysToSync(null, now), 30);
  });

  it("无效日期字符串为 30", () => {
    assert.equal(daysToSync("not-a-date", now), 30);
    assert.equal(daysToSync("", now), 30);
  });

  it("昨天同步过不低于 3", () => {
    const yesterday = new Date(2026, 10, 20, 8, 0);
    assert.equal(daysToSync(yesterday.toISOString(), now), 3);
  });

  it("10 天前同步为 11", () => {
    const tenDaysAgo = new Date(2026, 10, 11, 9, 0);
    assert.equal(daysToSync(tenDaysAgo.toISOString(), now), 11);
  });

  it("很久以前不高于 90", () => {
    const longAgo = new Date(2026, 10, 21 - 200, 12, 0);
    assert.equal(daysToSync(longAgo.toISOString(), now), 90);
  });
});

describe("runSync", () => {
  const now = new Date(2026, 10, 21, 18, 0);
  const sample: IngestRecord[] = [{ date: "2026-11-21", steps: 4000 }];
  const uploadOk: UploadResult = { accepted: 1, rejected: [], ignored_fields: ["vo2max"] };

  function reader(readDays: HealthReader["readDays"]): HealthReader {
    return {
      source: "healthkit",
      requestAccess: async () => true,
      readDays,
    };
  }

  it("days=3 时 from 是今天往前两天的 0 点，to 是 now", async () => {
    let from: Date | undefined;
    let to: Date | undefined;
    await runSync(3, {
      reader: reader(async (f, t) => {
        from = f;
        to = t;
        return sample;
      }),
      serverUrl: "https://x.dev",
      token: "t",
      now,
      upload: async () => uploadOk,
    });
    assert.ok(from);
    const start = from as Date;
    assert.equal(start.getFullYear(), 2026);
    assert.equal(start.getMonth(), 10);
    assert.equal(start.getDate(), 19);
    assert.equal(start.getHours(), 0);
    assert.equal(start.getMinutes(), 0);
    assert.equal(start.getSeconds(), 0);
    assert.equal(to, now);
  });

  it("有记录时调用 upload，source 来自 reader，汇总正确", async () => {
    let opts: UploadOptions | undefined;
    const summary = await runSync(3, {
      reader: reader(async () => sample),
      serverUrl: "https://x.dev",
      token: "tok",
      device: "phone-1",
      now,
      upload: async (o) => {
        opts = o;
        return uploadOk;
      },
    });
    assert.equal(opts?.source, "healthkit");
    assert.equal(opts?.serverUrl, "https://x.dev");
    assert.equal(opts?.token, "tok");
    assert.equal(opts?.device, "phone-1");
    assert.deepEqual(opts?.records, sample);
    assert.equal(summary.days, 3);
    assert.equal(summary.records, 1);
    assert.equal(summary.accepted, 1);
    assert.deepEqual(summary.rejected, []);
    assert.deepEqual(summary.ignored_fields, ["vo2max"]);
  });

  it("空记录不调用 upload，records 为 0", async () => {
    let called = 0;
    const summary = await runSync(5, {
      reader: reader(async () => []),
      serverUrl: "https://x.dev",
      token: "t",
      now,
      upload: async () => {
        called += 1;
        return uploadOk;
      },
    });
    assert.equal(called, 0);
    assert.equal(summary.records, 0);
    assert.equal(summary.accepted, 0);
    assert.equal(summary.days, 5);
    assert.deepEqual(summary.rejected, []);
    assert.deepEqual(summary.ignored_fields, []);
  });

  it("upload 抛错则 runSync 抛出同样的错误", async () => {
    const boom = new Error("upload failed");
    await assert.rejects(
      () => runSync(3, {
        reader: reader(async () => sample),
        serverUrl: "https://x.dev",
        token: "t",
        now,
        upload: async () => { throw boom; },
      }),
      (err: unknown) => {
        assert.equal(err, boom);
        return true;
      },
    );
  });
});
