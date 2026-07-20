import React, { useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { fetchSiteGuide } from "../api/client";
import { strings, Language } from "../i18n/strings";
import { isRTL } from "../i18n/rtl";
import { useResponsive } from "../hooks/useResponsive";
import { colors, radii, spacing, fonts } from "../theme";
import Card from "../components/Card";
import SectionHeader from "../components/SectionHeader";
import { KaabaEmblem, MountainMark } from "../components/Illustration";

const SITES: { id: string; label: Record<Language, string>; Mark: React.ComponentType<{ size?: number }> }[] = [
  { id: "kaaba", label: { en: "The Kaaba", ar: "الكعبة" }, Mark: KaabaEmblem },
  { id: "jabal_al_nour", label: { en: "Jabal al-Nour", ar: "جبل النور" }, Mark: MountainMark },
];

type Props = { language: Language };

export default function GuideScreen({ language }: Props) {
  const [info, setInfo] = useState("");
  const t = strings[language];
  const rtl = isRTL(language);
  const { contentMaxWidth } = useResponsive();

  async function onSelect(id: string) {
    try {
      const data = await fetchSiteGuide(id);
      setInfo(data[language] ?? data.error ?? "");
    } catch {
      setInfo("PLACEHOLDER: could not reach backend guide service.");
    }
  }

  return (
    <View style={styles.container}>
      <Card style={{ maxWidth: contentMaxWidth, alignSelf: "center", width: "100%" }}>
        <SectionHeader icon="🔍" title={t.guideTitle} subtitle={t.guideSubtitle} rtl={rtl} />
        <FlatList
          data={SITES}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable style={[styles.item, rtl && styles.itemRTL]} onPress={() => onSelect(item.id)}>
              <View style={styles.itemMark}>
                <item.Mark size={32} />
              </View>
              <Text style={[styles.itemText, rtl && styles.textRTL]}>{item.label[language]}</Text>
            </Pressable>
          )}
        />
        {info ? <Text style={[styles.info, rtl && styles.textRTL]}>{info}</Text> : null}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: spacing.lg },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemRTL: { flexDirection: "row-reverse" },
  itemMark: { marginHorizontal: spacing.md },
  itemText: { fontSize: 16, fontFamily: fonts.body, color: colors.textDark },
  info: { marginTop: spacing.md, fontSize: 14, lineHeight: 20, color: colors.textDark },
  textRTL: { textAlign: "right", writingDirection: "rtl" },
});
