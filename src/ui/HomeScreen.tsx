import { ActivityIndicator, Platform, RefreshControl, ScrollView, Text, View } from "react-native";
import { t, type Locale } from "../i18n";
import { serverHost } from "../pairing-link";
import type { LastResult } from "../storage";
import { space, type, useTheme } from "../theme";
import type { SourceName } from "../types";
import { PrimaryButton } from "./PrimaryButton";
import { ResultCard } from "./ResultCard";
import { Screen } from "./Screen";
import { SecondaryButton } from "./SecondaryButton";
import { StatusCard } from "./StatusCard";

interface Props {
  serverUrl: string;
  source: SourceName;
  locale: Locale;
  lastSyncIso: string | null;
  lastResult: LastResult | null;
  busy: boolean;
  error: string | null;
  healthAccessAsked: boolean;
  onSync: () => void;
  onBackfill: () => void;
  onGrantAccess: () => void;
  onOpenHealthConnect: () => void;
}

export function HomeScreen(props: Props) {
  const theme = useTheme();
  const sourceLabel = props.source === "healthkit" ? t("home.sourceHealthkit") : t("home.sourceHealthConnect");
  const showStore =
    Platform.OS === "android" && !!props.error && props.error.includes("Health Connect");
  return (
    <Screen padBottom={space.sm}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={props.busy} onRefresh={props.onSync} tintColor={theme.primary} />
        }
        contentContainerStyle={{ gap: space.lg, paddingBottom: space.xxl }}
      >
        <View>
          <Text style={{ fontSize: type.title, fontWeight: "700", color: theme.ink }}>{t("app.title")}</Text>
          <Text style={{ fontSize: type.body, color: theme.muted, marginTop: space.xs }}>
            {t("home.subtitle", { host: serverHost(props.serverUrl), source: sourceLabel })}
          </Text>
        </View>
        <StatusCard lastSyncIso={props.lastSyncIso} now={new Date()} locale={props.locale} />
        <PrimaryButton
          label={props.busy ? t("home.syncing") : t("home.syncNow")}
          onPress={props.onSync}
          busy={props.busy}
        />
        {props.busy ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
            <ActivityIndicator color={theme.primary} />
            <Text style={{ color: theme.muted, fontSize: type.body }}>{t("home.syncing")}</Text>
          </View>
        ) : null}
        <ResultCard result={props.lastResult} />
        {props.error ? <Text style={{ color: theme.danger, fontSize: type.body }}>{props.error}</Text> : null}
        {showStore ? (
          <SecondaryButton label={t("home.openHealthConnect")} onPress={props.onOpenHealthConnect} />
        ) : null}
        <SecondaryButton
          label={t("home.grantAccess")}
          onPress={props.onGrantAccess}
          disabled={props.busy}
          emphasize={!props.healthAccessAsked}
        />
        <SecondaryButton label={t("home.backfill90")} onPress={props.onBackfill} disabled={props.busy} />
      </ScrollView>
    </Screen>
  );
}
