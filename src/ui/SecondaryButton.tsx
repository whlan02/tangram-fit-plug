import { Text } from "react-native";
import { radius, space, type, useTheme } from "../theme";
import { PressableScale } from "./PressableScale";

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  danger?: boolean;
  emphasize?: boolean;
}

export function SecondaryButton({ label, onPress, disabled, danger, emphasize }: Props) {
  const theme = useTheme();
  const color = danger ? theme.danger : theme.primary;
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      style={{
        borderRadius: radius.pill,
        borderWidth: emphasize ? 2 : 1,
        borderColor: color,
        backgroundColor: emphasize ? `${theme.primary}22` : "transparent",
        paddingVertical: space.md,
        paddingHorizontal: space.xl,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color, fontSize: type.body, fontWeight: "600" }}>{label}</Text>
    </PressableScale>
  );
}
