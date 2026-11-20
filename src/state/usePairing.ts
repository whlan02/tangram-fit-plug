import { useCallback, useState } from "react";
import { Platform } from "react-native";
import { errorToText } from "../errors";
import { expectedSource } from "../expected-source";
import { t } from "../i18n";
import { checkToken, normalizeServerUrl } from "../ingest";
import { parsePairingLink } from "../pairing-link";
import { clearLastResult, clearPairing, saveOnboarded, savePairing, type Pairing } from "../storage";

export function usePairing(initial: Pairing | null, initialOnboarded: boolean) {
  const [pairing, setPairing] = useState(initial);
  const [onboarded, setOnboarded] = useState(initialOnboarded || !!initial);
  const [serverUrl, setServerUrl] = useState("");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyLink = useCallback((url: string | null) => {
    if (!url || pairing) return;
    const parsed = parsePairingLink(url);
    if (!parsed) return;
    setServerUrl(parsed.serverUrl);
    setToken(parsed.token);
    setOnboarded(true);
    void saveOnboarded();
  }, [pairing]);

  const finishOnboarding = useCallback(async () => {
    await saveOnboarded();
    setOnboarded(true);
  }, []);

  const testAndSave = useCallback(async () => {
    setError(null);
    if (!token.trim()) {
      setError(t("pair.tokenRequired"));
      return;
    }
    setBusy(true);
    try {
      const normalized = normalizeServerUrl(serverUrl);
      const info = await checkToken(normalized, token.trim());
      const expected = expectedSource(Platform.OS);
      if (info.source !== expected) {
        setError(t("pair.sourceMismatch", {
          actual: info.source,
          expected,
          hint: Platform.OS === "ios" ? t("pair.hintIos") : t("pair.hintAndroid"),
        }));
        return;
      }
      const next = { serverUrl: normalized, token: token.trim() };
      await savePairing(next);
      await saveOnboarded();
      setPairing(next);
      setOnboarded(true);
      setToken("");
      setServerUrl("");
    } catch (err) {
      setError(errorToText(err));
    } finally {
      setBusy(false);
    }
  }, [serverUrl, token]);

  const unpair = useCallback(async () => {
    await clearPairing();
    await clearLastResult();
    setPairing(null);
    setError(null);
  }, []);

  return {
    pairing,
    onboarded,
    serverUrl,
    token,
    setServerUrl,
    setToken,
    busy,
    error,
    applyLink,
    finishOnboarding,
    testAndSave,
    unpair,
  };
}
