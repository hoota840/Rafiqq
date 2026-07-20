import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { strings, Language } from "../i18n/strings";
import { isRTL } from "../i18n/rtl";
import { useResponsive } from "../hooks/useResponsive";
import { colors, radii, spacing, fonts, shadow } from "../theme";
import SectionHeader from "../components/SectionHeader";
import LeafletMapView, { GeoSite } from "../components/LeafletMapView";

type Props = { language: Language };

// Real coordinates (approximate) for the three example sites. Centered/zoomed
// to show the Haram-Mina-Arafat corridor; pinch or scroll out to see more of
// Saudi Arabia since this is a live, interactive map.
const CENTER_LAT = 21.39;
const CENTER_LNG = 39.9;
const ZOOM = 11;
const MAP_HEIGHT = 340;

export default function NavigationScreen({ language }: Props) {
  const t = strings[language];
  const rtl = isRTL(language);
  const { contentMaxWidth } = useResponsive();
  const [selectedId, setSelectedId] = useState<string | null>("haram");

  const sites: GeoSite[] = [
    { id: "haram", label: t.navigationSiteHaram, lat: 21.4225, lng: 39.8262 },
    { id: "mina", label: t.navigationSiteMina, lat: 21.4133, lng: 39.8933 },
    { id: "arafat", label: t.navigationSiteArafat, lat: 21.3549, lng: 39.984 },
  ];
  const selected = sites.find((s) => s.id === selectedId) ?? null;

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
          centerLat={CENTER_LAT}
          centerLng={CENTER_LNG}
          zoom={ZOOM}
          onSelectSite={setSelectedId}
        />
        <View style={styles.infoBar}>
          <Text style={styles.infoText}>{selected ? selected.label : t.navigationHint}</Text>
        </View>
      </View>
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
});
