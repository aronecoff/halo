import React from "react";
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
  withSpring,
} from "react-native-reanimated";
import Svg, { Circle, Path } from "react-native-svg";
import { ScreenWrap, IrisOrb } from "../ui";
import { palette } from "../../constants/colors";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface MatchFoundScreenProps {
  onAccept: () => void;
  onDecline: () => void;
  matchData: any;
}

export function MatchFoundScreen({
  onAccept,
  onDecline,
  matchData,
}: MatchFoundScreenProps) {
  const acceptScale = useSharedValue(1);
  const declineScale = useSharedValue(1);

  const acceptAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: acceptScale.value }],
  }));
  const declineAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: declineScale.value }],
  }));

  return (
    <ScreenWrap>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* IRIS description bubble */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={styles.irisBubbleRow}
        >
          <IrisOrb size={28} pulse={false} />
          <View style={styles.irisBubble}>
            <Text style={styles.irisBubbleText}>
              {matchData.irisDescription}
            </Text>
          </View>
        </Animated.View>

        {/* Match avatar */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          style={styles.avatarSection}
        >
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarLetter}>
                {matchData.matchName?.[0] || "?"}
              </Text>
            </View>
            <View style={styles.verifiedBadge}>
              <Svg width={12} height={12} viewBox="0 0 16 16" fill="none">
                <Path
                  d="M3 8l3 3 7-7"
                  stroke="#fff"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
          </View>
          <Text style={styles.contextLine}>
            {matchData.matchPhoto?.contextLine || ""}
          </Text>
          <Text style={styles.verifiedAt}>
            Verified {matchData.matchPhoto?.verifiedAt || "recently"}
          </Text>
        </Animated.View>

        {/* Shared traits */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(400)}
          style={styles.traitsWrap}
        >
          {(matchData.sharedTraits || []).map((t: string) => (
            <View key={t} style={styles.traitBadge}>
              <Text style={styles.traitText}>{t}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Safety info bar */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(400)}
          style={styles.safetyBar}
        >
          <View style={styles.safetyDot} />
          <Text style={styles.safetyText}>
            Public venue · Easy exit · High foot traffic
          </Text>
        </Animated.View>

        {/* Buttons */}
        <Animated.View
          entering={FadeInDown.delay(500).duration(400)}
          style={styles.buttonsRow}
        >
          <AnimatedPressable
            onPress={onAccept}
            onPressIn={() => {
              acceptScale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
            }}
            onPressOut={() => {
              acceptScale.value = withSpring(1, { damping: 15, stiffness: 300 });
            }}
            style={[styles.acceptBtn, acceptAnimStyle]}
          >
            <Text style={styles.btnText}>ACCEPT</Text>
          </AnimatedPressable>
          <AnimatedPressable
            onPress={onDecline}
            onPressIn={() => {
              declineScale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
            }}
            onPressOut={() => {
              declineScale.value = withSpring(1, { damping: 15, stiffness: 300 });
            }}
            style={[styles.declineBtn, declineAnimStyle]}
          >
            <Text style={styles.declineBtnText}>DECLINE</Text>
          </AnimatedPressable>
        </Animated.View>

        <Text style={styles.disclaimer}>
          Neither person sees the other decision unless both accept.
        </Text>
      </ScrollView>
    </ScreenWrap>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  irisBubbleRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
    alignItems: "flex-start",
  },
  irisBubble: {
    flex: 1,
    backgroundColor: "rgba(139,92,246,0.08)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.1)",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderBottomLeftRadius: 4,
    padding: 14,
  },
  irisBubbleText: {
    fontSize: 14,
    lineHeight: 23,
    color: palette.textSecondary,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 16,
  },
  avatarWrap: {
    position: "relative",
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "rgba(236,72,153,0.5)",
    backgroundColor: "rgba(236,72,153,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontSize: 36,
    color: "#F9A8D4",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: palette.success,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: palette.void,
  },
  contextLine: {
    fontSize: 11,
    color: palette.textMuted,
  },
  verifiedAt: {
    fontSize: 9,
    color: palette.textGhost,
    marginTop: 2,
  },
  traitsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "center",
    marginBottom: 16,
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
  safetyBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "rgba(34,197,94,0.04)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.08)",
    borderRadius: 12,
    marginBottom: 20,
  },
  safetyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.success,
  },
  safetyText: {
    fontSize: 11,
    color: palette.textMuted,
  },
  buttonsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  acceptBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    backgroundColor: palette.success,
    alignItems: "center",
    justifyContent: "center",
  },
  declineBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(107,114,128,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    color: palette.white,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  declineBtnText: {
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  disclaimer: {
    textAlign: "center",
    fontSize: 10,
    color: palette.textGhost,
    lineHeight: 15,
  },
});
