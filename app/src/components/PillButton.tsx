import React from "react";
import { Pressable, Text, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { colors, radii, spacing, fonts } from "../theme";

type Variant = "primary" | "secondary" | "outline";

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: string;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  rtl?: boolean;
};

/** Fully-rounded pill button in the three variants used across the reference screens. */
export default function PillButton({ label, onPress, variant = "primary", icon, style, disabled, rtl }: Props) {
  return (
    <Pressable
      style={[styles.base, rtl && styles.baseRTL, VARIANT_STYLES[variant], disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled}
    >
      {icon ? <Text style={[styles.label, LABEL_STYLES[variant]]}>{icon} </Text> : null}
      <Text style={[styles.label, LABEL_STYLES[variant]]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  baseRTL: { flexDirection: "row-reverse" },
  disabled: { opacity: 0.6 },
  label: { fontFamily: fonts.body, fontWeight: "600", fontSize: 15 },
});

const VARIANT_STYLES = StyleSheet.create({
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.primaryLight },
  outline: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.primary },
});

const LABEL_STYLES = StyleSheet.create({
  primary: { color: colors.white },
  secondary: { color: colors.primaryDark },
  outline: { color: colors.primary },
});
