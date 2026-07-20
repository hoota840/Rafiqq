import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors, radii, spacing, fonts, shadow } from "../theme";

export type MapSite = { id: string; label: string; xPct: number; yPct: number };

type Props = {
  sites: MapSite[];
  selectedId: string | null;
  onSelectSite: (id: string) => void;
};

/**
 * Zero-dependency stand-in for a real map: fixed pins on a tinted backdrop,
 * positioned by rough relative percentage (not GPS-accurate). Avoids
 * react-native-maps entirely, since that requires a Google Cloud billing
 * account on Android — not worth it for a placeholder with no real geodata
 * yet anyway (see /data/maps and CLAUDE.md open questions).
 */
export default function SchematicSiteMap({ sites, selectedId, onSelectSite }: Props) {
  return (
    <View style={styles.area}>
      {sites.map((site) => {
        const active = site.id === selectedId;
        return (
          <Pressable
            key={site.id}
            onPress={() => onSelectSite(site.id)}
            style={[styles.pinWrap, { left: `${site.xPct}%`, top: `${site.yPct}%` }]}
            hitSlop={10}
          >
            <View style={[styles.pin, active && styles.pinActive]}>
              <Text style={styles.pinIcon}>📍</Text>
            </View>
            <Text style={[styles.pinLabel, active && styles.pinLabelActive]} numberOfLines={1}>
              {site.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  area: {
    flex: 1,
    backgroundColor: "#EFE7D6",
    borderRadius: radii.card,
    overflow: "hidden",
  },
  pinWrap: {
    position: "absolute",
    alignItems: "center",
    width: 90,
    marginLeft: -45,
    marginTop: -18,
  },
  pin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    ...shadow,
  },
  pinActive: { backgroundColor: colors.primary },
  pinIcon: { fontSize: 16 },
  pinLabel: {
    marginTop: spacing.xs,
    fontSize: 11,
    fontFamily: fonts.body,
    fontWeight: "700",
    color: colors.textDark,
    textAlign: "center",
  },
  pinLabelActive: { color: colors.primaryDark },
});
