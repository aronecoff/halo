"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { IrisOrb, ScreenWrap } from "@/components/ui";

interface MatchFoundScreenProps {
  onAccept: () => void;
  onDecline: () => void;
  matchData: any;
}

const DIMENSION_COLORS: Record<string, string> = {
  "Attachment Compatibility": "#E11D48",
  "Communication Resonance": "#0EA5E9",
  "Values Alignment": "#10B981",
  "Emotional Intelligence": "#F59E0B",
  "Growth Trajectory": "#84CC16",
  "Intent Alignment": "#8B5CF6",
};

export function MatchFoundScreen({ onAccept, onDecline, matchData }: MatchFoundScreenProps) {
  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false);
  const dimensions = matchData.match_dimensions || matchData.matchDimensions || [];

  return (
    <ScreenWrap k="matchFound">
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px 24px" }}>
        {/* IRIS narrative */}
        <div className="fade-up" style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "flex-start" }}>
          <IrisOrb size={28} pulse={false} />
          <div style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.1)", borderRadius: "18px 18px 18px 4px", padding: "14px 16px", fontSize: 13, lineHeight: 1.65, color: "#E0E0E0", flex: 1 }}>
            {matchData.irisDescription}
          </div>
        </div>

        {/* Match avatar + score */}
        <div className="fade-up fade-up-1" style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16, padding: "12px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", border: "2px solid rgba(236,72,153,0.5)", background: "linear-gradient(135deg, rgba(236,72,153,0.15), rgba(139,92,246,0.15))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, color: "#F9A8D4" }}>
              {matchData.matchName?.[0] || "?"}
            </div>
            <div style={{ position: "absolute", bottom: 0, right: 0, width: 20, height: 20, borderRadius: "50%", background: "#4ADE80", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #07070D" }}>
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M3 8l3 3 7-7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#F3F4F6", marginBottom: 2 }}>{matchData.matchName}</div>
            <div style={{ fontSize: 10, color: "#6B7280" }}>Verified {matchData.matchPhoto?.verifiedAt || "recently"}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 700, background: "linear-gradient(135deg, #A78BFA, #4ADE80)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {matchData.compatibility}%
            </div>
            <div style={{ fontSize: 8, fontWeight: 600, color: "#6B7280", letterSpacing: 1.5, textTransform: "uppercase" }}>MATCH</div>
          </div>
        </div>

        {/* Dimensional breakdown — THE ALGORITHM */}
        {dimensions.length > 0 && (
          <div className="fade-up fade-up-2" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 8, fontWeight: 700, color: "#4B5563", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8, paddingLeft: 2 }}>
              COMPATIBILITY ANALYSIS
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {dimensions.map((d: any, i: number) => {
                const color = DIMENSION_COLORS[d.name] || "#A78BFA";
                return (
                  <motion.div
                    key={d.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    style={{
                      padding: "8px 10px",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.04)",
                      borderRadius: 10,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: "#D1D5DB" }}>{d.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color }}>{d.score}%</span>
                    </div>
                    <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.06)", marginBottom: 4 }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${d.score}%` }}
                        transition={{ delay: 0.5 + i * 0.1, duration: 0.6, ease: "easeOut" }}
                        style={{ height: "100%", borderRadius: 2, background: color }}
                      />
                    </div>
                    <div style={{ fontSize: 9, color: "#6B7280", lineHeight: 1.4 }}>{d.insight}</div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Shared traits */}
        <div className="fade-up fade-up-3" style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
          {(matchData.sharedTraits || []).map((t: string) => (
            <span key={t} style={{ padding: "3px 9px", borderRadius: 10, fontSize: 9, fontWeight: 600, background: "rgba(74,222,128,0.08)", color: "#4ADE80", border: "1px solid rgba(74,222,128,0.12)" }}>{t}</span>
          ))}
          {(matchData.complementaryTraits || []).map((t: string) => (
            <span key={t} style={{ padding: "3px 9px", borderRadius: 10, fontSize: 9, fontWeight: 600, background: "rgba(96,165,250,0.08)", color: "#60A5FA", border: "1px solid rgba(96,165,250,0.12)" }}>{t}</span>
          ))}
        </div>

        {/* Venue + safety */}
        <div className="fade-up fade-up-4" style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.08)", borderRadius: 10, marginBottom: 16 }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ADE80", flexShrink: 0 }} />
          <span style={{ fontSize: 10, color: "#9CA3AF" }}>{matchData.venue} &middot; {matchData.day} {matchData.time} &middot; Public venue</span>
        </div>

        {/* Actions */}
        <div className="fade-up fade-up-5" style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <motion.button whileTap={{ scale: 0.98 }} onClick={onAccept} style={{ flex: 1, height: 48, borderRadius: 14, border: "none", background: "linear-gradient(135deg, #4ADE80, #16A34A)", color: "#fff", fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer" }}>
            ACCEPT
          </motion.button>
          <motion.button whileTap={{ scale: 0.98 }} onClick={() => setShowDeclineConfirm(true)} style={{ flex: 1, height: 48, borderRadius: 14, background: "transparent", border: "1px solid rgba(107,114,128,0.3)", color: "#9CA3AF", fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer" }}>
            DECLINE
          </motion.button>
        </div>

        {/* Decline confirmation */}
        {showDeclineConfirm && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ padding: 14, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 12, marginBottom: 12 }}
          >
            <p style={{ fontSize: 12, color: "#D1D5DB", marginBottom: 10, lineHeight: 1.5 }}>
              Are you sure? IRIS selected this match based on your compatibility profile. This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={onDecline} style={{ flex: 1, height: 36, borderRadius: 10, border: "1px solid rgba(239,68,68,0.3)", background: "transparent", color: "#EF4444", fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: 1, textTransform: "uppercase" }}>
                YES, DECLINE
              </button>
              <button onClick={() => setShowDeclineConfirm(false)} style={{ flex: 1, height: 36, borderRadius: 10, border: "1px solid rgba(139,92,246,0.3)", background: "transparent", color: "#A78BFA", fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: 1, textTransform: "uppercase" }}>
                KEEP MATCH
              </button>
            </div>
          </motion.div>
        )}

        <p style={{ textAlign: "center", fontSize: 9, color: "#4B5563", lineHeight: 1.5 }}>
          Neither person sees the other&apos;s decision unless both accept.
        </p>
      </div>
    </ScreenWrap>
  );
}
