import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ScreenWrap, HaloMark } from "../ui";
import { palette } from "../../constants/colors";

const HS_PHASES = ["DISCOVERY", "NEGOTIATE", "VERIFY", "ACCEPT", "VENUE"];

interface HandshakeScreenProps {
  onNext: () => void;
  negotiationSteps: any[];
}

export function HandshakeScreen({
  onNext,
  negotiationSteps,
}: HandshakeScreenProps) {
  const [steps, setSteps] = useState<any[]>([]);
  const [phase, setPhase] = useState(0);
  const [done, setDone] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!negotiationSteps) return;
    let cancelled = false;
    const timers = negotiationSteps.map((s: any, i: number) =>
      setTimeout(() => {
        if (cancelled) return;
        setSteps((p) => [...p, s]);
        if (i <= 1) setPhase(1);
        else if (i <= 3) setPhase(2);
        else if (i <= 6) setPhase(3);
        else if (i <= 9) setPhase(4);
        else setPhase(5);
        setTimeout(() => {
          scrollRef.current?.scrollToEnd({ animated: true });
        }, 50);
        if (i === negotiationSteps.length - 1) {
          setTimeout(() => {
            if (!cancelled) setDone(true);
            setTimeout(() => {
              if (!cancelled) onNext();
            }, 2000);
          }, 800);
        }
      }, s.ms + 500)
    );
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [onNext, negotiationSteps]);

  const agentColor: Record<string, string> = {
    A: "#60A5FA",
    B: "#F472B6",
    sys: palette.iris,
  };

  const agentCards = [
    {
      letter: "A",
      label: "Your Agent",
      bg: "rgba(59,130,246,0.12)",
      border: "rgba(59,130,246,0.2)",
      color: "#60A5FA",
    },
    {
      letter: "B",
      label: "Match Agent",
      bg: "rgba(236,72,153,0.12)",
      border: "rgba(236,72,153,0.2)",
      color: "#F472B6",
    },
  ];

  return (
    <ScreenWrap>
      {/* Header */}
      <View style={styles.header}>
        <HaloMark size={18} />
        <Text style={styles.headerSub}>AGENT TO AGENT HANDSHAKE</Text>
      </View>

      {/* Phase progress */}
      <View style={styles.phasesRow}>
        {HS_PHASES.map((p, i) => {
          const idx = i + 1;
          const isDone = phase > idx;
          const isActive = phase === idx;
          return (
            <View
              key={p}
              style={[
                styles.phaseChip,
                isDone && styles.phaseChipDone,
                isActive && styles.phaseChipActive,
              ]}
            >
              <Text
                style={[
                  styles.phaseText,
                  isDone && styles.phaseTextDone,
                  isActive && styles.phaseTextActive,
                ]}
              >
                {p}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Agent identity cards */}
      <View style={styles.agentCardsRow}>
        {agentCards.map((a) => (
          <View
            key={a.letter}
            style={[
              styles.agentCard,
              {
                backgroundColor: a.bg,
                borderColor: a.border,
              },
            ]}
          >
            <View
              style={[
                styles.agentCircle,
                {
                  backgroundColor:
                    a.letter === "A"
                      ? "rgba(59,130,246,0.2)"
                      : "rgba(236,72,153,0.2)",
                },
              ]}
            >
              <Text style={[styles.agentLetter, { color: a.color }]}>
                {a.letter}
              </Text>
            </View>
            <Text style={[styles.agentLabel, { color: a.color }]}>
              {a.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Log entries */}
      <ScrollView
        ref={scrollRef}
        style={styles.logScroll}
        contentContainerStyle={styles.logContent}
        showsVerticalScrollIndicator={false}
      >
        {steps.map((s: any, i: number) => (
          <Animated.View
            key={i}
            entering={FadeInDown.duration(300)}
            style={styles.logEntry}
          >
            <Text style={styles.logAgent}>
              [{s.agent === "sys" ? "SYS" : `AGENT ${s.agent}`}]
            </Text>
            <Text style={[styles.logText, { color: agentColor[s.agent] || palette.textMuted }]}>
              {" "}{s.text}
            </Text>
          </Animated.View>
        ))}
        {done && (
          <Animated.View
            entering={FadeInDown.duration(400)}
            style={styles.completeBanner}
          >
            <Text style={styles.completeText}>
              HANDSHAKE COMPLETE · 3.4 SECONDS
            </Text>
          </Animated.View>
        )}
      </ScrollView>
    </ScreenWrap>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
    alignItems: "center",
  },
  headerSub: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: palette.textGhost,
    marginTop: 4,
  },
  phasesRow: {
    flexDirection: "row",
    gap: 3,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  phaseChip: {
    flex: 1,
    paddingVertical: 5,
    alignItems: "center",
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.015)",
  },
  phaseChipDone: {
    backgroundColor: "rgba(34,197,94,0.06)",
  },
  phaseChipActive: {
    backgroundColor: "rgba(139,92,246,0.12)",
  },
  phaseText: {
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: palette.textGhost,
  },
  phaseTextDone: {
    color: palette.success,
  },
  phaseTextActive: {
    color: palette.orchid,
  },
  agentCardsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  agentCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 12,
  },
  agentCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  agentLetter: {
    fontSize: 14,
    fontWeight: "800",
  },
  agentLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  logScroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  logContent: {
    paddingBottom: 16,
  },
  logEntry: {
    flexDirection: "row",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.02)",
    flexWrap: "wrap",
  },
  logAgent: {
    fontSize: 10,
    color: palette.textGhost,
    fontFamily: "monospace",
  },
  logText: {
    fontSize: 10,
    lineHeight: 15,
    fontFamily: "monospace",
    flexShrink: 1,
  },
  completeBanner: {
    marginTop: 16,
    padding: 10,
    backgroundColor: "rgba(34,197,94,0.06)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.1)",
    borderRadius: 12,
    alignItems: "center",
  },
  completeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: palette.success,
    textTransform: "uppercase",
  },
});
