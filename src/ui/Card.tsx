import { type ReactNode } from "react";
import { View } from "react-native";
import { radius, space, useTheme } from "../theme";

export function Card({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <View
      style={{
        backgroundColor: theme.card,
        borderRadius: radius.card,
        borderWidth: 1,
        borderColor: theme.line,
        padding: space.lg,
        gap: space.sm,
      }}
    >
      {children}
    </View>
  );
}
