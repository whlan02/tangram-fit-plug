import { en } from "./en";
import { zh } from "./zh";

export type MessageKey = keyof typeof zh;
export type Locale = "zh" | "en";
export type LocalePref = "auto" | Locale;
export type MessageParams = Record<string, string | number>;

const catalogs: Record<Locale, Record<MessageKey, string>> = { zh, en };

let pref: LocalePref = "auto";
let deviceTag = "en";

export function resolveLocale(localePref: LocalePref, languageTag: string): Locale {
  if (localePref === "zh" || localePref === "en") return localePref;
  return languageTag.toLowerCase().startsWith("zh") ? "zh" : "en";
}

export function currentLocale(): Locale {
  return resolveLocale(pref, deviceTag);
}

export function setLocale(next: LocalePref, languageTag?: string): Locale {
  pref = next;
  if (languageTag != null) deviceTag = languageTag;
  return currentLocale();
}

export function interpolate(template: string, params?: MessageParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    params[name] == null ? `{${name}}` : String(params[name]),
  );
}

export function t(key: MessageKey, params?: MessageParams): string {
  return interpolate(catalogs[currentLocale()][key], params);
}

export function messageKeys(): MessageKey[] {
  return Object.keys(zh) as MessageKey[];
}
