import React, { useRef, useState } from "react";
import { View, Pressable, Text, StyleSheet, Modal, ScrollView, LayoutChangeEvent } from "react-native";
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import VoiceScreen from "./src/screens/VoiceScreen";
import NavigationScreen from "./src/screens/NavigationScreen";
import GuideScreen from "./src/screens/GuideScreen";
import HealthScreen from "./src/screens/HealthScreen";
import AccountScreen from "./src/screens/AccountScreen";
import { MosqueMark } from "./src/components/Illustration";
import FloatingMicButton from "./src/components/FloatingMicButton";
import { Language, strings } from "./src/i18n/strings";
import { isRTL } from "./src/i18n/rtl";
import { useResponsive } from "./src/hooks/useResponsive";
import { colors, fonts, radii, spacing, shadow } from "./src/theme";

type SectionName = "Voice" | "Navigation" | "Guide" | "Health" | "Account";

const SECTIONS: SectionName[] = ["Voice", "Navigation", "Guide", "Health", "Account"];

// Pilgrimage-specific icons (not generic icon-pack glyphs), one per destination.
const SECTION_ICONS: Record<SectionName, string> = {
  Voice: "🎙️",
  Navigation: "🧭",
  Guide: "📖",
  Health: "❤️",
  Account: "👤",
};

const SECTION_LABEL_KEY: Record<SectionName, "tabVoice" | "tabNavigation" | "tabGuide" | "tabHealth" | "tabAccount"> = {
  Voice: "tabVoice",
  Navigation: "tabNavigation",
  Guide: "tabGuide",
  Health: "tabHealth",
  Account: "tabAccount",
};

// Gap between the safe-area inset and the bar's own content, so the bar sits a
// little below the status bar/notch instead of flush against the very top edge.
const TOP_BAR_GAP = 14;
const TOP_BAR_CONTENT_HEIGHT = 56;

/**
 * One continuous scrollable page holding every module (Voice, Navigation,
 * Guide, Health, Account) end to end, instead of separate screens swapped in
 * and out. The hamburger (☰) menu is a set of jump links: picking an item
 * scrolls the page to that section rather than mounting a different
 * component. Each section records its own vertical offset via `onLayout`, and
 * the menu scrolls the shared `ScrollView` to it.
 */
function AppContent() {
  const [language, setLanguage] = useState<Language>("en");
  const [menuOpen, setMenuOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const { contentMaxWidth } = useResponsive();
  const t = strings[language];
  const rtl = isRTL(language);

  const scrollRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef<Partial<Record<SectionName, number>>>({});

  function recordOffset(name: SectionName) {
    return (event: LayoutChangeEvent) => {
      sectionOffsets.current[name] = event.nativeEvent.layout.y;
    };
  }

  function scrollToSection(name: SectionName) {
    setMenuOpen(false);
    const y = sectionOffsets.current[name] ?? 0;
    scrollRef.current?.scrollTo({ y: Math.max(y - spacing.md, 0), animated: true });
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom", "left", "right"]}>
      <View style={[styles.topBar, { paddingTop: insets.top + TOP_BAR_GAP }]}>
        <View style={[styles.topBarInner, { maxWidth: contentMaxWidth }, rtl && styles.rowReverse]}>
          <View style={[styles.brandRow, rtl && styles.rowReverse]}>
            <MosqueMark size={26} />
            <Text style={[styles.brandText, rtl ? { marginRight: spacing.xs } : { marginLeft: spacing.xs }]}>
              Rafiqq
            </Text>
          </View>
          <Pressable
            onPress={() => setMenuOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Open menu"
            hitSlop={8}
            style={styles.menuButton}
          >
            <Text style={styles.menuIcon}>☰</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView ref={scrollRef} style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View onLayout={recordOffset("Voice")}>
          <VoiceScreen language={language} />
        </View>
        <View onLayout={recordOffset("Navigation")}>
          <NavigationScreen language={language} />
        </View>
        <View onLayout={recordOffset("Guide")}>
          <GuideScreen language={language} />
        </View>
        <View onLayout={recordOffset("Health")}>
          <HealthScreen language={language} />
        </View>
        <View onLayout={recordOffset("Account")}>
          <AccountScreen language={language} />
        </View>
      </ScrollView>

      <FloatingMicButton onPress={() => scrollToSection("Voice")} rtl={rtl} />

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)}>
          <Pressable
            style={[styles.menuPanel, { marginTop: insets.top + TOP_BAR_GAP + TOP_BAR_CONTENT_HEIGHT, maxWidth: contentMaxWidth }]}
            onPress={(e) => e.stopPropagation()}
          >
            {SECTIONS.map((name) => (
              <Pressable
                key={name}
                onPress={() => scrollToSection(name)}
                accessibilityRole="button"
                style={[styles.menuItem, rtl && styles.rowReverse]}
              >
                <View style={[styles.menuIconWrap, rtl ? styles.menuIconWrapRTL : styles.menuIconWrapLTR]}>
                  <Text style={styles.menuItemIcon}>{SECTION_ICONS[name]}</Text>
                </View>
                <Text style={[styles.menuItemLabel, rtl && styles.textRTL]}>{t[SECTION_LABEL_KEY[name]]}</Text>
              </Pressable>
            ))}

            <View style={styles.menuDivider} />

            <View style={[styles.langSwitcher, rtl && styles.rowReverse]}>
              <Pressable
                hitSlop={8}
                style={[styles.langPill, language === "en" && styles.langPillActive]}
                onPress={() => setLanguage("en")}
              >
                <Text style={[styles.langText, language === "en" && styles.langActive]}>EN</Text>
              </Pressable>
              <Pressable
                hitSlop={8}
                style={[styles.langPill, language === "ar" && styles.langPillActive]}
                onPress={() => setLanguage("ar")}
              >
                <Text style={[styles.langText, language === "ar" && styles.langActive]}>AR</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  rowReverse: { flexDirection: "row-reverse" },
  textRTL: { textAlign: "right", writingDirection: "rtl" },
  content: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  topBar: {
    backgroundColor: colors.card,
    zIndex: 2,
    ...shadow,
  },
  topBarInner: {
    height: TOP_BAR_CONTENT_HEIGHT,
    width: "100%",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
  },
  brandRow: { flexDirection: "row", alignItems: "center" },
  brandText: { fontSize: 20, fontFamily: fonts.heading, fontWeight: "700", color: colors.textDark },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  menuIcon: { fontSize: 22, color: colors.primary, fontWeight: "700" },
  backdrop: { flex: 1, backgroundColor: "rgba(31, 45, 40, 0.35)" },
  menuPanel: {
    alignSelf: "center",
    width: "94%",
    backgroundColor: colors.card,
    borderRadius: radii.card,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    ...shadow,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.card,
  },
  menuIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  menuIconWrapLTR: { marginRight: spacing.sm },
  menuIconWrapRTL: { marginLeft: spacing.sm },
  menuItemIcon: { fontSize: 20 },
  menuItemLabel: { fontSize: 17, fontFamily: fonts.body, fontWeight: "600", color: colors.textDark },
  menuDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  langSwitcher: { flexDirection: "row", justifyContent: "center", paddingVertical: spacing.xs },
  langPill: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    marginHorizontal: spacing.xs,
  },
  langPillActive: { backgroundColor: colors.primaryLight },
  langText: { fontSize: 15, color: colors.textMuted, fontFamily: fonts.body, fontWeight: "600" },
  langActive: { color: colors.primaryDark, fontWeight: "700" },
});
