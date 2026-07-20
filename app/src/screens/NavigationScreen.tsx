import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Animated } from "react-native";
import * as Speech from "expo-speech";
import { strings, Language } from "../i18n/strings";
import { isRTL } from "../i18n/rtl";
import { useResponsive } from "../hooks/useResponsive";
import { colors, radii, spacing, fonts, shadow } from "../theme";
import SectionHeader from "../components/SectionHeader";
import LeafletMapView, { GeoSite } from "../components/LeafletMapView";
import { fetchNearbySites, fetchSiteGuide } from "../api/client";
import { MosqueMark, MountainMark } from "../components/Illustration";

// Which illustration to animate in with the story card — only "thawr" among
// the navigable hub sites is a mountain (Jabal al-Nour is Guide-only, not a
// map hub pin), everything else gets the mosque mark.
function siteIconFor(id: string) {
  return id === "thawr" ? MountainMark : MosqueMark;
}

type Props = {
  language: Language;
  // Controlled from App.tsx so a voice command ("navigate to Mina") can
  // select a site here too, not just a tap on the map.
  selectedId: string | null;
  onSelectSite: (id: string) => void;
};

// Default view: Haram-Mina-Arafat corridor; pinch or scroll out to see more
// of Saudi Arabia since this is a live, interactive map. Selecting a site
// (tap or voice command) re-centers the map on it instead — needed since
// Madinah's sites (Masjid an-Nabawi, Quba) are ~340km from this corridor and
// wouldn't be visible without that.
const CENTER_LAT = 21.39;
const CENTER_LNG = 39.9;
const ZOOM = 11;
const SELECTED_ZOOM = 13;
const MAP_HEIGHT = 340;
const SPEECH_LANGUAGE: Record<Language, string> = { en: "en-US", ar: "ar-SA" };

