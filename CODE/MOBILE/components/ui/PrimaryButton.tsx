import React from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { palette } from "../../constants/colors";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PrimaryButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  color?: "purple" | "green";
  style?: StyleProp<ViewStyle>;
}

const gradients: Record<"purple" | "green", [string, string]> = {
  purple: [palette.iris, palette.crown],
  green: [palette.success, "#22C55E"],
};

export function PrimaryButton({
  children,
  onPress,
  color = "purple",
  style,
}: PrimaryButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.wrapper, animatedStyle, style]}
    >
      <LinearGradient
        colors={gradients[color]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        {typeof children === "string" ? (
          <Text style={styles.text}>{children}</Text>
        ) : (
          children
        )}
      </LinearGradient>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
  },
  gradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: palette.white,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
