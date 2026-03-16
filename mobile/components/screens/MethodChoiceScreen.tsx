import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, {
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { ScreenWrap } from "../ui/ScreenWrap";
import { IrisOrb } from "../ui/IrisOrb";
import { palette } from "../../constants/colors";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface MethodChoiceScreenProps {
  userName: string;
  onChat: () => void;
  onScan: () => void;
}

function ChoiceButton({
  title,
  description,
  onPress,
  variant,
  delay,
}: {
  title: string;
  description: string;
  onPress: () => void;
  variant: "chat" | "scan";
  delay: number;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isScan = variant === "scan";
  const accentColor = isScan ? "#06B6D4" : palette.orchid;
  const bgColor = isScan
    ? "rgba(6,182,212,0.06)"
    : "rgba(139,92,246,0.06)";
  const borderColorVal = isScan
    ? "rgba(6,182,212,0.15)"
    : "rgba(139,92,246,0.15)";

  return (
    <Animated.View entering={FadeInUp.delay(delay).duration(500)}>
      <AnimatedPressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        }}
        style={[
          animatedStyle,
          styles.choiceButton,
          { backgroundColor: bgColor, borderColor: borderColorVal },
        ]}
      >
        <Text style={[styles.choiceTitle, { color: accentColor }]}>
          {title}
        </Text>
        <Text style={styles.choiceDesc}>{description}</Text>
      </AnimatedPressable>
    </Animated.View>
  );
}

export function MethodChoiceScreen({
  userName,
  onChat,
  onScan,
}: MethodChoiceScreenProps) {
  const firstName = userName.trim().split(" ")[0];

  return (
    <ScreenWrap>
      <View style={styles.container}>
        <IrisOrb size={36} />

        <Animated.View entering={FadeInUp.delay(100).duration(500)}>
          <Text style={styles.question}>
            {firstName}, how should I learn about you?
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(500)}>
          <Text style={styles.subtext}>
            Both paths build the same profile. Choose what feels right.
          </Text>
        </Animated.View>

        <View style={styles.buttonsColumn}>
          <ChoiceButton
            title="Talk to me"
            description="I will ask you three questions. Takes about two minutes."
            onPress={onChat}
            variant="chat"
            delay={300}
          />
          <ChoiceButton
            title="Scan my device"
            description="I will analyze your messages, social patterns, and more. Instant."
            onPress={onScan}
            variant="scan"
            delay={400}
          />
        </View>

        <Animated.View entering={FadeInUp.delay(500).duration(500)}>
          <Text style={styles.privacy}>
            All data stays on your device. Nothing is stored or shared.
          </Text>
        </Animated.View>
      </View>
    </ScreenWrap>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  question: {
    fontSize: 16,
    fontWeight: "600",
    color: palette.textPrimary,
    textAlign: "center",
    marginTop: 20,
    lineHeight: 24,
  },
  subtext: {
    fontSize: 12,
    color: palette.textGhost,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 18,
  },
  buttonsColumn: {
    width: "100%",
    marginTop: 28,
    gap: 12,
  },
  choiceButton: {
    width: "100%",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderRadius: 16,
  },
  choiceTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  choiceDesc: {
    fontSize: 11,
    color: palette.textGhost,
    lineHeight: 15,
  },
  privacy: {
    fontSize: 9,
    color: palette.textGhost,
    textAlign: "center",
    marginTop: 20,
    lineHeight: 14,
    maxWidth: 260,
  },
});
