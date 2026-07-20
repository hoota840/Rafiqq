import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { strings, Language } from "../i18n/strings";
import { isRTL } from "../i18n/rtl";
import { useResponsive } from "../hooks/useResponsive";
import { colors, radii, spacing, fonts, shadow } from "../theme";
import SectionHeader from "../components/SectionHeader";
import LeafletMapView, { GeoSite } from "../components/LeafletMapView";
import { fetchNearbySites } from "../api/client";

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

export default function NavigationScreen({ language, selectedId, onSelectSite }: Props) {
  const t = strings[language];
  const rtl = isRTL(language);
  const { contentMaxWidth } = useResponsive();
  // Real hospitals/police/Tawafa offices/guidance centres from OpenStreetMap
  // (see backend/src/services/overpassClient.ts). Fails soft — an empty
  // array on error just means no extra pins, the 3 hub sites still work.
  const [nearbySites, setNearbySites] = useState<GeoSite[]>([]);

  useEffect(() => {
    fetchNearbySites()
      .then((sites) =>
        setNearbySites(sites.map((s) => ({ id: s.id, label: s.name, lat: s.lat, lng: s.lng, category: s.category })))
      )
      .catch(() => setNearbySites([]));
  }, []);

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
