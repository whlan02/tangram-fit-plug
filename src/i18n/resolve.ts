import { LOCALES, type Locale, type LocalePref } from "./locales";

export function resolveLocale(pref: LocalePref, languageTag: string): Locale {
  if (pref !== "auto") return pref;
  return matchTag(languageTag) ?? "en";
}

function matchTag(tag: string): Locale | undefined {
  const lower = tag.trim().toLowerCase();
  if (!lower) return undefined;
  return (
    exactCode(lower) ??
    matchChinese(lower) ??
    matchPortuguese(lower) ??
    matchNorwegian(lower) ??
    matchFilipino(lower) ??
    matchPrimary(lower)
  );
}

function exactCode(lower: string): Locale | undefined {
  return LOCALES.find((item) => item.code.toLowerCase() === lower)?.code;
}

function primary(lower: string): string {
  return lower.split("-")[0] ?? lower;
}

function hasPrefix(lower: string, prefix: string): boolean {
  return lower === prefix || lower.startsWith(`${prefix}-`);
}

function matchChinese(lower: string): Locale | undefined {
  if (primary(lower) !== "zh") return undefined;
  const traditional = ["zh-hant", "zh-tw", "zh-hk", "zh-mo"];
  return traditional.some((p) => hasPrefix(lower, p)) ? "zh-Hant" : "zh-Hans";
}

function matchPortuguese(lower: string): Locale | undefined {
  if (primary(lower) !== "pt") return undefined;
  return hasPrefix(lower, "pt-pt") ? "pt-PT" : "pt-BR";
}

function matchNorwegian(lower: string): Locale | undefined {
  const code = primary(lower);
  return code === "no" || code === "nb" || code === "nn" ? "nb" : undefined;
}

function matchFilipino(lower: string): Locale | undefined {
  const code = primary(lower);
  return code === "tl" || code === "fil" ? "fil" : undefined;
}

function matchPrimary(lower: string): Locale | undefined {
  return exactCode(primary(lower));
}
