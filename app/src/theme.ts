import { Platform } from "react-native";

export const colors = {
  background: "#FAF3E7",
  card: "#FFFFFF",
  primary: "#3C7F63",
  primaryDark: "#2F6650",
  primaryLight: "#BFE3D6",
  gradientTop: "#BFE3DE",
  gradientBottom: "#8FCDB0",
  gold: "#C9A227",
  toggleTrackOn: "#CFE9F5",
  border: "#EAE2D0",
  textDark: "#1F2D28",
  textMuted: "#6B7280",
  danger: "#C0392B",
  white: "#FFFFFF",
};

export const radii = {
  card: 22,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20,
  xl: 28,
};

export const fonts = {
  heading: Platform.select({ ios: "Georgia", android: "serif", default: "serif" }),
  body: Platform.select({ ios: "System", android: "sans-serif", default: "System" }),
};

export const shadow = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 3,
};
