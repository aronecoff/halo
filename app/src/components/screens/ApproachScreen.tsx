"use client";
import { useState, useEffect } from "react";
import { PrimaryButton, ScreenWrap } from "@/components/ui";

interface ApproachScreenProps {
  onNext: () => void;
  matchData: any;
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const p = Math.PI / 180;
  const a = 0.5 - Math.cos((lat2 - lat1) * p) / 2 + Math.cos(lat1 * p) * Math.cos(lat2 * p) * (1 - Math.cos((lon2 - lon1) * p)) / 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function ApproachScreen({ onNext, matchData }: ApproachScreenProps) {
  const [distance, setDistance] = useState<number | null>(null);
  const [arrived, setArrived] = useState(false);
  const [gpsActive, setGpsActive] = useState(false);

  const venueLat = matchData?.venue?.lat;
  const venueLng = matchData?.venue?.lng;

  useEffect(() => {
    if (!venueLat || !venueLng || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setGpsActive(true);
        const d = haversine(pos.coords.latitude, pos.coords.longitude, venueLat, venueLng);
        setDistance(Math.round(d));
        if (d <= 50 && !arrived) {
          setArrived(true);
          fetch("/api/location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          }).catch(() => {});
          setTimeout(() => onNext(), 2000);
        }
      },
      () => {
        setGpsActive(false);
      },
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [onNext, venueLat, venueLng, arrived]);

  const handleArrived = () => {
    setArrived(true);
    setTimeout(() => onNext(), 1500);
  };

  const displayDist = arrived ? 0 : (distance ?? 0);
  const distNorm = Math.min(displayDist / 200, 1);

  return (
    <ScreenWrap k="approach">
      <div style={{ flex: 1, padding: "12px 16px 24px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#F3F4F6" }}>THE APPROACH</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6c0 1.5.7 2.8 1.8 3.7L8 14.5l2.7-4.8A4.48 4.48 0 0 0 12.5 6c0-2.5-2-4.5-4.5-4.5z" stroke="#4ADE80" strokeWidth="1.2" fill="none" /><circle cx="8" cy="6" r="1.5" fill="#4ADE80" /></svg>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: gpsActive ? "#4ADE80" : "#FBBF24", animation: "breathe 2s ease-in-out infinite" }} />
            <span style={{ fontSize: 10, fontWeight: 600, color: gpsActive ? "#4ADE80" : "#FBBF24", letterSpacing: 0.5 }}>
              {gpsActive ? "GPS ACTIVE" : "APPROACHING"}
            </span>
          </div>
        </div>

        <div style={{ textAlign: "center", marginBottom: 8 }}>
          {gpsActive && distance !== null ? (
            <div style={{ fontSize: 48, fontWeight: 300, color: "#F3F4F6" }}>{arrived ? "0" : displayDist}m</div>
          ) : (
            <div style={{ fontSize: 24, fontWeight: 400, color: "#9CA3AF" }}>Head to the venue</div>
          )}
          <div style={{ fontSize: 11, fontWeight: 600, color: "#4ADE80", letterSpacing: 1, marginTop: 4 }}>
            {arrived ? "You have arrived" : matchData.venueShort || matchData.venue || "Venue"}
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg viewBox="0 0 200 200" width="200" height="200">
            <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(74,222,128,0.2)" strokeWidth="1.5" strokeDasharray="6 4" />
            <circle cx="100" cy="100" r="40" fill="none" stroke="rgba(74,222,128,0.1)" strokeWidth="1" strokeDasharray="4 4" />
            <circle cx="100" cy="100" r="4" fill="rgba(74,222,128,0.4)" />
            <text x="100" y="118" textAnchor="middle" fill="#4ADE80" fontSize="8" fontWeight="600">{matchData.venueShort || "Venue"}</text>
            {gpsActive && distance !== null && (
              <>
                <circle cx={100 + (arrived ? 0 : distNorm * 30)} cy={100 - (arrived ? 0 : distNorm * 20)} r="5" fill="#3B82F6" style={{ transition: "cx 1s ease, cy 1s ease" }}>
                  <animate attributeName="r" values="5;7;5" dur="2s" repeatCount="indefinite" />
                </circle>
                <text x={100 + (arrived ? 0 : distNorm * 30)} y={100 - (arrived ? 0 : distNorm * 20) - 12} textAnchor="middle" fill="#60A5FA" fontSize="7" fontWeight="600">YOU</text>
              </>
            )}
          </svg>
        </div>

        {arrived && (
          <div className="fade-up" style={{ textAlign: "center", padding: "14px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: 14, fontSize: 13, fontWeight: 700, letterSpacing: 2, color: "#4ADE80", textTransform: "uppercase" }}>
            BOTH ARRIVED
          </div>
        )}

        {!arrived && (
          <PrimaryButton onClick={handleArrived} color="green" style={{ marginTop: 12 }}>
            I AM HERE
          </PrimaryButton>
        )}
      </div>
    </ScreenWrap>
  );
}
