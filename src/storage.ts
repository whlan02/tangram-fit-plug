import * as SecureStore from "expo-secure-store";

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
