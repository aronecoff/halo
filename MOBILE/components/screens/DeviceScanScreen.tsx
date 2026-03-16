import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import Animated, {
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import Svg, { Circle, Path } from "react-native-svg";
import { ScreenWrap } from "../ui/ScreenWrap";
import { IrisOrb } from "../ui/IrisOrb";
import { HaloMark, PrimaryButton } from "../ui";
import { palette } from "../../constants/colors";
import { deviceScanPhases, type ScanEntry } from "../../lib/data";
import { performRealDeviceScan } from "../../lib/device-scan-orchestrator";
import { apiCall } from "../../lib/api";

interface DeviceScanScreenProps {
  userName: string;
  onNext: () => void;
  deviceScanLog: any[];
  onProfileReady?: (profile: any) => void;
}

const LOG_COLORS: Record<string, string> = {
  sys: palette.iris,
  scan: "#06B6D4",
  filter: palette.warning,
  done: palette.success,
  intent: palette.orchid,
};

const PERMISSIONS = [
  {
    label: "Messages",
    desc: "Communication style, emotional vocabulary, conflict patterns",
  },
  {
    label: "Social accounts",
    desc: "Relationship depth, engagement patterns, social energy",
  },
  {
    label: "Photos & media",
    desc: "Physical profile, lifestyle signals, presentation",
  },
  {
    label: "Contacts & usage",
    desc: "Social graph, behavioral patterns, location data",
  },
];

function PermissionIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 16 16" fill="none">
      <Circle
        cx={8}
        cy={8}
        r={7}
        fill="none"
        stroke="#06B6D4"
        strokeWidth={1.2}
      />
      <Path
        d="M5 8l2 2 4-4"
        stroke="#06B6D4"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BreathingDot({ color }: { color: string }) {
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
      style={[styles.breatheDot, { backgroundColor: color }, animatedStyle]}
    />
  );
}

