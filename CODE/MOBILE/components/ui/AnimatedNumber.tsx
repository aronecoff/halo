import React, { useEffect } from "react";
import { TextStyle, StyleProp } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { TextInput, StyleSheet } from "react-native";
import { palette } from "../../constants/colors";

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  style?: StyleProp<TextStyle>;
}

export function AnimatedNumber({
  value,
  duration = 1200,
  style,
}: AnimatedNumberProps) {
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withTiming(value, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [value, duration, animatedValue]);

  const animatedProps = useAnimatedProps(() => {
    const current = Math.round(animatedValue.value);
    return {
      text: `${current}`,
      defaultValue: `${current}`,
    };
  });

  return (
    <AnimatedTextInput
      underlineColorAndroid="transparent"
      editable={false}
      animatedProps={animatedProps}
      style={[styles.text, style]}
    />
  );
}

const styles = StyleSheet.create({
  text: {
    color: palette.textPrimary,
    fontSize: 32,
    fontWeight: "700",
    padding: 0,
  },
});
