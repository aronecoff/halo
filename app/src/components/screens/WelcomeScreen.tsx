"use client";
import { useRef } from "react";
import { HaloMark, IrisOrb, PrimaryButton, AnimatedNumber, ScreenWrap } from "@/components/ui";

interface WelcomeScreenProps {
  userName: string;
  onNameChange: (name: string) => void;
  onNext: () => void;
}

export function WelcomeScreen({ userName, onNameChange, onNext }: WelcomeScreenProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const canProceed = userName.trim().length > 0;

  return (
    <ScreenWrap k="welcome">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 32px", background: "radial-gradient(ellipse at 50% 30%, rgba(139,92,246,0.06) 0%, transparent 60%)", gap: 0 }}>
        <div className="fade-up" style={{ marginBottom: 24 }}>
          <IrisOrb size={40} />
        </div>
        <div className="fade-up fade-up-1"><HaloMark size={52} /></div>
        <div className="fade-up fade-up-2" style={{ fontSize: 10, fontWeight: 600, letterSpacing: 2.5, textTransform: "uppercase", color: "#6B7280", marginTop: 10 }}>
          AGENT MEDIATED HUMAN CONNECTION
        </div>
        <p className="fade-up fade-up-3" style={{ fontSize: 15, fontWeight: 300, color: "#9CA3AF", maxWidth: 320, lineHeight: 1.7, textAlign: "center", marginTop: 24 }}>
          Your autonomous AI agent learns who you are, finds compatible people nearby, and facilitates a meeting in the real world. No swiping. No profiles. No browsing. You just show up.
        </p>
        <div className="fade-up fade-up-4" style={{ width: "100%", marginTop: 28 }}>
          <input
            ref={inputRef}
            type="text"
            value={userName}
            onChange={(e) => onNameChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && canProceed) onNext(); }}
            placeholder="Your first name"
            style={{ width: "100%", height: 48, borderRadius: 14, border: "1px solid rgba(139,92,246,0.2)", background: "rgba(139,92,246,0.04)", color: "#F3F4F6", fontSize: 15, fontWeight: 500, textAlign: "center", letterSpacing: 0.5, outline: "none", transition: "border-color 0.2s" }}
            onFocus={(e) => { e.target.style.borderColor = "rgba(139,92,246,0.5)"; }}
            onBlur={(e) => { e.target.style.borderColor = "rgba(139,92,246,0.2)"; }}
          />
        </div>
        <div className="fade-up fade-up-5" style={{ width: "100%", marginTop: 12 }}>
          <PrimaryButton onClick={canProceed ? onNext : undefined} style={{ opacity: canProceed ? 1 : 0.4, pointerEvents: canProceed ? "auto" : "none" }}>
            ACTIVATE YOUR AGENT
          </PrimaryButton>
        </div>
        <div className="fade-up" style={{ display: "flex", justifyContent: "center", gap: 28, marginTop: 24, width: "100%", animationDelay: "0.35s" }}>
          {[{ num: "2,847", label: "ACTIVE AGENTS" }, { num: "SF", label: "LAUNCH CITY" }, { num: "94%", label: "SHOW UP RATE" }].map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#A78BFA" }}>
                {s.num === "SF" ? "SF" : s.num === "94%" ? "94%" : <AnimatedNumber value={s.num} />}
              </div>
              <div style={{ fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", color: "#6B7280", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </ScreenWrap>
  );
}
