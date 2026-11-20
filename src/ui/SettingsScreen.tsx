import { nativeApplicationVersion } from "expo-application";
import * as Linking from "expo-linking";
import { type ReactNode } from "react";
import { Platform, ScrollView, Switch, Text, View } from "react-native";
import { t, type LocalePref } from "../i18n";
import { space, type, useTheme } from "../theme";
import { PressableScale } from "./PressableScale";
import { Screen } from "./Screen";
import { SecondaryButton } from "./SecondaryButton";

const DATA_KEYS = [
  "settings.data.steps",
  "settings.data.activity",
  "settings.data.restingHr",
  "settings.data.hrv",
  "settings.data.weight",
  "settings.data.bodyFat",
  "settings.data.spo2",
  "settings.data.breathing",
  "settings.data.vo2max",
  "settings.data.sleep",
  "settings.data.exercise",
] as const;

const GITHUB = "https://github.com/whlan02/tangram-fit-plug";

interface Props {
  localePref: LocalePref;
  autoSync: boolean;
  onLocalePref: (pref: LocalePref) => void;
  onAutoSync: (on: boolean) => void;
  onUnpair: () => void;
  busy: boolean;
}

export function SettingsScreen(props: Props) {
  const theme = useTheme();
  const version = nativeApplicationVersion ?? "—";
  const dataKeys = Platform.OS === "ios" ? [...DATA_KEYS, "settings.data.skinTemp" as const] : DATA_KEYS;
  return (
    <Screen padBottom={space.sm}>
      <ScrollView contentContainerStyle={{ gap: space.xl, paddingBottom: space.xxl }}>
        <Text style={{ fontSize: type.title, fontWeight: "700", color: theme.ink }}>{t("settings.title")}</Text>
        <Section title={t("settings.language")}>
          <Choice label={t("settings.languageAuto")} selected={props.localePref === "auto"} onPress={() => props.onLocalePref("auto")} />
          <Choice label={t("settings.languageZh")} selected={props.localePref === "zh"} onPress={() => props.onLocalePref("zh")} />
          <Choice label={t("settings.languageEn")} selected={props.localePref === "en"} onPress={() => props.onLocalePref("en")} />
        </Section>
        <Section title={t("settings.autoSync")}>
          <Switch
            value={props.autoSync}
            onValueChange={props.onAutoSync}
            accessibilityLabel={t("settings.autoSync")}
            trackColor={{ true: theme.primary, false: theme.line }}
          />
        </Section>
        <Section title={t("settings.dataTypes")}>
          <Text style={{ fontSize: type.caption, color: theme.muted }}>{t("settings.dataTypesNote")}</Text>
          {dataKeys.map((key) => (
            <Text key={key} style={{ fontSize: type.body, color: theme.ink }}>• {t(key)}</Text>
          ))}
        </Section>
        <Section title={t("settings.privacy")}>
          <Text style={{ fontSize: type.body, color: theme.muted, lineHeight: 22 }}>{t("settings.privacyBody")}</Text>
        </Section>
        <Section title={t("settings.about")}>
          <Text style={{ fontSize: type.body, color: theme.ink }}>{t("settings.version", { version })}</Text>
          <PressableScale
            accessibilityRole="link"
            accessibilityLabel={t("settings.github")}
            onPress={() => Linking.openURL(GITHUB)}
            style={{ justifyContent: "center" }}
          >
            <Text style={{ fontSize: type.body, color: theme.primary }}>{t("settings.github")}</Text>
          </PressableScale>
        </Section>
        <SecondaryButton label={t("settings.unpair")} onPress={props.onUnpair} danger disabled={props.busy} />
      </ScrollView>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ gap: space.sm }}>
      <Text style={{ fontSize: type.heading, fontWeight: "600", color: theme.ink }}>{title}</Text>
      {children}
    </View>
  );
}

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
    >
      <Text style={{ fontSize: type.body, color: theme.ink }}>{label}</Text>
      <Text style={{ color: theme.primary, fontSize: type.body }}>{selected ? "●" : "○"}</Text>
    </PressableScale>
  );
}
