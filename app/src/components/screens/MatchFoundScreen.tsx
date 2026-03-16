"use client";
import { motion } from "framer-motion";
import { IrisOrb, ScreenWrap } from "@/components/ui";

interface MatchFoundScreenProps {
  onAccept: () => void;
  onDecline: () => void;
  matchData: any;
}

export function MatchFoundScreen({ onAccept, onDecline, matchData }: MatchFoundScreenProps) {
  return (
    <ScreenWrap k="matchFound">
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px 24px" }}>
        <div className="fade-up" style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "flex-start" }}>
          <IrisOrb size={28} pulse={false} />
          <div style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.1)", borderRadius: "18px 18px 18px 4px", padding: "14px 16px", fontSize: 14, lineHeight: 1.65, color: "#E0E0E0", flex: 1 }}>
            {matchData.irisDescription}
          </div>
        </div>

        <div className="fade-up fade-up-1" style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 16 }}>
          <div style={{ position: "relative", marginBottom: 12 }}>
            <div style={{ width: 100, height: 100, borderRadius: "50%", border: "2px solid rgba(236,72,153,0.5)", background: "linear-gradient(135deg, rgba(236,72,153,0.15), rgba(139,92,246,0.15))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, color: "#F9A8D4" }}>
              {matchData.matchName?.[0] || "?"}
            </div>
            <div style={{ position: "absolute", bottom: 2, right: 2, width: 24, height: 24, borderRadius: "50%", background: "#4ADE80", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #07070D" }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 8l3 3 7-7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
          </div>
          <span style={{ fontSize: 11, color: "#9CA3AF" }}>{matchData.matchPhoto?.contextLine || ""}</span>
          <span style={{ fontSize: 9, color: "#6B7280", marginTop: 2 }}>Verified {matchData.matchPhoto?.verifiedAt || "recently"}</span>
        </div>

        <div className="fade-up fade-up-2" style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginBottom: 16 }}>
          {(matchData.sharedTraits || []).map((t: string) => (
            <span key={t} style={{ padding: "3px 10px", borderRadius: 12, fontSize: 9, fontWeight: 600, background: "rgba(236,72,153,0.08)", color: "#F9A8D4", border: "1px solid rgba(236,72,153,0.15)" }}>{t}</span>
          ))}
        </div>

        <div className="fade-up fade-up-3" style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.08)", borderRadius: 12, marginBottom: 20 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ADE80", flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: "#9CA3AF" }}>Public venue &middot; Easy exit &middot; High foot traffic</span>
        </div>

        <div className="fade-up fade-up-4" style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <motion.button whileTap={{ scale: 0.98 }} onClick={onAccept} style={{ flex: 1, height: 52, borderRadius: 14, border: "none", background: "linear-gradient(135deg, #4ADE80, #16A34A)", color: "#fff", fontSize: 13, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer" }}>
            ACCEPT
          </motion.button>
          <motion.button whileTap={{ scale: 0.98 }} onClick={onDecline} style={{ flex: 1, height: 52, borderRadius: 14, background: "transparent", border: "1px solid rgba(107,114,128,0.3)", color: "#9CA3AF", fontSize: 13, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer" }}>
            DECLINE
          </motion.button>
        </div>

        <p style={{ textAlign: "center", fontSize: 10, color: "#4B5563", lineHeight: 1.5 }}>
          Neither person sees the other decision unless both accept.
        </p>
      </div>
    </ScreenWrap>
  );
}
