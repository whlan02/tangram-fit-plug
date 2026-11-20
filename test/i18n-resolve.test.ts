import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveLocale } from "../src/i18n/resolve";

describe("resolveLocale", () => {
  it("pref 不是 auto 时直接使用", () => {
    assert.equal(resolveLocale("ja", "en-US"), "ja");
    assert.equal(resolveLocale("zh-Hans", "pt-BR"), "zh-Hans");
    assert.equal(resolveLocale("en", "zh-CN"), "en");
  });

  it("完整标签大小写不敏感匹配", () => {
    assert.equal(resolveLocale("auto", "pt-BR"), "pt-BR");
    assert.equal(resolveLocale("auto", "pt-br"), "pt-BR");
    assert.equal(resolveLocale("auto", "ZH-HANS"), "zh-Hans");
    assert.equal(resolveLocale("auto", "fil"), "fil");
  });

  it("中文：繁体地区为 zh-Hant，其余为 zh-Hans", () => {
    assert.equal(resolveLocale("auto", "zh-Hant"), "zh-Hant");
    assert.equal(resolveLocale("auto", "zh-Hant-TW"), "zh-Hant");
    assert.equal(resolveLocale("auto", "zh-TW"), "zh-Hant");
    assert.equal(resolveLocale("auto", "zh-HK"), "zh-Hant");
    assert.equal(resolveLocale("auto", "zh-MO"), "zh-Hant");
    assert.equal(resolveLocale("auto", "zh-CN"), "zh-Hans");
    assert.equal(resolveLocale("auto", "zh-Hans-CN"), "zh-Hans");
    assert.equal(resolveLocale("auto", "zh"), "zh-Hans");
  });

  it("葡语：pt-PT 为欧洲葡语，其余 pt* 为 pt-BR", () => {
    assert.equal(resolveLocale("auto", "pt-PT"), "pt-PT");
    assert.equal(resolveLocale("auto", "pt-PT-x-foo"), "pt-PT");
    assert.equal(resolveLocale("auto", "pt-BR"), "pt-BR");
    assert.equal(resolveLocale("auto", "pt"), "pt-BR");
    assert.equal(resolveLocale("auto", "pt-AO"), "pt-BR");
  });

  it("挪威语 no/nb/nn → nb", () => {
    assert.equal(resolveLocale("auto", "nb"), "nb");
    assert.equal(resolveLocale("auto", "nb-NO"), "nb");
    assert.equal(resolveLocale("auto", "no"), "nb");
    assert.equal(resolveLocale("auto", "no-NO"), "nb");
    assert.equal(resolveLocale("auto", "nn"), "nb");
    assert.equal(resolveLocale("auto", "nn-NO"), "nb");
  });

  it("菲律宾语 tl/fil → fil", () => {
    assert.equal(resolveLocale("auto", "tl"), "fil");
    assert.equal(resolveLocale("auto", "tl-PH"), "fil");
    assert.equal(resolveLocale("auto", "fil-PH"), "fil");
  });

  it("其余取主语言子标签，否则回退 en", () => {
    assert.equal(resolveLocale("auto", "es-MX"), "es");
    assert.equal(resolveLocale("auto", "de-DE"), "de");
    assert.equal(resolveLocale("auto", "en-US"), "en");
    assert.equal(resolveLocale("auto", "fr-CA"), "fr");
    assert.equal(resolveLocale("auto", "ar-SA"), "en");
    assert.equal(resolveLocale("auto", ""), "en");
  });
});
