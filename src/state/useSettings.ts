import { getLocales } from "expo-localization";
import { useCallback, useState } from "react";
import { setLocale, type Locale, type LocalePref } from "../i18n";
import {
  saveAutoSync,
  saveHealthAccessAsked,
  saveLocalePref,
} from "../storage";

function deviceTag(): string {
  return getLocales()[0]?.languageTag ?? "en";
}

export function applyStoredLocale(pref: LocalePref): Locale {
  return setLocale(pref, deviceTag());
}

export function useSettings(initial: {
  localePref: LocalePref;
  autoSync: boolean;
  healthAccessAsked: boolean;
}) {
  const [localePref, setLocalePrefState] = useState(initial.localePref);
  const [locale, setLocaleState] = useState<Locale>(() => applyStoredLocale(initial.localePref));
  const [autoSync, setAutoSyncState] = useState(initial.autoSync);
  const [healthAccessAsked, setHealthAccessAsked] = useState(initial.healthAccessAsked);

  const changeLocalePref = useCallback(async (pref: LocalePref) => {
    await saveLocalePref(pref);
    setLocalePrefState(pref);
    setLocaleState(applyStoredLocale(pref));
  }, []);

  const changeAutoSync = useCallback(async (on: boolean) => {
    await saveAutoSync(on);
    setAutoSyncState(on);
  }, []);

  const markHealthAccessAsked = useCallback(async () => {
    await saveHealthAccessAsked();
    setHealthAccessAsked(true);
  }, []);

  return {
    localePref,
    locale,
    autoSync,
    healthAccessAsked,
    changeLocalePref,
    changeAutoSync,
    markHealthAccessAsked,
  };
}
