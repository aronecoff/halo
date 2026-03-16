import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { palette } from "../../constants/colors";

interface IrisOrbProps {
  size?: number;
  pulse?: boolean;
}

export function IrisOrb({ size = 40, pulse = true }: IrisOrbProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (pulse) {
      scale.value = withRepeat(
        withTiming(1.08, {
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
    } else {
      scale.value = 1;
    }
  }, [pulse, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.orb,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  orb: {
    backgroundColor: palette.iris,
    shadowColor: palette.crown,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
});
