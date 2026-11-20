import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { en } from "../src/i18n/en";
import { zh } from "../src/i18n/zh";
import { errorToText } from "../src/errors";
import { AuthError, UploadError } from "../src/ingest";
import { interpolate, messageKeys, resolveLocale, setLocale, t } from "../src/i18n";

describe("i18n catalogs", () => {
  it("中英键集合完全相同", () => {
    const zhKeys = Object.keys(zh).sort();
    const enKeys = Object.keys(en).sort();
    assert.deepEqual(enKeys, zhKeys);
    assert.deepEqual(messageKeys().slice().sort(), zhKeys);
  });
});

describe("interpolate", () => {
  it("替换花括号参数", () => {
    assert.equal(interpolate("读取 {n} 天", { n: 3 }), "读取 3 天");
    assert.equal(interpolate("{host} · {source}", { host: "a.dev", source: "Apple Health" }), "a.dev · Apple Health");
  });
});

describe("resolveLocale / setLocale auto", () => {
  it("zh* 为中文，其他为英文", () => {
    assert.equal(resolveLocale("auto", "zh-CN"), "zh");
    assert.equal(resolveLocale("auto", "zh-Hans-CN"), "zh");
    assert.equal(resolveLocale("auto", "en-US"), "en");
    assert.equal(resolveLocale("auto", "de-DE"), "en");
    assert.equal(resolveLocale("zh", "en-US"), "zh");
    assert.equal(resolveLocale("en", "zh-CN"), "en");
  });

  it("setLocale(auto) 按设备语言切换 t()", () => {
    setLocale("auto", "zh-CN");
    assert.equal(t("home.syncNow"), zh["home.syncNow"]);
    setLocale("auto", "fr-FR");
    assert.equal(t("home.syncNow"), en["home.syncNow"]);
    setLocale("en", "zh-CN");
    assert.equal(t("pair.tokenRequired"), en["pair.tokenRequired"]);
  });
});

describe("errorToText", () => {
  it("AuthError 走 i18n，UploadError 保留原消息", () => {
    setLocale("en");
    assert.equal(errorToText(new AuthError("令牌无效或已吊销")), en["errors.auth"]);
    assert.equal(errorToText(new UploadError("连不上服务器，请检查网络和地址")), "连不上服务器，请检查网络和地址");
    assert.equal(errorToText(new Error("Health Connect missing")), "Health Connect missing");
    setLocale("zh");
    assert.equal(errorToText(new AuthError("x")), zh["errors.auth"]);
    assert.equal(errorToText(123), zh["errors.unknown"]);
  });
});
