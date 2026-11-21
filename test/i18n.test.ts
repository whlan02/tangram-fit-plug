import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { en } from "../src/i18n/catalogs/en";
import { zhHans } from "../src/i18n/catalogs/zh-Hans";
import { de } from "../src/i18n/catalogs/de";
import { fr } from "../src/i18n/catalogs/fr";
import { errorToText } from "../src/errors";
import { AuthError, UploadError } from "../src/ingest";
import { interpolate, setLocale, t } from "../src/i18n";

describe("interpolate", () => {
  it("替换花括号参数", () => {
    assert.equal(interpolate("读取 {n} 天", { n: 3 }), "读取 3 天");
    assert.equal(interpolate("{host} · {source}", { host: "a.dev", source: "Apple Health" }), "a.dev · Apple Health");
  });
});

describe("t / setLocale", () => {
  it("完整目录用当前语言，自动模式跟随系统语言", () => {
    setLocale("de", "de-DE");
    assert.equal(t("home.syncNow"), de["home.syncNow"]);
    setLocale("zh-Hans", "en-US");
    assert.equal(t("home.syncNow"), zhHans["home.syncNow"]);
    setLocale("en", "zh-CN");
    assert.equal(t("pair.tokenRequired"), en["pair.tokenRequired"]);
    setLocale("auto", "fr-FR");
    assert.equal(t("home.syncNow"), fr["home.syncNow"]);
    setLocale("auto", "zh-CN");
    assert.equal(t("home.syncNow"), zhHans["home.syncNow"]);
  });

  it("t 做占位符替换", () => {
    setLocale("en");
    assert.equal(t("result.daysRead", { n: 4 }), "Read 4 days");
    setLocale("zh-Hans");
    assert.equal(t("home.subtitle", { host: "a.dev", source: "Apple 健康" }), "a.dev · Apple 健康");
  });
});

describe("errorToText", () => {
  it("AuthError 走 i18n，UploadError 保留原消息", () => {
    setLocale("en");
    assert.equal(errorToText(new AuthError("令牌无效或已吊销")), en["errors.auth"]);
    assert.equal(errorToText(new UploadError("连不上服务器，请检查网络和地址")), "连不上服务器，请检查网络和地址");
    assert.equal(errorToText(new Error("Health Connect missing")), "Health Connect missing");
    setLocale("zh-Hans");
    assert.equal(errorToText(new AuthError("x")), zhHans["errors.auth"]);
    assert.equal(errorToText(123), zhHans["errors.unknown"]);
  });
});
