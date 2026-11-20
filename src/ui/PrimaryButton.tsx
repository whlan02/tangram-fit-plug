import { ActivityIndicator, Text } from "react-native";
import { radius, space, type, useTheme } from "../theme";
import { PressableScale } from "./PressableScale";

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
}

export function PrimaryButton({ label, onPress, disabled, busy }: Props) {
  const theme = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || busy}
      accessibilityLabel={label}
      style={{
        backgroundColor: theme.primary,
        borderRadius: radius.pill,
        paddingVertical: space.md,
        paddingHorizontal: space.xxl,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: space.sm,
      }}
    >
      {busy ? <ActivityIndicator color={theme.onPrimary} /> : null}
      <Text style={{ color: theme.onPrimary, fontSize: type.body, fontWeight: "600" }}>{label}</Text>
    </PressableScale>
  );
}
