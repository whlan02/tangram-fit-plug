import { useColorScheme } from "react-native";

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  card: 24,
  input: 14,
  pill: 999,
} as const;

export const type = {
  title: 28,
  heading: 20,
  body: 16,
  caption: 13,
  label: 14,
} as const;

export const minTap = 44;

export interface Theme {
  bg: string;
  ink: string;
  muted: string;
  card: string;
  line: string;
  primary: string;
  onPrimary: string;
  success: string;
  warning: string;
  danger: string;
  scheme: "light" | "dark";
}

const light: Theme = {
  bg: "#f8f9f4",
  ink: "#1a1d17",
  muted: "#5c6258",
  card: "#ffffff",
  line: "rgba(26,29,23,0.08)",
  primary: "#1f6b3a",
  onPrimary: "#ffffff",
  success: "#1f6b3a",
  warning: "#b4501a",
  danger: "#b42318",
  scheme: "light",
};

const dark: Theme = {
  bg: "#111410",
  ink: "#f2f4ee",
  muted: "#a3aa9c",
  card: "#1c201a",
  line: "rgba(242,244,238,0.1)",
  primary: "#9be3b0",
  onPrimary: "#0e1a12",
  success: "#9be3b0",
  warning: "#b4501a",
  danger: "#b42318",
  scheme: "dark",
};

export function themeFor(scheme: string | null | undefined): Theme {
  return scheme === "dark" ? dark : light;
}

export function useTheme(): Theme {
  return themeFor(useColorScheme());
}
