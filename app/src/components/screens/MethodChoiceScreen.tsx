"use client";
import { motion } from "framer-motion";
import { IrisOrb, ScreenWrap } from "@/components/ui";

interface MethodChoiceScreenProps {
  userName: string;
  onChat: () => void;
  onScan: () => void;
}

export function MethodChoiceScreen({ userName, onChat, onScan }: MethodChoiceScreenProps) {
  const firstName = userName.trim().split(" ")[0];
  return (
    <ScreenWrap k="methodChoice">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 20px", background: "radial-gradient(ellipse at 50% 30%, rgba(139,92,246,0.04) 0%, transparent 60%)" }}>
        <IrisOrb size={36} />
        <p style={{ fontSize: 16, fontWeight: 600, color: "#F3F4F6", textAlign: "center", marginTop: 20, lineHeight: 1.5 }}>
          {firstName}, how should I learn about you?
        </p>
        <p style={{ fontSize: 12, color: "#6B7280", textAlign: "center", marginTop: 8, lineHeight: 1.5 }}>
          Both paths build the same profile. Choose what feels right.
        </p>
        <div style={{ width: "100%", marginTop: 28, display: "flex", flexDirection: "column", gap: 12 }}>
          <motion.button whileTap={{ scale: 0.98 }} onClick={onChat} className="fade-up" style={{ width: "100%", padding: "18px 20px", background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)", borderRadius: 16, cursor: "pointer", textAlign: "left" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#A78BFA", marginBottom: 4 }}>Talk to me</div>
            <div style={{ fontSize: 11, color: "#6B7280", lineHeight: 1.4 }}>I will ask you three questions. Takes about two minutes.</div>
          </motion.button>
          <motion.button whileTap={{ scale: 0.98 }} onClick={onScan} className="fade-up fade-up-1" style={{ width: "100%", padding: "18px 20px", background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.15)", borderRadius: 16, cursor: "pointer", textAlign: "left" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#06B6D4", marginBottom: 4 }}>Scan my device</div>
            <div style={{ fontSize: 11, color: "#6B7280", lineHeight: 1.4 }}>I will analyze your messages, social patterns, and more. Instant.</div>
          </motion.button>
        </div>
        <p style={{ fontSize: 9, color: "#374151", textAlign: "center", marginTop: 20, lineHeight: 1.5, maxWidth: 260 }}>
          All data stays on your device. Nothing is stored or shared.
        </p>
      </div>
    </ScreenWrap>
  );
}
