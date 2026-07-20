import React, { PropsWithChildren } from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { colors, radii, spacing, shadow } from "../theme";

type Props = PropsWithChildren<{ style?: ViewStyle; gradient?: boolean }>;

/** Rounded white (or teal-gradient) card container matching the reference design's section blocks. */
export default function Card({ children, style, gradient }: Props) {
  return (
    <View style={[styles.card, gradient && styles.gradientCard, style]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.card,
    padding: spacing.lg,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    ...shadow,
  },
  gradientCard: {
    backgroundColor: colors.gradientBottom,
  },
});
