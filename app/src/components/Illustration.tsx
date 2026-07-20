import React from "react";
import { View, StyleSheet } from "react-native";
import { colors } from "../theme";

type Props = { size?: number };

/** Small dome + minaret brand mark, built from plain Views (no image asset, no
 * SVG library) — used next to the app name in the top bar. */
export function MosqueMark({ size = 28 }: Props) {
  const s = size;
  return (
    <View style={{ width: s, height: s, alignItems: "center", justifyContent: "flex-end" }}>
      <View
        style={{
          width: s * 0.5,
          height: s * 0.25,
          borderTopLeftRadius: s * 0.25,
          borderTopRightRadius: s * 0.25,
          backgroundColor: colors.primary,
        }}
      />
      <View
        style={{
          width: s * 0.1,
          height: s * 0.08,
          backgroundColor: colors.gold,
          borderRadius: s * 0.05,
          position: "absolute",
          top: 0,
        }}
      />
      <View
        style={{
          width: s * 0.85,
          height: s * 0.35,
          backgroundColor: colors.primary,
          borderRadius: 3,
        }}
      />
    </View>
  );
}

/** Abstract Kaaba emblem — a dark cube with a gold band, the conventional
 * respectful stylization (no figurative/photographic imagery). Used as a
 * decorative accent on the Voice hero and the Guide site list. */
export function KaabaEmblem({ size = 40 }: Props) {
  const s = size;
  return (
    <View style={[styles.kaaba, { width: s, height: s, borderRadius: s * 0.12 }]}>
      <View style={[styles.kaabaBand, { top: s * 0.32, height: s * 0.16 }]} />
      <View style={[styles.kaabaDoor, { width: s * 0.1, height: s * 0.28, bottom: 0 }]} />
    </View>
  );
}

/** Simple triangular peak motif for mountain sites (e.g. Jabal al-Nour). */
export function MountainMark({ size = 40 }: Props) {
  const s = size;
  return (
    <View style={{ width: s, height: s, alignItems: "center", justifyContent: "flex-end", overflow: "hidden" }}>
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: s * 0.5,
          borderRightWidth: s * 0.5,
          borderBottomWidth: s * 0.62,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderBottomColor: colors.primary,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: s * 0.06,
          width: s * 0.22,
          height: s * 0.22,
          borderRadius: s * 0.11,
          backgroundColor: colors.gold,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  kaaba: {
    backgroundColor: "#1C1C1C",
    overflow: "hidden",
  },
  kaabaBand: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "#C9A227",
  },
  kaabaDoor: {
    position: "absolute",
    alignSelf: "center",
    backgroundColor: "#C9A227",
  },
});
