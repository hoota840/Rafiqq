import React, { useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, Modal, ActivityIndicator } from "react-native";
import { fetchSiteGuide } from "../api/client";
import { strings, Language } from "../i18n/strings";
import { isRTL } from "../i18n/rtl";
import { useResponsive } from "../hooks/useResponsive";
import { colors, radii, spacing, fonts, shadow } from "../theme";
import Card from "../components/Card";
import SectionHeader from "../components/SectionHeader";
import { MosqueMark } from "../components/Illustration";

const SITES: { id: string; label: Record<Language, string> }[] = [
  { id: "haram", label: { en: "Masjid al-Haram", ar: "المسجد الحرام" } },
  { id: "mina", label: { en: "Mina", ar: "منى" } },
  { id: "arafat", label: { en: "Arafat", ar: "عرفات" } },
];

type Props = { language: Language };

export default function GuideScreen({ language }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [story, setStory] = useState<{ en: string; ar: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const t = strings[language];
  const rtl = isRTL(language);
  const { contentMaxWidth } = useResponsive();

  async function onSelect(id: string) {
    setOpenId(id);
    setStory(null);
    setLoading(true);
    try {
      const data = await fetchSiteGuide(id);
      setStory(data.error ? null : { en: data.en, ar: data.ar });
    } catch {
      setStory(null);
    } finally {
      setLoading(false);
    }
  }

  const openSite = SITES.find((s) => s.id === openId) ?? null;

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
                <MosqueMark size={32} />
              </View>
              <Text style={[styles.itemText, rtl && styles.textRTL]}>{item.label[language]}</Text>
            </Pressable>
          )}
        />
      </Card>

      <Modal visible={!!openId} transparent animationType="fade" onRequestClose={() => setOpenId(null)}>
        <Pressable style={styles.backdrop} onPress={() => setOpenId(null)}>
          <Pressable
            style={[styles.popup, { maxWidth: contentMaxWidth }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.popupHeader, rtl && styles.rowReverse]}>
              <View style={rtl ? { marginLeft: spacing.sm } : { marginRight: spacing.sm }}>
                <MosqueMark size={30} />
              </View>
              <Text style={[styles.popupTitle, styles.popupTitleFlex]}>{openSite?.label[language]}</Text>
              <Pressable onPress={() => setOpenId(null)} hitSlop={8} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </Pressable>
            </View>
            {loading ? (
              <ActivityIndicator color={colors.primary} style={styles.popupLoading} />
            ) : story ? (
              <>
                <Text style={[styles.popupText, styles.textRTL]}>{story.ar}</Text>
                <View style={styles.popupDivider} />
                <Text style={styles.popupText}>{story.en}</Text>
              </>
            ) : (
              <Text style={styles.popupText}>PLACEHOLDER: could not reach backend guide service.</Text>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: spacing.lg },
  rowReverse: { flexDirection: "row-reverse" },
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
  textRTL: { textAlign: "right", writingDirection: "rtl" },
  backdrop: { flex: 1, backgroundColor: "rgba(31, 45, 40, 0.35)", alignItems: "center", justifyContent: "center", padding: spacing.lg },
  popup: {
    width: "100%",
    backgroundColor: colors.card,
    borderRadius: radii.card,
    padding: spacing.lg,
    ...shadow,
  },
  popupHeader: { flexDirection: "row", alignItems: "center", marginBottom: spacing.sm },
  popupTitle: { fontSize: 18, fontWeight: "700", fontFamily: fonts.heading, color: colors.textDark },
  popupTitleFlex: { flex: 1 },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: { fontSize: 14, fontWeight: "700", color: colors.textMuted },
  popupLoading: { marginVertical: spacing.lg },
  popupText: { fontSize: 14, lineHeight: 20, color: colors.textDark, fontFamily: fonts.body },
  popupDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
});
