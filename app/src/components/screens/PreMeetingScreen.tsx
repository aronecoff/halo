"use client";
import { HaloMark, Card, Label, PrimaryButton, AnimatedNumber, ScreenWrap } from "@/components/ui";

const MEETING_CHECKLIST = [
  { id: "public_venue", label: "Public venue confirmed", auto: true },
  { id: "identity_verified", label: "Identity verified", auto: true },
  { id: "exit_ease", label: "Easy exit confirmed", auto: true },
  { id: "emergency_contact", label: "Emergency contact set", auto: false },
  { id: "location_shared", label: "Location shared with friend", auto: false },
];

interface PreMeetingScreenProps {
  onNext: () => void;
  matchData: any;
}

export function PreMeetingScreen({ onNext, matchData }: PreMeetingScreenProps) {
  return (
    <ScreenWrap k="preMeeting">
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><HaloMark size={18} /></div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.15)" }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6c0 1.5.7 2.8 1.8 3.7L8 14.5l2.7-4.8A4.48 4.48 0 0 0 12.5 6c0-2.5-2-4.5-4.5-4.5z" stroke="#14B8A6" strokeWidth="1.2" fill="none" /><circle cx="8" cy="6" r="1.5" fill="#14B8A6" /></svg>
            <span style={{ fontSize: 10, fontWeight: 600, color: "#14B8A6", letterSpacing: 0.5 }}>Safety</span>
          </div>
        </div>

        <Card className="fade-up" style={{ background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.1)", marginBottom: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#4ADE80" }}>{matchData.venue}</div>
          <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{matchData.area}</div>
          <div style={{ display: "flex", gap: 12, marginTop: 8, alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#FBBF24" }}>{matchData.day} &middot; {matchData.time}</span>
            <span style={{ fontSize: 11, color: "#6B7280" }}>{matchData.duration}</span>
          </div>
        </Card>

        <div className="fade-up fade-up-1" style={{ textAlign: "center", marginBottom: 14 }}>
          <span style={{ fontSize: 32, fontWeight: 300, color: "#F3F4F6" }}>In 18 hours</span>
        </div>

        <div className="fade-up fade-up-2" style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
          <div style={{ position: "relative", width: 56, height: 56 }}>
            <svg viewBox="0 0 56 56" width="56" height="56">
              <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(139,92,246,0.1)" strokeWidth="3" />
              <circle cx="28" cy="28" r="24" fill="none" stroke="#A78BFA" strokeWidth="3" strokeDasharray={`${(matchData.compatibility / 100) * 150.8} 150.8`} strokeLinecap="round" transform="rotate(-90 28 28)" style={{ transition: "stroke-dasharray 1.2s ease" }} />
            </svg>
            <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#A78BFA" }}>
              <AnimatedNumber value={matchData.compatibility} />%
            </span>
          </div>
          <div>
            <Label>COMPATIBILITY</Label>
            <p style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.5, marginTop: 2 }}>{matchData.reason}</p>
            <p style={{ fontSize: 10, color: "#A78BFA", lineHeight: 1.4, marginTop: 4 }}>{matchData.intentMatch}</p>
          </div>
        </div>

        <Card className="fade-up fade-up-3" style={{ marginBottom: 14 }}>
          <Label style={{ marginBottom: 8 }}>YOUR OPENING</Label>
          <p style={{ fontSize: 14, color: "#E0E0E0", fontStyle: "italic", lineHeight: 1.6 }}>&ldquo;{matchData.starter}&rdquo;</p>
        </Card>

        <div className="fade-up fade-up-4" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, padding: "8px 12px", borderRadius: 10, background: "rgba(139,92,246,0.04)" }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6c0 1.5.7 2.8 1.8 3.7L8 14.5l2.7-4.8A4.48 4.48 0 0 0 12.5 6c0-2.5-2-4.5-4.5-4.5z" stroke="#8B5CF6" strokeWidth="1.2" fill="none" /><circle cx="8" cy="6" r="1.5" fill="#8B5CF6" /></svg>
          <span style={{ fontSize: 11, color: "#9CA3AF", lineHeight: 1.4 }}>Name, photo, and contact protected until you arrive</span>
        </div>

        <div className="fade-up fade-up-4" style={{ marginBottom: 16 }}>
          <Label style={{ marginBottom: 8 }}>BEFORE YOU GO</Label>
          {MEETING_CHECKLIST.map((item) => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
              {item.auto ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill="rgba(34,197,94,0.12)" stroke="#4ADE80" strokeWidth="1" /><path d="M5 8l2 2 4-4" stroke="#4ADE80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              ) : (
                <div style={{ width: 16, height: 16, borderRadius: "50%", border: "1px solid rgba(107,114,128,0.4)" }} />
              )}
              <span style={{ fontSize: 12, color: item.auto ? "#E0E0E0" : "#9CA3AF", flex: 1 }}>{item.label}</span>
              {!item.auto && (
                <span style={{ fontSize: 9, fontWeight: 600, color: "#A78BFA", textTransform: "uppercase", letterSpacing: 1 }}>Set up</span>
              )}
            </div>
          ))}
        </div>

        <PrimaryButton onClick={onNext} color="green">ON MY WAY</PrimaryButton>
        <button style={{ width: "100%", marginTop: 10, padding: "12px", background: "transparent", border: "none", color: "#6B7280", fontSize: 11, cursor: "pointer", textAlign: "center" }}>
          Share meeting details with a friend
        </button>
      </div>
    </ScreenWrap>
  );
}
