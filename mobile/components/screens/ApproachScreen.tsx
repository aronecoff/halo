import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Svg, { Circle, Text as SvgText } from "react-native-svg";
import * as Location from "expo-location";
import { ScreenWrap, PrimaryButton } from "../ui";
import { palette } from "../../constants/colors";
import { apiCall } from "../../lib/api";

function haversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3;
  const p = Math.PI / 180;
  const a =
    0.5 -
    Math.cos((lat2 - lat1) * p) / 2 +
    (Math.cos(lat1 * p) *
      Math.cos(lat2 * p) *
      (1 - Math.cos((lon2 - lon1) * p))) /
      2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

interface ApproachScreenProps {
  onNext: () => void;
  matchData: any;
}

export function ApproachScreen({ onNext, matchData }: ApproachScreenProps) {
  const [distance, setDistance] = useState(200);
  const [arrived, setArrived] = useState(false);
  const [gpsActive, setGpsActive] = useState(false);

  const venueLat = matchData?.venue?.lat;
  const venueLng = matchData?.venue?.lng;

  useEffect(() => {
    let cancelled = false;
    let subscription: Location.LocationSubscription | null = null;

    async function startTracking() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted" || !venueLat || !venueLng) {
          // Fall back to simulation
          startSimulation();
          return;
        }

        setGpsActive(true);
        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 3000,
            distanceInterval: 5,
          },
          (loc) => {
            if (cancelled) return;
            const d = haversine(
              loc.coords.latitude,
              loc.coords.longitude,
              venueLat,
              venueLng
            );
            const rounded = Math.round(d);
            setDistance(rounded);
            if (d <= 50 && !arrived) {
              setArrived(true);
              apiCall("/location", {
                method: "POST",
                body: JSON.stringify({
                  lat: loc.coords.latitude,
                  lng: loc.coords.longitude,
                }),
              }).catch(() => {});
              setTimeout(() => {
                if (!cancelled) onNext();
              }, 2000);
            }
          }
        );
      } catch {
        startSimulation();
      }
    }

    function startSimulation() {
      if (cancelled) return;
      setGpsActive(false);
      const interval = setInterval(() => {
        setDistance((d) => (d <= 2 ? d : d - 2));
      }, 1000);
      const arriveTimer = setTimeout(() => {
        if (!cancelled) {
          setArrived(true);
          clearInterval(interval);
          setTimeout(() => {
            if (!cancelled) onNext();
          }, 2000);
        }
      }, 6000);
      // Store cleanup refs
      cleanupSim = () => {
        clearInterval(interval);
        clearTimeout(arriveTimer);
      };
    }

    let cleanupSim: (() => void) | null = null;
    startTracking();

    return () => {
      cancelled = true;
      subscription?.remove();
      cleanupSim?.();
    };
  }, [onNext, venueLat, venueLng, arrived]);

  const displayDist = arrived ? 0 : distance;
  const distNorm = Math.min(displayDist / 200, 1);
  const dotCx = 100 + (arrived ? 0 : distNorm * 30);
  const dotCy = 100 - (arrived ? 0 : distNorm * 20);

  return (
    <ScreenWrap>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>THE APPROACH</Text>
          <View style={styles.gpsRow}>
            <Svg width={14} height={14} viewBox="0 0 16 16" fill="none">
              <Circle cx={8} cy={6} r={1.5} fill={palette.success} />
            </Svg>
            <View style={styles.gpsDot} />
            <Text style={styles.gpsLabel}>
              GPS {gpsActive ? "ACTIVE" : "SIMULATED"}
            </Text>
          </View>
        </View>

        {/* Distance display */}
        <View style={styles.distanceWrap}>
          <Text style={styles.distanceText}>{arrived ? "0" : displayDist}m</Text>
          <Text style={styles.geofenceLabel}>Inside geofence</Text>
        </View>

        {/* Radar SVG */}
        <View style={styles.radarWrap}>
          <Svg viewBox="0 0 200 200" width={200} height={200}>
            {/* Outer ring */}
            <Circle
              cx={100}
              cy={100}
              r={80}
              fill="none"
              stroke="rgba(74,222,128,0.2)"
              strokeWidth={1.5}
              strokeDasharray="6 4"
            />
            {/* Inner ring */}
            <Circle
              cx={100}
              cy={100}
              r={40}
              fill="none"
              stroke="rgba(74,222,128,0.1)"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
            {/* Center dot (venue) */}
            <Circle cx={100} cy={100} r={4} fill="rgba(74,222,128,0.4)" />
            {/* Venue label */}
            <SvgText
              x={100}
              y={118}
              textAnchor="middle"
              fill={palette.success}
              fontSize={8}
              fontWeight="600"
            >
              {matchData.venueShort || "Venue"}
            </SvgText>
            {/* User dot */}
            <Circle cx={dotCx} cy={dotCy} r={5} fill="#3B82F6" />
            {/* User label */}
            <SvgText
              x={dotCx}
              y={dotCy - 12}
              textAnchor="middle"
              fill="#60A5FA"
              fontSize={7}
              fontWeight="600"
            >
              YOU
            </SvgText>
          </Svg>
        </View>

        {/* Arrived banner */}
        {arrived && (
          <Animated.View
            entering={FadeInDown.duration(400)}
            style={styles.arrivedBanner}
          >
            <Text style={styles.arrivedText}>BOTH ARRIVED</Text>
          </Animated.View>
        )}

        {/* I AM HERE button */}
        {!arrived && gpsActive && (
          <PrimaryButton
            onPress={() => {
              setArrived(true);
              setTimeout(() => onNext(), 1500);
            }}
            color="green"
          >
            I AM HERE
          </PrimaryButton>
        )}
      </View>
    </ScreenWrap>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: palette.textPrimary,
  },
  gpsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  gpsDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.success,
  },
  gpsLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: palette.success,
    letterSpacing: 0.5,
  },
  distanceWrap: {
    alignItems: "center",
    marginBottom: 8,
  },
  distanceText: {
    fontSize: 48,
    fontWeight: "300",
    color: palette.textPrimary,
  },
  geofenceLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: palette.success,
    letterSpacing: 1,
    marginTop: 4,
  },
  radarWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  arrivedBanner: {
    padding: 14,
    backgroundColor: "rgba(34,197,94,0.08)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.15)",
    borderRadius: 14,
    alignItems: "center",
  },
  arrivedText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2,
    color: palette.success,
    textTransform: "uppercase",
  },
});
