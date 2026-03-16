import React from "react";
import { Text, StyleSheet } from "react-native";
import { palette } from "../../constants/colors";

interface HaloMarkProps {
  size?: number;
}

export function HaloMark({ size = 52 }: HaloMarkProps) {
  let GradientText: React.ReactNode = null;

  try {
    // Attempt to use MaskedView for gradient text
    const MaskedView =
      require("@react-native-masked-view/masked-view").default;
    const { LinearGradient } = require("expo-linear-gradient");

    GradientText = (
      <MaskedView
        maskElement={
          <Text style={[styles.text, { fontSize: size }]}>HALO</Text>
        }
      >
        <LinearGradient
          colors={[palette.orchid, palette.iris, palette.crown]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={[styles.text, { fontSize: size, opacity: 0 }]}>
            HALO
          </Text>
        </LinearGradient>
      </MaskedView>
    );
  } catch {
    // Fallback: solid orchid color
    GradientText = null;
  }

  if (GradientText) {
    return <>{GradientText}</>;
  }

  return (
    <Text style={[styles.text, styles.fallback, { fontSize: size }]}>
      HALO
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontWeight: "800",
    letterSpacing: 6,
    textAlign: "center",
  },
  fallback: {
    color: palette.orchid,
  },
});
