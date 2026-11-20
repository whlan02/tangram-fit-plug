import { Text, View } from "react-native";
import { t } from "../i18n";
import { space, type, useTheme } from "../theme";
import { PrimaryButton } from "./PrimaryButton";
import { Screen } from "./Screen";

interface Point {
  titleKey: "onboarding.point1Title" | "onboarding.point2Title" | "onboarding.point3Title";
  bodyKey: "onboarding.point1Body" | "onboarding.point2Body" | "onboarding.point3Body";
  mark: string;
}

const POINTS: Point[] = [
  { titleKey: "onboarding.point1Title", bodyKey: "onboarding.point1Body", mark: "1" },
  { titleKey: "onboarding.point2Title", bodyKey: "onboarding.point2Body", mark: "2" },
  { titleKey: "onboarding.point3Title", bodyKey: "onboarding.point3Body", mark: "3" },
];

export function OnboardingScreen({ onStart }: { onStart: () => void }) {
  const theme = useTheme();
  return (
    <Screen>
      <Text style={{ fontSize: type.title, fontWeight: "700", color: theme.ink, marginBottom: space.xxl }}>
        {t("app.title")}
      </Text>
      <View style={{ gap: space.xl, flex: 1 }}>
        {POINTS.map((p) => (
          <View key={p.titleKey} style={{ flexDirection: "row", gap: space.md, alignItems: "flex-start" }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: theme.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: theme.onPrimary, fontWeight: "700" }}>{p.mark}</Text>
            </View>
            <View style={{ flex: 1, gap: space.xs }}>
              <Text style={{ fontSize: type.heading, fontWeight: "600", color: theme.ink }}>{t(p.titleKey)}</Text>
              <Text style={{ fontSize: type.body, color: theme.muted, lineHeight: 22 }}>{t(p.bodyKey)}</Text>
            </View>
          </View>
        ))}
      </View>
      <PrimaryButton label={t("onboarding.start")} onPress={onStart} />
    </Screen>
  );
}