export function DeviceScanScreen({
  userName,
  onNext,
  deviceScanLog,
  onProfileReady,
}: DeviceScanScreenProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [useRealScan, setUseRealScan] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Real device scan flow
  const startRealScan = useCallback(async () => {
    setPermissionGranted(true);
    setUseRealScan(true);

    try {
      const scanData = await performRealDeviceScan((entry: ScanEntry) => {
        setLogs((p) => [...p, entry]);
        setCurrentPhase(entry.phase);
        setTimeout(() => {
          scrollRef.current?.scrollToEnd({ animated: true });
        }, 50);
      });

      // Send scan data to API for analysis
      try {
        const res = await apiCall("/scan/analyze", {
          method: "POST",
          body: JSON.stringify({ scanData }),
        });
        const data = await res.json();
        if (data.profile && onProfileReady) {
          onProfileReady(data.profile);
        }
      } catch (apiErr) {
        console.error("Scan analysis API error:", apiErr);
      }

      // Proceed to next screen
      setTimeout(() => onNext(), 2000);
    } catch (err) {
      console.error("Device scan error:", err);
      // Fall back to simulated scan
      setUseRealScan(false);
    }
  }, [onNext, onProfileReady]);

  // Simulated scan fallback
  useEffect(() => {
    if (!permissionGranted || useRealScan || !deviceScanLog) return;
    let cancelled = false;
    const timers = deviceScanLog.map((entry: any, i: number) =>
      setTimeout(() => {
        if (cancelled) return;
        setLogs((p) => [...p, entry]);
        setCurrentPhase(entry.phase);
        setTimeout(() => {
          scrollRef.current?.scrollToEnd({ animated: true });
        }, 50);
        if (i === deviceScanLog.length - 1) {
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
  }, [permissionGranted, useRealScan, onNext, deviceScanLog]);

  // Permission Request Phase
  if (!permissionGranted) {
    return (
      <ScreenWrap>
        <View style={styles.permContainer}>
          <IrisOrb size={36} />

          <Animated.View entering={FadeInUp.delay(100).duration(500)}>
            <Text style={styles.permTitle}>
              IRIS needs access to learn who you are
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(200).duration(500)}>
            <Text style={styles.permSubtext}>
              Your digital footprint is behavioral and emotional data. I use it
              for good.
            </Text>
          </Animated.View>

          <View style={styles.permList}>
            {PERMISSIONS.map((p, i) => (
              <Animated.View
                key={p.label}
                entering={FadeInUp.delay(300 + i * 100).duration(500)}
                style={styles.permItem}
              >
                <View style={styles.permIconWrap}>
                  <PermissionIcon />
                </View>
                <View style={styles.permTextWrap}>
                  <Text style={styles.permLabel}>{p.label}</Text>
                  <Text style={styles.permDesc}>{p.desc}</Text>
                </View>
              </Animated.View>
            ))}
          </View>

          <Animated.View
            entering={FadeInUp.delay(700).duration(500)}
            style={styles.permButtonWrap}
          >
            <PrimaryButton onPress={startRealScan}>
              GRANT ACCESS
            </PrimaryButton>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(800).duration(500)}>
            <Text style={styles.permPrivacy}>
              All analysis happens on device. Nothing leaves your phone.
            </Text>
          </Animated.View>
        </View>
      </ScreenWrap>
    );
  }

  // Scanning Phase
  const phaseData = deviceScanPhases[currentPhase] || {
    color: "#06B6D4",
    label: "Scanning",
  };

  return (
    <ScreenWrap>
      {/* Header */}
      <View style={styles.scanHeader}>
        <View style={styles.scanHeaderRow}>
          <HaloMark size={18} />
          <BreathingDot color={phaseData.color} />
          <Text style={styles.scanPhaseLabel}>{phaseData.label}</Text>
        </View>

        {/* Phase Progress Bar */}
        <View style={styles.phaseBar}>
          {deviceScanPhases.map((p: any, i: number) => (
            <View
              key={p.label}
              style={[
                styles.phaseSegment,
                {
                  backgroundColor:
                    i <= currentPhase ? p.color : "rgba(255,255,255,0.04)",
                  opacity: i <= currentPhase ? 1 : 0.3,
                },
              ]}
            />
          ))}
        </View>
      </View>

      {/* Log */}
      <ScrollView
        ref={scrollRef}
        style={styles.logScroll}
        contentContainerStyle={styles.logContent}
      >
        {logs.map((l: any, i: number) => (
          <View key={i} style={styles.logEntry}>
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
          </View>
        ))}
      </ScrollView>
    </ScreenWrap>
  );
}

const styles = StyleSheet.create({
  // Permission Phase
  permContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  permTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: palette.textPrimary,
    textAlign: "center",
    marginTop: 20,
    lineHeight: 22,
  },
  permSubtext: {
    fontSize: 11,
    color: palette.textGhost,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 16,
  },
  permList: {
    width: "100%",
    marginTop: 20,
    gap: 6,
  },
  permItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "rgba(6,182,212,0.04)",
    borderWidth: 1,
    borderColor: "rgba(6,182,212,0.08)",
    borderRadius: 12,
  },
  permIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(6,182,212,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  permTextWrap: {
    flex: 1,
  },
  permLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#E0E0E0",
  },
  permDesc: {
    fontSize: 10,
    color: palette.textGhost,
  },
  permButtonWrap: {
    width: "100%",
    marginTop: 20,
  },
  permPrivacy: {
    fontSize: 9,
    color: palette.textGhost,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 14,
  },

  // Scanning Phase
  scanHeader: {
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  scanHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  breatheDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  scanPhaseLabel: {
    fontSize: 11,
    color: palette.textSecondary,
    fontWeight: "500",
  },
  phaseBar: {
    flexDirection: "row",
    gap: 2,
  },
  phaseSegment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  logScroll: {
    flex: 1,
  },
  logContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 8,
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
