import React from "react";
import { View, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { palette } from "../../constants/colors";

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(24, 24, 31, 0.65)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.12)",
    padding: 16,
    overflow: "hidden",
  },
});
