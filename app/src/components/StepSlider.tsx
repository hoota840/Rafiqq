import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { colors } from "../theme";

type Props = { value: number; max: number; onChange: (value: number) => void };

/**
 * Tap-to-set slider approximation (1..max), used instead of @react-native-community/slider
 * to avoid pulling in a native module we can't verify installs/builds here. Behaves like a
 * segmented track: tapping a segment sets the value, filled portion shows progress.
 */
export default function StepSlider({ value, max, onChange }: Props) {
  const segments = Array.from({ length: max }, (_, i) => i + 1);
  return (
    <View style={styles.track}>
      {segments.map((segment) => (
        <Pressable
          key={segment}
          style={[styles.segment, segment <= value ? styles.segmentFilled : styles.segmentEmpty]}
          onPress={() => onChange(segment)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: "row", height: 8, borderRadius: 4, overflow: "hidden" },
  segment: { flex: 1, marginRight: 2 },
  segmentFilled: { backgroundColor: colors.primary },
  segmentEmpty: { backgroundColor: colors.border },
});
