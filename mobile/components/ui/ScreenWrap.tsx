import React from "react";
import { StyleSheet } from "react-native";
import Animated, {
  FadeInDown,
  FadeOutUp,
  Easing,
} from "react-native-reanimated";
import { palette } from "../../constants/colors";

interface ScreenWrapProps {
  children: React.ReactNode;
}

export function ScreenWrap({ children }: ScreenWrapProps) {
  return (
    <Animated.View
      entering={FadeInDown.duration(350).easing(Easing.out(Easing.cubic))}
      exiting={FadeOutUp.duration(200)}
      style={styles.container}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.void,
  },
});
