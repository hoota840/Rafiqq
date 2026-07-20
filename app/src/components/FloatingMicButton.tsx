import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { colors, shadow } from "../theme";

type Props = { onPress: () => void; rtl?: boolean };

/** Persistent floating mic button, available on every tab except Voice itself — mirrors the
 * always-on voice trigger in the reference design. Sits on the reading-order "end" side, so
 * it mirrors to the left for Arabic instead of staying pinned to the physical right edge. */
export default function FloatingMicButton({ onPress, rtl }: Props) {
  return (
    <Pressable style={[styles.button, rtl ? styles.positionRTL : styles.positionLTR]} onPress={onPress}>
      <Text style={styles.icon}>🎙️</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadow,
  },
  positionLTR: { right: 20 },
  positionRTL: { left: 20 },
  icon: { fontSize: 24 },
});
