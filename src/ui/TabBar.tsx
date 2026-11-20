import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { t } from "../i18n";
import { minTap, space, useTheme } from "../theme";
import { PressableScale } from "./PressableScale";

export type AppTab = "sync" | "settings";

interface Props {
  tab: AppTab;
  onChange: (tab: AppTab) => void;
  disabled?: boolean;
}

export function TabBar({ tab, onChange, disabled }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flexDirection: "row",
        borderTopWidth: 1,
        borderColor: theme.line,
        backgroundColor: theme.card,
        paddingBottom: insets.bottom,
        paddingHorizontal: space.md,
      }}
    >
      <TabItem label={t("tabs.sync")} selected={tab === "sync"} onPress={() => onChange("sync")} disabled={disabled} />
      <TabItem label={t("tabs.settings")} selected={tab === "settings"} onPress={() => onChange("settings")} disabled={disabled} />
    </View>
  );
}

function TabItem({
  label,
  selected,
  onPress,
  disabled,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="tab"
      accessibilityLabel={label}
      style={{ flex: 1, alignItems: "center", justifyContent: "center", minHeight: minTap, paddingVertical: space.sm }}
    >
      <Text
        numberOfLines={1}
        allowFontScaling={false}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        style={{
          fontSize: 11,
          fontWeight: selected ? "700" : "500",
          color: selected ? theme.primary : theme.muted,
          width: "100%",
          textAlign: "center",
        }}
      >
        {label}
      </Text>
    </PressableScale>
  );
}
