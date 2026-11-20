import * as SecureStore from "expo-secure-store";
import { isLocalePref, type LocalePref } from "./i18n";

export interface Pairing {
  serverUrl: string;
  token: string;
}

const KEY = "pairing";
const LAST = "last_sync";

export async function loadPairing(): Promise<Pairing | null> {
  const raw = await SecureStore.getItemAsync(KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as Pairing; } catch { return null; }
}

export const savePairing = (p: Pairing) => SecureStore.setItemAsync(KEY, JSON.stringify(p));
/** Unpairing also forgets the last sync time, so pairing with another server starts with a full backfill. */
export async function clearPairing(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY);
  await SecureStore.deleteItemAsync(LAST);
}

/** ISO timestamp of the last successful upload, or null. */
export const loadLastSync = () => SecureStore.getItemAsync(LAST);
export const saveLastSync = (iso: string) => SecureStore.setItemAsync(LAST, iso);

const LOCALE = "locale_pref";
const ONBOARDED = "onboarded";
const LAST_RESULT = "last_result";
const AUTO_SYNC = "auto_sync";
const HEALTH_ASKED = "health_access_asked";

export type LocalePrefStored = LocalePref;

export async function loadLocalePref(): Promise<LocalePref> {
  const raw = await SecureStore.getItemAsync(LOCALE);
  if (raw === "zh") return "zh-Hans";
  if (isLocalePref(raw)) return raw;
  return "auto";
}
export const saveLocalePref = (pref: LocalePref) => SecureStore.setItemAsync(LOCALE, pref);

export async function loadOnboarded(): Promise<boolean> {
  return (await SecureStore.getItemAsync(ONBOARDED)) === "1";
}
export const saveOnboarded = () => SecureStore.setItemAsync(ONBOARDED, "1");

export interface LastResult {
  days: number;
  records: number;
  accepted: number;
  rejected: { index: number; error: string }[];
  ignored_fields: string[];
}

export async function loadLastResult(): Promise<LastResult | null> {
  const raw = await SecureStore.getItemAsync(LAST_RESULT);
  if (!raw) return null;
  try { return JSON.parse(raw) as LastResult; } catch { return null; }
}
export const saveLastResult = (result: LastResult) =>
  SecureStore.setItemAsync(LAST_RESULT, JSON.stringify(result));
export const clearLastResult = () => SecureStore.deleteItemAsync(LAST_RESULT);

/** Missing key means on: auto-sync is the default. */
export async function loadAutoSync(): Promise<boolean> {
  const raw = await SecureStore.getItemAsync(AUTO_SYNC);
  return raw !== "0";
}
export const saveAutoSync = (on: boolean) => SecureStore.setItemAsync(AUTO_SYNC, on ? "1" : "0");

export async function loadHealthAccessAsked(): Promise<boolean> {
  return (await SecureStore.getItemAsync(HEALTH_ASKED)) === "1";
}
export const saveHealthAccessAsked = () => SecureStore.setItemAsync(HEALTH_ASKED, "1");
