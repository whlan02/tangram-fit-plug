import { type ReactNode } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { space, useTheme } from "../theme";

interface Props {
  children: ReactNode;
  padBottom?: number;
}

export function Screen({ children, padBottom }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.bg,
        paddingTop: insets.top + space.sm,
        paddingLeft: insets.left + space.xl,
        paddingRight: insets.right + space.xl,
        paddingBottom: padBottom ?? insets.bottom + space.sm,
      }}
    >
      {children}
    </View>
  );
}
