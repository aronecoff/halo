import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import Animated, {
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import Svg, {
  Circle,
  Line,
  G,
  Text as SvgText,
  Path,
  Rect,
} from "react-native-svg";
import { ScreenWrap } from "../ui/ScreenWrap";
import { HaloMark, IrisOrb, PrimaryButton, Card, Label, AnimatedNumber } from "../ui";
import { palette } from "../../constants/colors";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ProfileBuiltScreenProps {
  userName: string;
  onNext: () => void;
  profile: any;
  intentProfile: any;
  profileCompounding: any;
}

function CheckIcon({ size = 8 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M3 8l3.5 3.5L13 5"
        stroke={palette.success}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ProfileBuiltScreen({
  userName,
  onNext,
  profile,
  intentProfile,
  profileCompounding,
}: ProfileBuiltScreenProps) {
  const nodes = profile?.personality_nodes || profile?.personalityNodes || [];
  const edges = profile?.personality_edges || profile?.personalityEdges || [];
  const traits = profile?.traits || [];
  const summary = profile?.summary || "";
  const eqScore = profile?.eq_score || profile?.eqScore || 0;
  const traitInsights = profile?.traitInsights || {};

  const [visibleNodes, setVisibleNodes] = useState(0);
  const [expandedTrait, setExpandedTrait] = useState<string | null>(null);

  useEffect(() => {
    if (visibleNodes < nodes.length) {
      const t = setTimeout(() => setVisibleNodes((v) => v + 1), 200);
      return () => clearTimeout(t);
    }
  }, [visibleNodes, nodes.length]);

  const nodeMap: Record<string, any> = {};
  nodes.forEach((n: any) => {
    nodeMap[n.id] = n;
  });

  const firstNameUpper = userName.trim().split(" ")[0].toUpperCase();

  return (
    <ScreenWrap>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.headerCenter}>
          <HaloMark size={18} />
          <Text style={styles.headerLabel}>
            {firstNameUpper}, YOUR PERSONALITY WEB
          </Text>
        </View>

        {/* SVG Personality Web */}
        <View style={styles.svgWrap}>
          <Svg viewBox="0 0 380 320" width="100%" height={130}>
            {/* Edges */}
            {edges.map((e: any, i: number) => {
              const s = nodeMap[e.source];
              const t = nodeMap[e.target];
              if (!s || !t) return null;
              const sVis = nodes.indexOf(s) < visibleNodes;
              const tVis = nodes.indexOf(t) < visibleNodes;
              return (
                <Line
                  key={`edge-${i}`}
                  x1={s.x}
                  y1={s.y}
                  x2={t.x}
                  y2={t.y}
                  stroke={s.domainColor}
                  strokeOpacity={sVis && tVis ? e.weight * 0.3 : 0}
                  strokeWidth={1}
                />
              );
            })}
            {/* Nodes */}
            {nodes.map((n: any, i: number) => {
              const show = i < visibleNodes;
              return (
                <G key={n.id}>
                  <Circle
                    cx={n.x}
                    cy={n.y}
                    r={show ? n.size / 2 : 0}
                    fill={n.domainColor}
                    fillOpacity={0.8}
                  />
                  <SvgText
                    x={n.x}
                    y={n.y + n.size / 2 + 12}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize={8}
                    opacity={show ? 0.9 : 0}
                  >
                    {n.label}
                  </SvgText>
                </G>
              );
            })}
          </Svg>
        </View>

        {/* EQ Score + Summary */}
        <Card style={{ marginTop: 8, padding: 12 }}>
          <View style={styles.summaryRow}>
            <IrisOrb size={22} pulse={false} />
            <View style={styles.summaryTextWrap}>
              <Text style={styles.summaryText}>{summary}</Text>
              {eqScore > 0 && (
                <Text style={styles.eqScore}>
                  EQ Signal: <AnimatedNumber value={eqScore} />
                </Text>
              )}
            </View>
          </View>
        </Card>

        {/* Traits List */}
        <View style={styles.section}>
          <Label>DETECTED TRAITS</Label>
          <View style={styles.traitsList}>
            {traits.map((t: any) => (
              <View key={t.label}>
                <Pressable
                  onPress={() =>
                    setExpandedTrait(
                      expandedTrait === t.label ? null : t.label
                    )
                  }
                  style={[
                    styles.traitRow,
                    expandedTrait === t.label && styles.traitRowActive,
                  ]}
                >
                  <Text style={styles.traitLabel}>{t.label}</Text>
                  <Text style={styles.traitValue}>{t.value}</Text>
                </Pressable>
                {expandedTrait === t.label && traitInsights[t.label] && (
                  <Animated.View entering={FadeInUp.duration(300)}>
                    <Text style={styles.traitInsight}>
                      {traitInsights[t.label]}
                    </Text>
                  </Animated.View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Intent Detection */}
        {intentProfile && (
          <View style={styles.section}>
            <Label style={{ marginBottom: 8 }}>INTENT DETECTED</Label>
            <Card style={{ padding: 12 }}>
              <View style={styles.intentHeader}>
                <Text style={styles.intentClass}>
                  {intentProfile.classification}
                </Text>
                <Text style={styles.intentConfidence}>
                  {Math.round((intentProfile.confidence || 0) * 100)}%
                </Text>
              </View>
              {intentProfile.breakdown && (
                <>
                  <View style={styles.breakdownBar}>
                    <View
                      style={[
                        styles.breakdownSegment,
                        {
                          flex: intentProfile.breakdown.genuine,
                          backgroundColor: palette.orchid,
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.breakdownSegment,
                        {
                          flex: intentProfile.breakdown.casual,
                          backgroundColor: palette.textGhost,
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.breakdownSegment,
                        {
                          flex: intentProfile.breakdown.physical,
                          backgroundColor: palette.textGhost,
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.breakdownLabels}>
                    <Text style={[styles.breakdownLabel, { color: palette.orchid }]}>
                      Genuine {intentProfile.breakdown.genuine}%
                    </Text>
                    <Text style={[styles.breakdownLabel, { color: palette.textGhost }]}>
                      Casual {intentProfile.breakdown.casual}%
                    </Text>
                    <Text style={[styles.breakdownLabel, { color: "#4B5563" }]}>
                      Physical {intentProfile.breakdown.physical}%
                    </Text>
                  </View>
                </>
              )}
            </Card>
          </View>
        )}

        {/* Profile Accuracy Compounding */}
        {profileCompounding && (
          <View style={styles.section}>
            <Label style={{ marginBottom: 8 }}>PROFILE ACCURACY</Label>
            <View style={styles.compoundingList}>
              {profileCompounding.stages?.map((s: any) => (
                <View key={s.label} style={styles.compoundingRow}>
                  <View style={styles.checkIconWrap}>
                    <CheckIcon />
                  </View>
                  <Text style={styles.compoundingLabel}>{s.label}</Text>
                  <Text style={styles.compoundingConfidence}>
                    {s.confidence}%
                  </Text>
                  <Text style={styles.compoundingPts}>
                    {s.dataPoints.toLocaleString()} pts
                  </Text>
                </View>
              ))}
              {profileCompounding.projections?.slice(0, 2).map((p: any) => (
                <View
                  key={p.label}
                  style={[styles.compoundingRow, { opacity: 0.5 }]}
                >
                  <View style={styles.projectionDot} />
                  <Text style={styles.projectionLabel}>{p.label}</Text>
                  <Text style={styles.projectionConfidence}>
                    {p.confidence}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* CTA */}
        <View style={styles.ctaWrap}>
          <PrimaryButton onPress={onNext}>BEGIN SCANNING</PrimaryButton>
        </View>
      </ScrollView>
    </ScreenWrap>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 60,
  },
  headerCenter: {
    alignItems: "center",
    marginBottom: 6,
  },
  headerLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: palette.textGhost,
    marginTop: 4,
  },
  svgWrap: {
    width: "100%",
  },
  summaryRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  summaryTextWrap: {
    flex: 1,
  },
  summaryText: {
    fontSize: 11.5,
    lineHeight: 18,
    color: "#E0E0E0",
    fontWeight: "400",
  },
  eqScore: {
    marginTop: 8,
    fontSize: 11,
    color: palette.orchid,
    fontWeight: "600",
  },
  section: {
    marginTop: 12,
  },
  traitsList: {
    marginTop: 8,
    gap: 2,
  },
  traitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  traitRowActive: {
    backgroundColor: "rgba(139,92,246,0.06)",
  },
  traitLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: palette.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  traitValue: {
    fontSize: 13,
    fontWeight: "500",
    color: "#E0E0E0",
  },
  traitInsight: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 6,
    fontSize: 12,
    color: palette.iris,
    lineHeight: 18,
    fontStyle: "italic",
  },
  intentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  intentClass: {
    fontSize: 13,
    fontWeight: "700",
    color: palette.orchid,
  },
  intentConfidence: {
    fontSize: 11,
    fontWeight: "600",
    color: palette.success,
  },
  breakdownBar: {
    flexDirection: "row",
    gap: 4,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  breakdownSegment: {
    borderRadius: 3,
  },
  breakdownLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  breakdownLabel: {
    fontSize: 8,
  },
  compoundingList: {
    gap: 4,
  },
  compoundingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkIconWrap: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "rgba(74,222,128,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  compoundingLabel: {
    fontSize: 10,
    color: palette.textSecondary,
    flex: 1,
  },
  compoundingConfidence: {
    fontSize: 10,
    fontWeight: "700",
    color: palette.success,
  },
  compoundingPts: {
    fontSize: 8,
    color: "#4B5563",
  },
  projectionDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "rgba(107,114,128,0.3)",
  },
  projectionLabel: {
    fontSize: 10,
    color: palette.textGhost,
    flex: 1,
  },
  projectionConfidence: {
    fontSize: 10,
    color: palette.textGhost,
  },
  ctaWrap: {
    marginTop: 16,
  },
});
