import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, fonts, spacing } from "../theme";

type Props = { icon: string; title: string; subtitle?: string; rtl?: boolean };

/** Icon + serif title row used at the top of every card, matching the reference design. */
export default function SectionHeader({ icon, title, subtitle, rtl }: Props) {
  return (
    <View style={styles.container}>
      <View style={[styles.titleRow, rtl && styles.titleRowRTL]}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={[styles.title, rtl && styles.textRTL]}>{title}</Text>
      </View>
      {subtitle ? (
        <Text style={[styles.subtitle, rtl && styles.subtitleRTL]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  titleRow: { flexDirection: "row", alignItems: "center" },
  titleRowRTL: { flexDirection: "row-reverse" },
  icon: { fontSize: 20, marginRight: spacing.sm, color: colors.primary },
  title: { fontSize: 20, fontFamily: fonts.heading, fontWeight: "700", color: colors.textDark },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: spacing.xs, marginLeft: 28 },
  subtitleRTL: { marginLeft: 0, marginRight: 28, textAlign: "right", writingDirection: "rtl" },
  textRTL: { textAlign: "right", writingDirection: "rtl" },
});
