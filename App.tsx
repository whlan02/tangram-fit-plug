import { StatusBar } from "expo-status-bar";
import * as Linking from "expo-linking";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { t, type LocalePref } from "./src/i18n";
import reader from "./src/health/reader";
import { usePairing } from "./src/state/usePairing";
import { applyStoredLocale, useSettings } from "./src/state/useSettings";
import { useSync } from "./src/state/useSync";
import {
  loadAutoSync,
  loadHealthAccessAsked,
  loadLastResult,
  loadLastSync,
  loadLocalePref,
  loadOnboarded,
  loadPairing,
  type LastResult,
  type Pairing,
} from "./src/storage";
import { useTheme } from "./src/theme";
import { HomeScreen } from "./src/ui/HomeScreen";
import { OnboardingScreen } from "./src/ui/OnboardingScreen";
import { PairScreen } from "./src/ui/PairScreen";
import { SettingsScreen } from "./src/ui/SettingsScreen";
import { TabBar, type AppTab } from "./src/ui/TabBar";

interface Boot {
  pairing: Pairing | null;
  onboarded: boolean;
  lastSync: string | null;
  lastResult: LastResult | null;
  localePref: LocalePref;
  autoSync: boolean;
  healthAccessAsked: boolean;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Root />
    </SafeAreaProvider>
  );
}

function Root() {
  const [boot, setBoot] = useState<Boot | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const snapshot = await loadBoot();
      if (!cancelled) setBoot(snapshot);
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  if (!boot) return <Loading />;
  return <Ready boot={boot} />;
}

function Ready({ boot }: { boot: Boot }) {
  const settings = useSettings(boot);
  const pairing = usePairing(boot.pairing, boot.onboarded);
  const sync = useSync(pairing.pairing, settings.autoSync && settings.healthAccessAsked, boot);
  const linkingUrl = Linking.useLinkingURL();
  const [tab, setTab] = useState<AppTab>("sync");

  useEffect(() => {
    if (!linkingUrl) return;
    pairing.applyLink(Linking.unwrapDevLaunchURL(linkingUrl) || linkingUrl);
  }, [linkingUrl, pairing.applyLink]);

  if (!pairing.onboarded && !pairing.pairing) {
    return <OnboardingScreen onStart={() => void pairing.finishOnboarding()} />;
  }
  if (!pairing.pairing) {
    return (
      <PairScreen
        serverUrl={pairing.serverUrl}
        token={pairing.token}
        onServerUrl={pairing.setServerUrl}
        onToken={pairing.setToken}
        onSubmit={() => void pairing.testAndSave()}
        busy={pairing.busy}
        error={pairing.error}
      />
    );
  }
  return (
    <View style={{ flex: 1 }}>
      {tab === "sync" ? (
        <HomeScreen
          serverUrl={pairing.pairing.serverUrl}
          source={reader.source}
          locale={settings.locale}
          lastSyncIso={sync.lastSync}
          lastResult={sync.lastResult}
          busy={sync.busy}
          error={sync.error}
          healthAccessAsked={settings.healthAccessAsked}
          onSync={() => void sync.syncNow()}
          onBackfill={() => void sync.backfill90()}
          onGrantAccess={() => {
            void sync.requestAccess().then(() => settings.markHealthAccessAsked());
          }}
          onOpenHealthConnect={() => void sync.openHealthConnectStore()}
        />
      ) : (
        <SettingsScreen
          localePref={settings.localePref}
          autoSync={settings.autoSync}
          onLocalePref={(pref) => void settings.changeLocalePref(pref)}
          onAutoSync={(on) => void settings.changeAutoSync(on)}
          onUnpair={() => confirmUnpair(() => void pairing.unpair())}
          busy={sync.busy}
        />
      )}
      <TabBar tab={tab} onChange={setTab} disabled={sync.busy} />
    </View>
  );
}

function Loading() {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: "center", justifyContent: "center" }} accessibilityLabel={t("app.loading")}>
      <ActivityIndicator color={theme.primary} />
    </View>
  );
}

function confirmUnpair(onConfirm: () => void) {
  Alert.alert(t("settings.unpairTitle"), t("settings.unpairBody"), [
    { text: t("settings.cancel"), style: "cancel" },
    { text: t("settings.unpairConfirm"), style: "destructive", onPress: onConfirm },
  ]);
}

async function loadBoot(): Promise<Boot> {
  const [pairing, onboarded, lastSync, lastResult, localePref, autoSync, healthAccessAsked] = await Promise.all([
    loadPairing(),
    loadOnboarded(),
    loadLastSync(),
    loadLastResult(),
    loadLocalePref(),
    loadAutoSync(),
    loadHealthAccessAsked(),
  ]);
  applyStoredLocale(localePref);
  return { pairing, onboarded, lastSync, lastResult, localePref, autoSync, healthAccessAsked };
}
