"use client";
import { useState, useEffect } from "react";
import { PrimaryButton, ScreenWrap } from "@/components/ui";

interface MeetingScreenProps {
  onNext: () => void;
  matchData: any;
}

export function MeetingScreen({ onNext, matchData }: MeetingScreenProps) {
  const [blur, setBlur] = useState(20);

  useEffect(() => {
    const start = Date.now();
    const dur = 2000;
    function step() {
      const elapsed = Date.now() - start;
      const p = Math.min(elapsed / dur, 1);
      setBlur(20 * (1 - p));
      if (p < 1) requestAnimationFrame(step);
    }
    const t = setTimeout(() => requestAnimationFrame(step), 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <ScreenWrap k="meeting">
      <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 24px" }}>
        <div className="fade-up" style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.1)", borderRadius: 12, marginBottom: 12 }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill="none" stroke="#4ADE80" strokeWidth="1.2" /><path d="M5 8l2 2 4-4" stroke="#4ADE80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#4ADE80", letterSpacing: 1, textTransform: "uppercase" }}>GPS IS OFF</div>
            <div style={{ fontSize: 10, color: "#9CA3AF" }}>Location sharing permanently disabled</div>
          </div>
        </div>

        <p className="fade-up fade-up-1" style={{ fontSize: 12, color: "#6B7280", textAlign: "center", marginBottom: 24 }}>
          Your agent has stepped back.
        </p>

        <div className="fade-up fade-up-2" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ width: 120, height: 120, borderRadius: "50%", border: "2px solid rgba(236,72,153,0.4)", background: "linear-gradient(135deg, rgba(236,72,153,0.2), rgba(139,92,246,0.2))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, color: "#F9A8D4", filter: `blur(${blur}px)`, transition: "filter 0.1s linear", marginBottom: 16 }}>
            {matchData.matchName?.[0] || "?"}
          </div>
          <span style={{ fontSize: 24, fontWeight: 800, color: "#F3F4F6" }}>{matchData.matchName}</span>
          <span style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>{matchData.matchPhoto?.contextLine || ""}</span>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginTop: 16 }}>
            {(matchData.sharedTraits || []).slice(0, 4).map((t: string) => (
              <span key={t} style={{ padding: "3px 10px", borderRadius: 12, fontSize: 9, fontWeight: 600, background: "rgba(236,72,153,0.08)", color: "#F9A8D4", border: "1px solid rgba(236,72,153,0.15)" }}>{t}</span>
            ))}
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <p style={{ textAlign: "center", fontSize: 11, color: "#4B5563", marginTop: 40, marginBottom: 16, cursor: "pointer" }}>
          Tap here if you need help
        </p>

        <PrimaryButton onClick={onNext}>MEETING OVER</PrimaryButton>
      </div>
    </ScreenWrap>
  );
}
