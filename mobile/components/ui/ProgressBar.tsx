import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { palette } from "../../constants/colors";

interface ProgressBarProps {
  value: number;
  delay?: number;
  color?: string;
  height?: number;
}

export function ProgressBar({
  value,
  delay = 0,
  color = palette.iris,
  height = 4,
}: ProgressBarProps) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withDelay(
      delay,
      withTiming(value * 100, {
        duration: 800,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [value, delay, width]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <View style={[styles.track, { height }]}>
      <Animated.View style={[styles.fill, { backgroundColor: color, height }, animatedStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.04)",
    overflow: "hidden",
  },
  fill: {
    borderRadius: 2,
  },
});
