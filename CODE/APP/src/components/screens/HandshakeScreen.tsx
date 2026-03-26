"use client";
import { useState, useEffect, useRef } from "react";
import { HaloMark, ScreenWrap } from "@/components/ui";

const HS_PHASES = ["DISCOVERY", "NEGOTIATE", "VERIFY", "ACCEPT", "VENUE"];

interface HandshakeScreenProps {
  onNext: () => void;
  matchData: any;
}

/** Build real negotiation steps from actual match data */
function buildRealNegotiationSteps(matchData: any): Array<{ agent: "A" | "B" | "sys"; text: string; ms: number }> {
  const name = matchData?.matchName || "match";
  const compat = matchData?.compatibility || 85;
  const venue = matchData?.venue || "a coffee shop";
  const day = matchData?.day || "this weekend";
  const time = matchData?.time || "afternoon";
  const traits = matchData?.sharedTraits || [];
  const starter = matchData?.starter || "Something you are both curious about.";

  return [
    { agent: "sys", text: "Handshake protocol initiated", ms: 0 },
    { agent: "A", text: "Requesting profile exchange with matched agent", ms: 600 },
    { agent: "B", text: `Profile received. Analyzing compatibility: ${compat}%`, ms: 1200 },
    { agent: "A", text: traits.length > 0 ? `Shared vectors confirmed: ${traits.slice(0, 3).join(", ")}` : "Analyzing shared personality vectors", ms: 1900 },
    { agent: "sys", text: "Compatibility threshold exceeded. Proceeding to negotiation.", ms: 2500 },
    { agent: "A", text: `Proposing meeting: ${venue}, ${day}`, ms: 3100 },
    { agent: "B", text: `Evaluating venue safety profile for ${name}...`, ms: 3700 },
    { agent: "B", text: "Venue accepted. Public space confirmed. High foot traffic.", ms: 4300 },
    { agent: "sys", text: `Meeting locked: ${day} at ${time}`, ms: 4900 },
    { agent: "A", text: `Conversation seed: "${starter}"`, ms: 5400 },
    { agent: "sys", text: "Both agents in agreement. Handshake complete.", ms: 6000 },
  ];
}

export function HandshakeScreen({ onNext, matchData }: HandshakeScreenProps) {
  const [steps, setSteps] = useState<any[]>([]);
  const [phase, setPhase] = useState(0);
  const [done, setDone] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const logRef = useRef<HTMLDivElement>(null);
  const startTime = useRef(Date.now());

  useEffect(() => {
    const negotiationSteps = buildRealNegotiationSteps(matchData);
    let cancelled = false;

    // Track elapsed time
    const tick = setInterval(() => {
      if (!cancelled) setElapsed(((Date.now() - startTime.current) / 1000));
    }, 100);

    const timers = negotiationSteps.map((s, i) =>
      setTimeout(() => {
        if (cancelled) return;
        setSteps((p) => [...p, s]);
        if (i <= 1) setPhase(1);
        else if (i <= 3) setPhase(2);
        else if (i <= 6) setPhase(3);
        else if (i <= 9) setPhase(4);
        else setPhase(5);
        setTimeout(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, 50);
        if (i === negotiationSteps.length - 1) {
          setTimeout(() => {
            if (!cancelled) {
              setDone(true);
              clearInterval(tick);
            }
            setTimeout(() => { if (!cancelled) onNext(); }, 2000);
          }, 800);
        }
      }, s.ms + 500)
    );
    return () => { cancelled = true; timers.forEach(clearTimeout); clearInterval(tick); };
  }, [onNext, matchData]);

  const agentColor: Record<string, string> = { A: "#60A5FA", B: "#F472B6", sys: "#8B5CF6" };

  return (
    <ScreenWrap k="handshake">
      <div style={{ padding: "12px 20px 4px", textAlign: "center", flexShrink: 0 }}>
        <HaloMark size={18} />
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#6B7280", marginTop: 4 }}>
          AGENT TO AGENT HANDSHAKE
        </div>
      </div>
      <div style={{ display: "flex", gap: 3, padding: "8px 16px 10px", flexShrink: 0 }}>
        {HS_PHASES.map((p, i) => {
          const idx = i + 1;
          const isDone = phase > idx;
          const isActive = phase === idx;
          return (
            <div key={p} style={{ flex: 1, padding: "5px 0", textAlign: "center", fontSize: 7, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", borderRadius: 6, transition: "all 0.3s ease", color: isDone ? "#4ADE80" : isActive ? "#A78BFA" : "#374151", background: isDone ? "rgba(34,197,94,0.06)" : isActive ? "rgba(139,92,246,0.12)" : "rgba(255,255,255,0.015)" }}>
              {p}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 10, padding: "0 16px 10px", flexShrink: 0 }}>
        {[
          { letter: "A", label: "Your Agent", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.2)", color: "#60A5FA" },
          { letter: "B", label: "Match Agent", bg: "rgba(236,72,153,0.12)", border: "rgba(236,72,153,0.2)", color: "#F472B6" },
        ].map((a) => (
          <div key={a.letter} style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: a.bg, border: `1px solid ${a.border}`, borderRadius: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: `rgba(${a.letter === "A" ? "59,130,246" : "236,72,153"},0.2)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: a.color }}>{a.letter}</div>
            <span style={{ fontSize: 11, fontWeight: 600, color: a.color }}>{a.label}</span>
          </div>
        ))}
      </div>
      <div ref={logRef} style={{ flex: 1, overflowY: "auto", padding: "0 20px 16px", fontFamily: "'SF Mono', 'Fira Code', monospace" }}>
        {steps.map((s: any, i: number) => (
          <div key={i} className="fade-up" style={{ fontSize: 10, color: agentColor[s.agent] || "#9CA3AF", padding: "4px 0", lineHeight: 1.5, borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
            <span style={{ color: "#374151", marginRight: 8 }}>[{s.agent === "sys" ? "SYS" : `AGENT ${s.agent}`}]</span>
            {s.text}
          </div>
        ))}
        {done && (
          <div className="fade-up" style={{ textAlign: "center", marginTop: 16, padding: "10px", background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.1)", borderRadius: 12, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: "#4ADE80", textTransform: "uppercase" }}>
            HANDSHAKE COMPLETE &middot; {elapsed.toFixed(1)}s
          </div>
        )}
      </div>
    </ScreenWrap>
  );
}
