import React, { useState, useEffect, useRef } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import Animated, {
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { ScreenWrap } from "../ui/ScreenWrap";
import { HaloMark } from "../ui";
import { palette } from "../../constants/colors";

const PHASES = ["DEPLOY", "SCAN", "ANALYZE", "NEGOTIATE", "LOCK"];

interface HomeScreenProps {
  onNext: () => void;
  scanLog: any[];
}

const LOG_COLORS: Record<string, string> = {
  sys: palette.iris,
  scan: palette.info,
  filter: palette.warning,
  done: palette.success,
};

function BreathingDot() {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.breatheDot,
        { backgroundColor: palette.warning },
        animatedStyle,
      ]}
    />
  );
}

export function HomeScreen({ onNext, scanLog }: HomeScreenProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [phase, setPhase] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!scanLog) return;
    let cancelled = false;
    const timers = scanLog.map((entry: any, i: number) =>
      setTimeout(() => {
        if (cancelled) return;
        setLogs((p) => [...p, entry]);
        if (i <= 1) setPhase(1);
        else if (i <= 3) setPhase(2);
        else if (i <= 5) setPhase(3);
        else if (i <= 6) setPhase(4);
        else setPhase(5);
        setTimeout(() => {
          scrollRef.current?.scrollToEnd({ animated: true });
        }, 50);
        if (entry.type === "done") {
          setTimeout(() => {
            if (!cancelled) onNext();
          }, 2000);
        }
      }, entry.ms + 600)
    );
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [onNext, scanLog]);

  return (
    <ScreenWrap>
      {/* Header */}
      <View style={styles.headerRow}>
        <HaloMark size={18} />
        <BreathingDot />
        <Text style={styles.headerLabel}>Scanning San Francisco</Text>
      </View>

      {/* Phase Indicators */}
      <View style={styles.phasesRow}>
        {PHASES.map((p, i) => {
          const idx = i + 1;
          const isDone = phase > idx;
          const isActive = phase === idx;

          let textColor = "#374151";
          let bgColor = "rgba(255,255,255,0.015)";

          if (isDone) {
            textColor = palette.success;
            bgColor = "rgba(34,197,94,0.06)";
          } else if (isActive) {
            textColor = palette.orchid;
            bgColor = "rgba(139,92,246,0.12)";
          }

          return (
            <View
              key={p}
              style={[styles.phaseChip, { backgroundColor: bgColor }]}
            >
              <Text style={[styles.phaseChipText, { color: textColor }]}>
                {p}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Log */}
      <ScrollView
        ref={scrollRef}
        style={styles.logScroll}
        contentContainerStyle={styles.logContent}
      >
        {logs.map((l: any, i: number) => (
          <Animated.View
            key={i}
            entering={FadeInUp.duration(300)}
            style={styles.logEntry}
          >
            <Text style={styles.logIndex}>
              {String(i + 1).padStart(2, "0")}
            </Text>
            <Text
              style={[
                styles.logText,
                { color: LOG_COLORS[l.type] || palette.textSecondary },
              ]}
            >
              {l.text}
            </Text>
          </Animated.View>
        ))}
      </ScrollView>
    </ScreenWrap>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  breatheDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  headerLabel: {
    fontSize: 11,
    color: palette.textSecondary,
    fontWeight: "500",
  },
  phasesRow: {
    flexDirection: "row",
    gap: 3,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  phaseChip: {
    flex: 1,
    paddingVertical: 6,
    alignItems: "center",
    borderRadius: 6,
  },
  phaseChipText: {
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  logScroll: {
    flex: 1,
  },
  logContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  logEntry: {
    flexDirection: "row",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.02)",
  },
  logIndex: {
    color: palette.textGhost,
    marginRight: 8,
    fontSize: 10,
    fontFamily: "Courier",
  },
  logText: {
    fontSize: 10,
    lineHeight: 15,
    fontFamily: "Courier",
    flex: 1,
  },
});
