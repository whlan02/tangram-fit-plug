import { catalogs } from "./catalogs";
import { en, type MsgKey } from "./catalogs/en";
import type { Locale, LocalePref } from "./locales";
import { resolveLocale } from "./resolve";

export type { Locale, LocalePref } from "./locales";
export { LOCALES, isLocale, isLocalePref } from "./locales";
export { resolveLocale } from "./resolve";
export type { Catalog } from "./catalogs";
export type MessageKey = MsgKey;
export type MessageParams = Record<string, string | number>;

let pref: LocalePref = "auto";
let deviceTag = "en";

export function currentLocale(): Locale {
  return resolveLocale(pref, deviceTag);
}

export function getPreference(): LocalePref {
  return pref;
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

export function lookup(locale: Locale, key: MessageKey): string {
  return catalogs[locale][key] ?? en[key] ?? key;
}

export function t(key: MessageKey, params?: MessageParams): string {
  return interpolate(lookup(currentLocale(), key), params);
}

export function messageKeys(): MessageKey[] {
  return Object.keys(en) as MessageKey[];
}
