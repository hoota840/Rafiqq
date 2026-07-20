import React, { useState } from "react";
import { View, Text, TextInput, Switch, StyleSheet } from "react-native";
import { strings, Language } from "../i18n/strings";
import { isRTL } from "../i18n/rtl";
import { useResponsive } from "../hooks/useResponsive";
import { API_BASE } from "../api/client";
import { colors, fonts, spacing } from "../theme";
import Card from "../components/Card";
import SectionHeader from "../components/SectionHeader";
import PillButton from "../components/PillButton";
import StepSlider from "../components/StepSlider";

const DEMO_PILGRIM_ID = "demo-pilgrim-1";

type Props = { language: Language };

export default function HealthScreen({ language }: Props) {
  const t = strings[language];
  const rtl = isRTL(language);
  const { contentMaxWidth } = useResponsive();
  const [fatigue, setFatigue] = useState(3);
  const [age, setAge] = useState("");
  const [conditions, setConditions] = useState("");
  const [mobilityAssist, setMobilityAssist] = useState(false);
  const [status, setStatus] = useState("none");
  // Off by default — manual reports + phone sensors are the primary signal;
  // a wearable is an optional, clearly-secondary enhancement (see CLAUDE.md).
  const [hasWearable, setHasWearable] = useState(false);

  async function triggerTestAlert() {
    await fetch(`${API_BASE}/api/health/alert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pilgrimId: DEMO_PILGRIM_ID,
        reason: "test trigger from app",
        source: hasWearable ? "wearable" : "manual",
      }),
    });
    setStatus("alert");
  }

  async function confirmOk() {
    await fetch(`${API_BASE}/api/health/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pilgrimId: DEMO_PILGRIM_ID, outcome: "ok" }),
    });
    setStatus("confirmed_ok");
  }

  const contentStyle = { maxWidth: contentMaxWidth, alignSelf: "center" as const, width: "100%" as const };

  return (
    <View style={styles.container}>
      <Card style={contentStyle}>
        <SectionHeader icon="♡" title={t.healthProfileTitle} rtl={rtl} />

        <Text style={[styles.label, rtl && styles.textRTL]}>
          {t.fatigueLabel}: {fatigue}/10
        </Text>
        <StepSlider value={fatigue} max={10} onChange={setFatigue} />

        <View style={[styles.row, rtl && styles.rowReverse]}>
          <View style={styles.rowItem}>
            <Text style={[styles.label, rtl && styles.textRTL]}>{t.ageLabel}</Text>
            <TextInput
              style={[styles.input, rtl && styles.textRTL]}
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <View style={styles.rowItem}>
            <Text style={[styles.label, rtl && styles.textRTL]}>{t.conditionsLabel}</Text>
            <TextInput
              style={[styles.input, rtl && styles.textRTL]}
              value={conditions}
              onChangeText={setConditions}
              placeholder={t.conditionsPlaceholder}
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>

        <View style={[styles.toggleRow, rtl && styles.rowReverse]}>
          <Text style={[styles.toggleLabel, rtl && styles.textRTL]}>{t.mobilityLabel}</Text>
          <Switch
            value={mobilityAssist}
            onValueChange={setMobilityAssist}
            trackColor={{ true: colors.toggleTrackOn, false: colors.border }}
            thumbColor={colors.white}
          />
        </View>

        <PillButton label={t.saveProfile} icon="✨" onPress={() => {}} style={styles.saveButton} rtl={rtl} />
      </Card>

      <Card style={contentStyle}>
        <SectionHeader icon="🚨" title={t.emergencyTitle} rtl={rtl} />
        <Text style={[styles.note, rtl && styles.textRTL]}>{t.emergencyNote}</Text>
        <Text style={[styles.status, rtl && styles.textRTL]}>Status: {status}</Text>
        <PillButton label={t.triggerAlert} onPress={triggerTestAlert} variant="primary" style={styles.gap} rtl={rtl} />
        <PillButton label={t.imOkay} onPress={confirmOk} variant="secondary" rtl={rtl} />

        <View style={styles.divider} />

        <View style={[styles.wearableRow, rtl && styles.rowReverse]}>
          <Text style={[styles.wearableLabel, rtl && styles.textRTL]}>{t.wearableOptionalLabel}</Text>
          <Switch
            value={hasWearable}
            onValueChange={setHasWearable}
            trackColor={{ true: colors.primaryLight, false: colors.border }}
            thumbColor={colors.white}
          />
        </View>
        <Text style={[styles.wearableNote, rtl && styles.textRTL]}>{t.wearableOptionalNote}</Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: spacing.lg },
  rowReverse: { flexDirection: "row-reverse" },
  textRTL: { textAlign: "right", writingDirection: "rtl" },
  label: { fontSize: 14, fontFamily: fonts.body, color: colors.textDark, marginBottom: spacing.xs },
  row: { flexDirection: "row", marginTop: spacing.md, gap: spacing.md },
  rowItem: { flex: 1 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: 15,
    color: colors.textDark,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.toggleTrackOn,
    borderRadius: 16,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  toggleLabel: { fontSize: 15, color: colors.textDark, flex: 1, marginRight: spacing.sm },
  saveButton: { marginTop: spacing.lg },
  note: {
    fontSize: 13,
    color: "#856404",
    backgroundColor: "#FFF3CD",
    padding: spacing.sm,
    borderRadius: 10,
    marginBottom: spacing.md,
  },
  status: { fontSize: 15, marginBottom: spacing.md, color: colors.textDark },
  gap: { marginBottom: spacing.sm },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  wearableRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  wearableLabel: { fontSize: 14, color: colors.textDark, flex: 1, marginRight: spacing.sm },
  wearableNote: { fontSize: 12, color: colors.textMuted, marginTop: spacing.xs, lineHeight: 17 },
});
