export const LOCALES = [
  { code: "en", name: "English" },
  { code: "zh-Hans", name: "简体中文" },
  { code: "zh-Hant", name: "繁體中文" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "it", name: "Italiano" },
  { code: "pt-BR", name: "Português (Brasil)" },
  { code: "pt-PT", name: "Português (Portugal)" },
  { code: "ru", name: "Русский" },
  { code: "ja", name: "日本語" },
  { code: "ko", name: "한국어" },
  { code: "tr", name: "Türkçe" },
  { code: "nl", name: "Nederlands" },
  { code: "pl", name: "Polski" },
  { code: "sv", name: "Svenska" },
  { code: "da", name: "Dansk" },
  { code: "nb", name: "Norsk bokmål" },
  { code: "fi", name: "Suomi" },
  { code: "cs", name: "Čeština" },
  { code: "el", name: "Ελληνικά" },
  { code: "th", name: "ไทย" },
  { code: "vi", name: "Tiếng Việt" },
  { code: "id", name: "Bahasa Indonesia" },
  { code: "ms", name: "Bahasa Melayu" },
  { code: "uk", name: "Українська" },
  { code: "ro", name: "Română" },
  { code: "hu", name: "Magyar" },
  { code: "bg", name: "Български" },
  { code: "hr", name: "Hrvatski" },
  { code: "sk", name: "Slovenčina" },
  { code: "sl", name: "Slovenščina" },
  { code: "lt", name: "Lietuvių" },
  { code: "lv", name: "Latviešu" },
  { code: "et", name: "Eesti" },
  { code: "ca", name: "Català" },
  { code: "hi", name: "हिन्दी" },
  { code: "fil", name: "Filipino" },
] as const;

export type Locale = (typeof LOCALES)[number]["code"];
export type LocalePref = "auto" | Locale;

const CODES = new Set<string>(LOCALES.map((item) => item.code));

export function isLocale(x: unknown): x is Locale {
  return typeof x === "string" && CODES.has(x);
}

export function isLocalePref(x: unknown): x is LocalePref {
  return x === "auto" || isLocale(x);
}
