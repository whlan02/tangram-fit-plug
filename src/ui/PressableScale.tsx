import { type ReactNode } from "react";
import { Pressable, type AccessibilityRole, type AccessibilityState, type StyleProp, type ViewStyle } from "react-native";
import { minTap } from "../theme";

interface Props {
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: AccessibilityState;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function PressableScale({
  onPress,
  disabled,
  accessibilityLabel,
  accessibilityRole = "button",
  accessibilityState,
  children,
  style,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled, ...accessibilityState }}
      style={({ pressed }) => [
        { minHeight: minTap, minWidth: minTap, opacity: disabled ? 0.5 : pressed ? 0.72 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}
