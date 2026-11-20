import * as Linking from "expo-linking";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";
import { shouldAutoSync } from "../autosync";
import { errorToText } from "../errors";
import reader from "../health/reader";
import { saveLastResult, saveLastSync, type LastResult, type Pairing } from "../storage";
import { daysToSync, runSync } from "../sync";

const PLAY_MARKET = "market://details?id=com.google.android.apps.healthdata";
const PLAY_HTTPS = "https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata";

export function useSync(pairing: Pairing | null, autoSync: boolean, initial: {
  lastSync: string | null;
  lastResult: LastResult | null;
}) {
  const [busy, setBusy] = useState(false);
  const [lastSync, setLastSync] = useState(initial.lastSync);
  const [lastResult, setLastResult] = useState(initial.lastResult);
  const [error, setError] = useState<string | null>(null);
  const busyRef = useRef(false);
  const lastSyncRef = useRef(initial.lastSync);
  const pairingRef = useRef(pairing);
  const autoRef = useRef(autoSync);
  pairingRef.current = pairing;
  autoRef.current = autoSync;
  lastSyncRef.current = lastSync;

  useEffect(() => {
    if (pairing) return;
    setLastSync(null);
    setLastResult(null);
    setError(null);
    lastSyncRef.current = null;
  }, [pairing]);

  const syncDays = useCallback(async (days: number) => {
    const current = pairingRef.current;
    if (!current || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const summary = await runSync(days, {
        reader,
        serverUrl: current.serverUrl,
        token: current.token,
        device: `${Platform.OS} ${Platform.Version}`,
      });
      const iso = new Date().toISOString();
      await saveLastSync(iso);
      await saveLastResult(summary);
      setLastSync(iso);
      setLastResult(summary);
    } catch (err) {
      setError(errorToText(err));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, []);

  const maybeAuto = useCallback(() => {
    if (!pairingRef.current) return;
    if (!shouldAutoSync(lastSyncRef.current, new Date(), autoRef.current, busyRef.current)) return;
    void syncDays(daysToSync(lastSyncRef.current, new Date()));
  }, [syncDays]);

  useEffect(() => {
    maybeAuto();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") maybeAuto();
    });
    return () => sub.remove();
  }, [maybeAuto]);

  const requestAccess = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      await reader.requestAccess();
    } catch (err) {
      setError(errorToText(err));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, []);

  const openHealthConnectStore = useCallback(async () => {
    try {
      await Linking.openURL(PLAY_MARKET);
    } catch {
      await Linking.openURL(PLAY_HTTPS);
    }
  }, []);

  return {
    busy,
    lastSync,
    lastResult,
    error,
    syncNow: () => syncDays(daysToSync(lastSync, new Date())),
    backfill90: () => syncDays(90),
    requestAccess,
    openHealthConnectStore,
  };
}
