import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Svg, { Circle, Path } from "react-native-svg";
import {
  ScreenWrap,
  HaloMark,
  Card,
  Label,
  PrimaryButton,
  AnimatedNumber,
} from "../ui";
import { palette } from "../../constants/colors";
import { safetyConfig } from "../../lib/data";

interface PreMeetingScreenProps {
  onNext: () => void;
  matchData: any;
}

export function PreMeetingScreen({ onNext, matchData }: PreMeetingScreenProps) {
  const compat = matchData.compatibility || 0;
  const circumference = 2 * Math.PI * 24; // r=24
  const strokeDasharray = `${(compat / 100) * circumference} ${circumference}`;

  return (
    <ScreenWrap>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(0).duration(400)}
          style={styles.headerRow}
        >
          <HaloMark size={18} />
          <View style={styles.safetyPill}>
            <Svg width={12} height={12} viewBox="0 0 16 16" fill="none">
              <Path
                d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6c0 1.5.7 2.8 1.8 3.7L8 14.5l2.7-4.8A4.48 4.48 0 0 0 12.5 6c0-2.5-2-4.5-4.5-4.5z"
                stroke="#14B8A6"
                strokeWidth={1.2}
                fill="none"
              />
              <Circle cx={8} cy={6} r={1.5} fill="#14B8A6" />
            </Svg>
            <Text style={styles.safetyPillText}>Safety</Text>
          </View>
        </Animated.View>

        {/* Venue card */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Card style={styles.venueCard}>
            <Text style={styles.venueName}>{matchData.venue}</Text>
            <Text style={styles.venueArea}>{matchData.area}</Text>
            <View style={styles.venueTimeRow}>
              <Text style={styles.venueDay}>
                {matchData.day} · {matchData.time}
              </Text>
              <Text style={styles.venueDuration}>{matchData.duration}</Text>
            </View>
          </Card>
        </Animated.View>

        {/* Countdown */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          style={styles.countdownWrap}
        >
          <Text style={styles.countdownText}>In 18 hours</Text>
        </Animated.View>

        {/* Compatibility ring */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(400)}
          style={styles.compatRow}
        >
          <View style={styles.ringContainer}>
            <Svg width={56} height={56} viewBox="0 0 56 56">
              <Circle
                cx={28}
                cy={28}
                r={24}
                fill="none"
                stroke="rgba(139,92,246,0.1)"
                strokeWidth={3}
              />
              <Circle
                cx={28}
                cy={28}
                r={24}
                fill="none"
                stroke={palette.orchid}
                strokeWidth={3}
                strokeDasharray={strokeDasharray}
                strokeLinecap="round"
                rotation={-90}
                origin="28,28"
              />
            </Svg>
            <View style={styles.ringLabel}>
              <AnimatedNumber
                value={compat}
                style={styles.ringNumber}
              />
              <Text style={styles.ringPercent}>%</Text>
            </View>
          </View>
          <View style={styles.compatInfo}>
            <Label>COMPATIBILITY</Label>
            <Text style={styles.compatReason}>{matchData.reason}</Text>
            <Text style={styles.compatIntent}>{matchData.intentMatch}</Text>
          </View>
        </Animated.View>

        {/* Opening conversation starter */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <Card style={styles.starterCard}>
            <Label style={styles.starterLabel}>YOUR OPENING</Label>
            <Text style={styles.starterText}>
              &ldquo;{matchData.starter}&rdquo;
            </Text>
          </Card>
        </Animated.View>

        {/* Privacy note */}
        <Animated.View
          entering={FadeInDown.delay(450).duration(400)}
          style={styles.privacyRow}
        >
          <Svg width={14} height={14} viewBox="0 0 16 16" fill="none">
            <Path
              d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6c0 1.5.7 2.8 1.8 3.7L8 14.5l2.7-4.8A4.48 4.48 0 0 0 12.5 6c0-2.5-2-4.5-4.5-4.5z"
              stroke={palette.iris}
              strokeWidth={1.2}
              fill="none"
            />
            <Circle cx={8} cy={6} r={1.5} fill={palette.iris} />
          </Svg>
          <Text style={styles.privacyText}>
            Name, photo, and contact protected until you arrive
          </Text>
        </Animated.View>

        {/* Safety checklist */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)}>
          <Label style={styles.checklistHeading}>BEFORE YOU GO</Label>
          {safetyConfig.meetingChecklist.map((item) => (
            <View key={item.id} style={styles.checkItem}>
              {item.auto ? (
                <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
                  <Circle
                    cx={8}
                    cy={8}
                    r={7}
                    fill="rgba(34,197,94,0.12)"
                    stroke={palette.success}
                    strokeWidth={1}
                  />
                  <Path
                    d="M5 8l2 2 4-4"
                    stroke={palette.success}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              ) : (
                <View style={styles.checkCircleEmpty} />
              )}
              <Text
                style={[
                  styles.checkLabel,
                  !item.auto && styles.checkLabelMuted,
                ]}
              >
                {item.label}
              </Text>
              {!item.auto && <Text style={styles.setUp}>Set up</Text>}
            </View>
          ))}
        </Animated.View>

        {/* CTA */}
        <View style={styles.ctaWrap}>
          <PrimaryButton onPress={onNext} color="green">
            ON MY WAY
          </PrimaryButton>
          <Pressable style={styles.shareBtn}>
            <Text style={styles.shareBtnText}>
              Share meeting details with a friend
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenWrap>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  safetyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: "rgba(20,184,166,0.08)",
    borderWidth: 1,
    borderColor: "rgba(20,184,166,0.15)",
  },
  safetyPillText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#14B8A6",
    letterSpacing: 0.5,
  },
  venueCard: {
    backgroundColor: "rgba(34,197,94,0.04)",
    borderColor: "rgba(34,197,94,0.1)",
    marginBottom: 14,
  },
  venueName: {
    fontSize: 16,
    fontWeight: "700",
    color: palette.success,
  },
  venueArea: {
    fontSize: 12,
    color: palette.textMuted,
    marginTop: 2,
  },
  venueTimeRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    alignItems: "center",
  },
  venueDay: {
    fontSize: 13,
    fontWeight: "700",
    color: palette.warning,
  },
  venueDuration: {
    fontSize: 11,
    color: palette.textGhost,
  },
  countdownWrap: {
    alignItems: "center",
    marginBottom: 14,
  },
  countdownText: {
    fontSize: 32,
    fontWeight: "300",
    color: palette.textPrimary,
  },
  compatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 14,
  },
  ringContainer: {
    width: 56,
    height: 56,
    position: "relative",
  },
  ringLabel: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  ringNumber: {
    fontSize: 14,
    fontWeight: "800",
    color: palette.orchid,
    padding: 0,
  },
  ringPercent: {
    fontSize: 10,
    fontWeight: "800",
    color: palette.orchid,
  },
  compatInfo: {
    flex: 1,
  },
  compatReason: {
    fontSize: 12,
    color: palette.textMuted,
    lineHeight: 18,
    marginTop: 2,
  },
  compatIntent: {
    fontSize: 10,
    color: palette.orchid,
    lineHeight: 14,
    marginTop: 4,
  },
  starterCard: {
    marginBottom: 14,
  },
  starterLabel: {
    marginBottom: 8,
  },
  starterText: {
    fontSize: 14,
    color: palette.textSecondary,
    fontStyle: "italic",
    lineHeight: 22,
  },
  privacyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "rgba(139,92,246,0.04)",
  },
  privacyText: {
    fontSize: 11,
    color: palette.textMuted,
    lineHeight: 16,
    flex: 1,
  },
  checklistHeading: {
    marginBottom: 8,
  },
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.03)",
  },
  checkCircleEmpty: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(107,114,128,0.4)",
  },
  checkLabel: {
    fontSize: 12,
    color: palette.textSecondary,
    flex: 1,
  },
  checkLabelMuted: {
    color: palette.textMuted,
  },
  setUp: {
    fontSize: 9,
    fontWeight: "600",
    color: palette.orchid,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  ctaWrap: {
    marginTop: 16,
  },
  shareBtn: {
    marginTop: 10,
    padding: 12,
    alignItems: "center",
  },
  shareBtnText: {
    fontSize: 11,
    color: palette.textGhost,
  },
});
