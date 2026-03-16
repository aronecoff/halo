import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  NativeSyntheticEvent,
  TextInputSubmitEditingEventData,
} from "react-native";
import Animated, {
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { ScreenWrap } from "../ui/ScreenWrap";
import { IrisOrb } from "../ui/IrisOrb";
import { HaloMark, AnimatedNumber, PrimaryButton } from "../ui";
import { palette } from "../../constants/colors";

interface WelcomeScreenProps {
  userName: string;
  onNameChange: (name: string) => void;
  onNext: () => void;
}

export function WelcomeScreen({
  userName,
  onNameChange,
  onNext,
}: WelcomeScreenProps) {
  const inputRef = useRef<TextInput>(null);
  const canProceed = userName.trim().length > 0;
  const [focused, setFocused] = useState(false);

  const borderColor = focused
    ? "rgba(139,92,246,0.5)"
    : "rgba(139,92,246,0.2)";

  const stats = [
    { num: "2,847", label: "ACTIVE AGENTS" },
    { num: "SF", label: "LAUNCH CITY" },
    { num: "94%", label: "SHOW UP RATE" },
  ];

  return (
    <ScreenWrap>
      <View style={styles.container}>
        {/* Iris Orb */}
        <Animated.View
          entering={FadeInUp.delay(0).duration(500)}
          style={styles.orbWrap}
        >
          <IrisOrb size={40} />
        </Animated.View>

        {/* HALO Mark */}
        <Animated.View entering={FadeInUp.delay(100).duration(500)}>
          <HaloMark size={52} />
        </Animated.View>

        {/* Subtitle */}
        <Animated.View entering={FadeInUp.delay(200).duration(500)}>
          <Text style={styles.subtitle}>AGENT MEDIATED HUMAN CONNECTION</Text>
        </Animated.View>

        {/* Description */}
        <Animated.View entering={FadeInUp.delay(300).duration(500)}>
          <Text style={styles.description}>
            Your autonomous AI agent learns who you are, finds compatible people
            nearby, and facilitates a meeting in the real world. No swiping. No
            profiles. No browsing. You just show up.
          </Text>
        </Animated.View>

        {/* Name Input */}
        <Animated.View
          entering={FadeInUp.delay(400).duration(500)}
          style={styles.inputWrap}
        >
          <TextInput
            ref={inputRef}
            value={userName}
            onChangeText={onNameChange}
            onSubmitEditing={() => {
              if (canProceed) onNext();
            }}
            placeholder="Your first name"
            placeholderTextColor={palette.textGhost}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="go"
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={[styles.input, { borderColor }]}
          />
        </Animated.View>

        {/* Activate Button */}
        <Animated.View
          entering={FadeInUp.delay(500).duration(500)}
          style={styles.buttonWrap}
        >
          <PrimaryButton
            onPress={canProceed ? onNext : undefined}
            style={{ opacity: canProceed ? 1 : 0.4 }}
          >
            ACTIVATE YOUR AGENT
          </PrimaryButton>
        </Animated.View>

        {/* Stats Row */}
        <Animated.View
          entering={FadeInUp.delay(600).duration(500)}
          style={styles.statsRow}
        >
          {stats.map((s) => (
            <View key={s.label} style={styles.statItem}>
              <Text style={styles.statNum}>
                {s.num === "SF" || s.num === "94%" ? (
                  s.num
                ) : (
                  <AnimatedNumber value={s.num} />
                )}
              </Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
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
    paddingHorizontal: 32,
  },
  orbWrap: {
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 2.5,
    textTransform: "uppercase",
    color: palette.textGhost,
    marginTop: 10,
  },
  description: {
    fontSize: 15,
    fontWeight: "300",
    color: palette.textSecondary,
    maxWidth: 320,
    lineHeight: 25,
    textAlign: "center",
    marginTop: 24,
  },
  inputWrap: {
    width: "100%",
    marginTop: 28,
  },
  input: {
    width: "100%",
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: "rgba(139,92,246,0.04)",
    color: palette.textPrimary,
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  buttonWrap: {
    width: "100%",
    marginTop: 12,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 28,
    marginTop: 24,
    width: "100%",
  },
  statItem: {
    alignItems: "center",
  },
  statNum: {
    fontSize: 20,
    fontWeight: "800",
    color: palette.orchid,
  },
  statLabel: {
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: palette.textGhost,
    marginTop: 4,
  },
});
