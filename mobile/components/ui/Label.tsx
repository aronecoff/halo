import React from "react";
import { Text, StyleSheet, TextStyle, StyleProp } from "react-native";
import { palette } from "../../constants/colors";

interface LabelProps {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}

export function Label({ children, style }: LabelProps) {
  return <Text style={[styles.label, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  label: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: palette.textMuted,
  },
});
