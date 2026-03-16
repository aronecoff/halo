import React, { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from "react-native";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
} from "react-native-reanimated";
import Svg, { Circle, Path } from "react-native-svg";
import { ScreenWrap, PrimaryButton } from "../ui";
import { palette } from "../../constants/colors";

interface MeetingScreenProps {
  onNext: () => void;
  matchData: any;
}

export function MeetingScreen({ onNext, matchData }: MeetingScreenProps) {
  // Opacity-based blur animation (RN blur is expensive)
  const avatarOpacity = useSharedValue(0);

  useEffect(() => {
    avatarOpacity.value = withDelay(
      500,
      withTiming(1, { duration: 2000, easing: Easing.out(Easing.cubic) })
    );
  }, [avatarOpacity]);

  const avatarAnimStyle = useAnimatedStyle(() => ({
    opacity: avatarOpacity.value,
  }));

  return (
    <ScreenWrap>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* GPS off status bar */}
        <Animated.View
          entering={FadeInDown.delay(0).duration(400)}
          style={styles.gpsBar}
        >
          <Svg width={14} height={14} viewBox="0 0 16 16" fill="none">
            <Circle
              cx={8}
              cy={8}
              r={7}
              fill="none"
              stroke={palette.success}
              strokeWidth={1.2}
            />
            <Path
              d="M5 8l2 2 4-4"
              stroke={palette.success}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          <View>
            <Text style={styles.gpsTitle}>GPS IS OFF</Text>
            <Text style={styles.gpsSub}>
              Location sharing permanently disabled
            </Text>
          </View>
        </Animated.View>

        <Text style={styles.agentNote}>Your agent has stepped back.</Text>

        {/* Match avatar with opacity animation */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          style={styles.avatarSection}
        >
          <Animated.View style={[styles.avatar, avatarAnimStyle]}>
            <Text style={styles.avatarLetter}>
              {matchData.matchName?.[0] || "?"}
            </Text>
          </Animated.View>
          <Text style={styles.matchName}>{matchData.matchName}</Text>
          <Text style={styles.contextLine}>
            {matchData.matchPhoto?.contextLine || ""}
          </Text>

          <View style={styles.traitsWrap}>
            {(matchData.sharedTraits || []).slice(0, 4).map((t: string) => (
              <View key={t} style={styles.traitBadge}>
                <Text style={styles.traitText}>{t}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <View style={styles.spacer} />

        {/* Help tap */}
        <Pressable style={styles.helpBtn}>
          <Text style={styles.helpText}>Tap here if you need help</Text>
        </Pressable>

        {/* Meeting over */}
        <PrimaryButton onPress={onNext}>MEETING OVER</PrimaryButton>
      </ScrollView>
    </ScreenWrap>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  gpsBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "rgba(34,197,94,0.06)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.1)",
    borderRadius: 12,
    marginBottom: 12,
  },
  gpsTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: palette.success,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  gpsSub: {
    fontSize: 10,
    color: palette.textMuted,
  },
  agentNote: {
    fontSize: 12,
    color: palette.textGhost,
    textAlign: "center",
    marginBottom: 24,
  },
  avatarSection: {
    alignItems: "center",
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: "rgba(236,72,153,0.4)",
    backgroundColor: "rgba(236,72,153,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  avatarLetter: {
    fontSize: 44,
    color: "#F9A8D4",
  },
  matchName: {
    fontSize: 24,
    fontWeight: "800",
    color: palette.textPrimary,
  },
  contextLine: {
    fontSize: 12,
    color: palette.textMuted,
    marginTop: 4,
  },
  traitsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "center",
    marginTop: 16,
  },
  traitBadge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "rgba(236,72,153,0.08)",
    borderWidth: 1,
    borderColor: "rgba(236,72,153,0.15)",
  },
  traitText: {
    fontSize: 9,
    fontWeight: "600",
    color: "#F9A8D4",
  },
  spacer: {
    height: 40,
  },
  helpBtn: {
    padding: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  helpText: {
    fontSize: 11,
    color: palette.textGhost,
  },
});
