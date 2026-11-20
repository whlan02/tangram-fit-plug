import { nativeApplicationVersion } from "expo-application";
import * as Linking from "expo-linking";
import { type ReactNode, useState } from "react";
import { Modal, Platform, ScrollView, Switch, Text, View } from "react-native";
import { LOCALES, t, type LocalePref } from "../i18n";
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
          <LanguagePicker pref={props.localePref} onPref={props.onLocalePref} />
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

function LanguagePicker({ pref, onPref }: { pref: LocalePref; onPref: (pref: LocalePref) => void }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const current =
    pref === "auto" ? t("settings.languageAuto") : (LOCALES.find((item) => item.code === pref)?.name ?? pref);
  return (
    <View>
      <PressableScale
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${t("settings.language")}: ${current}`}
        style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
      >
        <Text style={{ fontSize: type.body, color: theme.ink }}>{current}</Text>
      </PressableScale>
      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: space.xxl }}>
          <Text style={{ fontSize: type.heading, fontWeight: "600", color: theme.ink, paddingHorizontal: space.lg, paddingBottom: space.md }}>
            {t("settings.language")}
          </Text>
          <ScrollView contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: space.xxl }}>
            <LangRow
              label={t("settings.languageAuto")}
              selected={pref === "auto"}
              onPress={() => {
                onPref("auto");
                setOpen(false);
              }}
            />
            {LOCALES.map((item) => (
              <LangRow
                key={item.code}
                label={item.name}
                selected={pref === item.code}
                onPress={() => {
                  onPref(item.code);
                  setOpen(false);
                }}
              />
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function LangRow({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
    >
      <Text style={{ fontSize: type.body, color: theme.ink }}>{label}</Text>
      <Text style={{ color: theme.primary, fontSize: type.body }}>{selected ? "✓" : ""}</Text>
    </PressableScale>
  );
}
