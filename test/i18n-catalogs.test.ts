import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { catalogs } from "../src/i18n/catalogs";
import { en } from "../src/i18n/catalogs/en";
import { LOCALES } from "../src/i18n/locales";
import { maxLengthFor } from "../src/i18n/length-rules";
import { messageKeys } from "../src/i18n";

function placeholders(text: string): string[] {
  return [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]!).sort();
}

describe("i18n catalogs", () => {
  it("非空目录与英文键、占位符、长度约束一致", () => {
    const enKeys = Object.keys(en).sort();
    assert.deepEqual(messageKeys().slice().sort(), enKeys);

    for (const { code } of LOCALES) {
      const catalog = catalogs[code];
      const keys = Object.keys(catalog);
      if (keys.length === 0) continue;

      assert.deepEqual(keys.sort(), enKeys, `${code} keys`);

      for (const key of enKeys) {
        const english = en[key as keyof typeof en];
        const value = catalog[key as keyof typeof catalog];
        assert.equal(typeof value, "string", `${code} ${key} type`);
        assert.notEqual(value, "", `${code} ${key} empty`);
        assert.deepEqual(placeholders(value!), placeholders(english), `${code} ${key} placeholders`);
        assert.ok(
          [...value!].length <= maxLengthFor(key, english),
          `${code} ${key} length ${[...value!].length} > ${maxLengthFor(key, english)}`,
        );
      }
    }
  });
});
