import React, { useState } from "react";
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
import Svg, { Circle, Path, Rect } from "react-native-svg";
import {
  ScreenWrap,
  IrisOrb,
  PrimaryButton,
  Label,
  ProgressBar,
} from "../ui";
import { palette } from "../../constants/colors";
import {
  postMeetingOptions,
  debriefItems,
  nextMatchCalibration,
} from "../../lib/data";
import { apiCall } from "../../lib/api";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PostMeetingScreenProps {
  userName: string;
  onRestart: () => void;
  matchData: any;
  matchId?: string;
}

function FeedbackIcon({ icon }: { icon: string }) {
  if (icon === "check") {
    return (
      <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
        <Path
          d="M3 8l3.5 3.5L13 5"
          stroke={palette.success}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  if (icon === "x") {
    return (
      <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
        <Path
          d="M3 3l8 8M11 3l-8 8"
          stroke={palette.alert}
          strokeWidth={1.8}
          strokeLinecap="round"
        />
      </Svg>
    );
  }
  // pause
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Rect x={3} y={2} width={2.5} height={10} rx={1} fill={palette.orchid} />
      <Rect
        x={8.5}
        y={2}
        width={2.5}
        height={10}
        rx={1}
        fill={palette.orchid}
      />
    </Svg>
  );
}

export function PostMeetingScreen({
  userName,
  onRestart,
  matchData,
  matchId,
}: PostMeetingScreenProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [showDebrief, setShowDebrief] = useState(false);

  const handleSelect = async (id: string) => {
    setSelected(id);
    if (matchId) {
      const responseMap: Record<string, string> = {
        yes: "yes",
        no: "no",
        maybe: "maybe",
      };
      try {
        await apiCall("/feedback", {
          method: "POST",
          body: JSON.stringify({
            matchId,
            response: responseMap[id] || "maybe",
          }),
        });
      } catch {
        // continue anyway
      }
    }
    setTimeout(() => setShowDebrief(true), 600);
  };

  const iconBg: Record<string, string> = {
    yes: "rgba(74,222,128,0.1)",
    no: "rgba(239,68,68,0.1)",
    maybe: "rgba(139,92,246,0.1)",
  };

  return (
    <ScreenWrap>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* IRIS question */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={styles.irisBubbleRow}
        >
          <IrisOrb size={28} pulse={false} />
          <View style={styles.irisBubble}>
            <Text style={styles.irisBubbleText}>
              How did it go with {matchData.matchName}?
            </Text>
          </View>
        </Animated.View>

        {/* Feedback options */}
        {!showDebrief && (
          <View style={styles.optionsCol}>
            {postMeetingOptions.map((opt, i) => {
              const isSelected = selected === opt.id;
              return (
                <AnimatedPressable
                  key={opt.id}
                  onPress={() => handleSelect(opt.id)}
                  style={[
                    styles.optionBtn,
                    isSelected && styles.optionBtnSelected,
                  ]}
                >
                  <View
                    style={[
                      styles.optionIcon,
                      { backgroundColor: iconBg[opt.id] || iconBg.maybe },
                    ]}
                  >
                    <FeedbackIcon icon={opt.icon} />
                  </View>
                  <View style={styles.optionTextWrap}>
                    <Text style={styles.optionLabel}>{opt.label}</Text>
                    <Text style={styles.optionSublabel}>{opt.sublabel}</Text>
                  </View>
                </AnimatedPressable>
              );
            })}
          </View>
        )}

        {/* Debrief / Agent Intelligence Report */}
        {showDebrief && (
          <Animated.View
            entering={FadeInDown.duration(400)}
            style={styles.debriefWrap}
          >
            <Label style={styles.reportHeading}>
              AGENT INTELLIGENCE REPORT
            </Label>

            {debriefItems.map((item, i) => (
              <Animated.View
                key={item.label}
                entering={FadeInDown.delay(i * 100).duration(300)}
                style={styles.debriefItem}
              >
                <View style={styles.debriefLabelRow}>
                  <Text style={styles.debriefLabel}>{item.label}</Text>
                  <Text style={styles.debriefChange}>{item.change}</Text>
                </View>
                <ProgressBar value={item.after} delay={i * 200} />
              </Animated.View>
            ))}

            <Label style={styles.calibrationHeading}>
              NEXT MATCH CALIBRATION
            </Label>
            {nextMatchCalibration.map((item, i) => (
              <View key={i} style={styles.calibrationItem}>
                <Svg
                  width={14}
                  height={14}
                  viewBox="0 0 16 16"
                  fill="none"
                  style={styles.calibrationIcon}
                >
                  <Circle
                    cx={8}
                    cy={8}
                    r={7}
                    fill="rgba(139,92,246,0.1)"
                    stroke={palette.iris}
                    strokeWidth={1}
                  />
                  <Path
                    d="M5 8l2 2 4-4"
                    stroke={palette.iris}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
                <Text style={styles.calibrationText}>{item}</Text>
              </View>
            ))}

            <Text style={styles.smarterNote}>
              IRIS is getting smarter. Each meeting refines your compatibility
              model.
            </Text>

            <PrimaryButton onPress={onRestart}>START NEW SEARCH</PrimaryButton>
          </Animated.View>
        )}
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
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  irisBubbleText: {
    fontSize: 14,
    lineHeight: 22,
    color: palette.textSecondary,
  },
  optionsCol: {
    gap: 8,
  },
  optionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.08)",
    borderRadius: 14,
  },
  optionBtnSelected: {
    backgroundColor: "rgba(139,92,246,0.1)",
    borderColor: "rgba(139,92,246,0.3)",
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  optionTextWrap: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: palette.textPrimary,
  },
  optionSublabel: {
    fontSize: 11,
    color: palette.textGhost,
    marginTop: 1,
  },
  debriefWrap: {
    marginTop: 8,
  },
  reportHeading: {
    marginBottom: 12,
    fontSize: 10,
    letterSpacing: 2.5,
    color: palette.orchid,
  },
  debriefItem: {
    marginBottom: 14,
  },
  debriefLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  debriefLabel: {
    fontSize: 11,
    color: palette.textMuted,
    fontWeight: "500",
  },
  debriefChange: {
    fontSize: 11,
    fontWeight: "700",
    color: palette.success,
  },
  calibrationHeading: {
    marginTop: 20,
    marginBottom: 10,
  },
  calibrationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingVertical: 6,
  },
  calibrationIcon: {
    marginTop: 1,
  },
  calibrationText: {
    fontSize: 11,
    color: palette.textMuted,
    lineHeight: 16,
    flex: 1,
  },
  smarterNote: {
    fontSize: 10,
    color: palette.textGhost,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 20,
    fontStyle: "italic",
  },
});