export default function NavigationScreen({ language, selectedId, onSelectSite }: Props) {
  const t = strings[language];
  const rtl = isRTL(language);
  const { contentMaxWidth } = useResponsive();
  // Real hospitals/police/Tawafa offices/guidance centres from OpenStreetMap
  // (see backend/src/services/overpassClient.ts). Fails soft — an empty
  // array on error just means no extra pins, the 3 hub sites still work.
  const [nearbySites, setNearbySites] = useState<GeoSite[]>([]);
  // Bilingual summary shown when a site is selected — reuses the same guide
  // content the Guide screen shows, fetched fresh per selection. Fails soft
  // to null (card just doesn't show) for pins with no guide entry, e.g.
  // Overpass-sourced hospitals/police stations aren't in STUB_SITES.
  const [story, setStory] = useState<{ en: string; ar: string } | null>(null);
  const [storyLoading, setStoryLoading] = useState(false);
  // Drives the story card's entrance animation (fade + slide + scale) — pure
  // React Native Animated API, no new dependency, no external service.
  const cardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchNearbySites()
      .then((sites) =>
        setNearbySites(sites.map((s) => ({ id: s.id, label: s.name, lat: s.lat, lng: s.lng, category: s.category })))
      )
      .catch(() => setNearbySites([]));
  }, []);

  useEffect(() => {
    Speech.stop();
    if (!selectedId) {
      setStory(null);
      return;
    }
    setStoryLoading(true);
    setStory(null);
    fetchSiteGuide(selectedId)
      .then((data) => setStory(data.error ? null : { en: data.en, ar: data.ar }))
      .catch(() => setStory(null))
      .finally(() => setStoryLoading(false));
  }, [selectedId]);

  useEffect(() => {
    if (story) {
      cardAnim.setValue(0);
      Animated.spring(cardAnim, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }).start();
    }
  }, [story]);

  function speakStory() {
    if (!story) return;
    Speech.speak(story[language], { language: SPEECH_LANGUAGE[language] });
  }

  // Real coordinates (approximate — general-knowledge landmarks, not
  // surveyed; live Overpass verification of these specific ones was
  // attempted but both public Overpass instances were overloaded at the
  // time, see CLAUDE.md). Covers the classic Hajj/Umrah waypoints, not just
  // the Makkah corridor.
  const hubSites: GeoSite[] = [
    { id: "haram", label: t.navigationSiteHaram, lat: 21.4225, lng: 39.8262 },
    { id: "mina", label: t.navigationSiteMina, lat: 21.4133, lng: 39.8933 },
    { id: "arafat", label: t.navigationSiteArafat, lat: 21.3549, lng: 39.984 },
    { id: "muzdalifah", label: t.navigationSiteMuzdalifah, lat: 21.3833, lng: 39.95 },
    { id: "nabawi", label: t.navigationSiteNabawi, lat: 24.4672, lng: 39.6111 },
    { id: "quba", label: t.navigationSiteQuba, lat: 24.4396, lng: 39.6169 },
    { id: "thawr", label: t.navigationSiteThawr, lat: 21.3742, lng: 39.8395 },
  ];
  const sites = [...hubSites, ...nearbySites];
  const selected = sites.find((s) => s.id === selectedId) ?? null;
  const mapCenterLat = selected?.lat ?? CENTER_LAT;
  const mapCenterLng = selected?.lng ?? CENTER_LNG;
  const mapZoom = selected ? SELECTED_ZOOM : ZOOM;

  return (
    <View style={styles.container}>
      <View style={[styles.headerBlock, { maxWidth: contentMaxWidth, alignSelf: "center", width: "100%" }]}>
        <SectionHeader icon="🧭" title={t.navigationTitle} rtl={rtl} />
        <View style={[styles.banner, rtl && styles.rowReverse]}>
          <Text style={[styles.bannerIcon, rtl ? styles.iconSpacingRTL : styles.iconSpacingLTR]}>⚠️</Text>
          <Text style={[styles.bannerText, rtl && styles.textRTL]}>{t.navigationPlaceholder}</Text>
        </View>
      </View>
      <View style={[styles.mapWrap, { maxWidth: contentMaxWidth, alignSelf: "center", width: "100%" }]}>
        <LeafletMapView
          sites={sites}
          centerLat={mapCenterLat}
          centerLng={mapCenterLng}
          zoom={mapZoom}
          onSelectSite={onSelectSite}
        />
        <View style={styles.infoBar}>
          <Text style={styles.infoText}>{selected ? selected.label : t.navigationHint}</Text>
        </View>
      </View>
      {selected && (storyLoading || story) ? (
        <View style={[styles.storyCard, { maxWidth: contentMaxWidth, alignSelf: "center", width: "100%" }]}>
          {storyLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : story ? (
            <Animated.View
              style={{
                opacity: cardAnim,
                transform: [
                  { translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
                  { scale: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
                ],
              }}
            >
              <View style={[styles.storyHeaderRow, rtl && styles.rowReverse]}>
                <View style={[styles.storyIconWrap, rtl ? { marginLeft: spacing.sm } : { marginRight: spacing.sm }]}>
                  {React.createElement(siteIconFor(selected.id), { size: 30 })}
                </View>
                <Text style={[styles.storyTitle, styles.storyTitleFlex]}>{selected.label}</Text>
                <Pressable onPress={speakStory} hitSlop={8} style={styles.listenButton}>
                  <Text style={styles.listenButtonText}>🔊 {t.listenButton}</Text>
                </Pressable>
              </View>
              <Text style={[styles.storyText, styles.textRTL]}>{story.ar}</Text>
              <View style={styles.storyDivider} />
              <Text style={styles.storyText}>{story.en}</Text>
            </Animated.View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  rowReverse: { flexDirection: "row-reverse" },
  textRTL: { textAlign: "right", writingDirection: "rtl" },
  iconSpacingLTR: { marginRight: spacing.sm },
  iconSpacingRTL: { marginLeft: spacing.sm },
  headerBlock: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },
  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFF3CD",
    padding: spacing.md,
    borderRadius: radii.card,
    marginBottom: spacing.md,
  },
  bannerIcon: { fontSize: 18 },
  bannerText: { flex: 1, color: "#856404", fontSize: 15, lineHeight: 21, fontFamily: fonts.body },
  mapWrap: { height: MAP_HEIGHT, marginHorizontal: spacing.md, borderRadius: radii.card, overflow: "hidden", marginBottom: spacing.md },
  infoBar: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    ...shadow,
  },
  infoText: { fontSize: 15, fontWeight: "700", color: colors.textDark, fontFamily: fonts.body },
  storyCard: {
    backgroundColor: colors.card,
    borderRadius: radii.card,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    ...shadow,
  },
  storyHeaderRow: { flexDirection: "row", alignItems: "center", marginBottom: spacing.sm },
  storyIconWrap: { alignItems: "center", justifyContent: "center" },
  storyTitle: { fontSize: 16, fontWeight: "700", fontFamily: fonts.heading, color: colors.textDark },
  storyTitleFlex: { flex: 1 },
  listenButton: {
    backgroundColor: colors.primaryLight,
    borderRadius: radii.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  listenButtonText: { fontSize: 13, fontWeight: "600", color: colors.primaryDark },
  storyText: { fontSize: 14, lineHeight: 20, color: colors.textDark, fontFamily: fonts.body },
  storyDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
});
