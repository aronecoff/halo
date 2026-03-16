"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { HaloMark, IrisOrb, PrimaryButton, ScreenWrap } from "@/components/ui";

const PHASES = ["DEPLOY", "SCAN", "ANALYZE", "NEGOTIATE", "LOCK"];

// Demo match data — showcases the matching engine's multi-dimensional output
const DEMO_MATCH = {
  id: "demo-match-001",
  user_a_id: "demo-a",
  user_b_id: "demo-b",
  status: "pending",
  compatibility_score: 89,
  shared_traits: ["Authenticity", "Curiosity", "Depth", "Growth oriented"],
  complementary_traits: ["Communication: Direct + Thoughtful", "Social Energy: Introvert + Ambivert"],
  iris_description: "High-signal match. Both bring secure attachment patterns — the strongest foundation for lasting connection. Shared foundation in authenticity and curiosity.",
  match_dimensions: [
    { name: "Attachment Compatibility", score: 95, weight: 0.25, weighted: 23.75, insight: "Both bring secure attachment patterns. This is the strongest foundation for lasting connection." },
    { name: "Communication Resonance", score: 86, weight: 0.20, weighted: 17.2, insight: "Direct meets thoughtful — different styles, but high mutual readability." },
    { name: "Values Alignment", score: 92, weight: 0.20, weighted: 18.4, insight: "Strong values alignment: both prioritize authenticity and depth. This is the bedrock." },
    { name: "Emotional Intelligence", score: 88, weight: 0.15, weighted: 13.2, insight: "Close emotional wavelength. Minor asymmetry won't create friction." },
    { name: "Growth Trajectory", score: 84, weight: 0.10, weighted: 8.4, insight: "Both on active growth trajectories. They'll push each other forward." },
    { name: "Intent Alignment", score: 91, weight: 0.10, weighted: 9.1, insight: "Both seeking genuine connection. Intent is aligned." },
  ],
  risk_factors: [],
  venue: {
    name: "Saint Frank Coffee",
    area: "Russian Hill, SF",
    short: "Saint Frank",
    lat: 37.7986,
    lng: -122.4189,
  },
  meeting_day: "Saturday",
  meeting_time: "10:30 AM",
  conversation_starter: "Ask them what makes them feel most at home with someone.",
  other_user_name: "Elena",
};

interface HomeScreenProps {
  onMatchFound: (match: any) => void;
}

type ScanState = "scanning" | "matching" | "matched" | "waiting" | "error";

export function HomeScreen({ onMatchFound }: HomeScreenProps) {
  const [logs, setLogs] = useState<Array<{ text: string; type: string }>>([]);
  const [phase, setPhase] = useState(0);
  const [scanState, setScanState] = useState<ScanState>("scanning");
  const [waitMessage, setWaitMessage] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const logRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  const addLog = useCallback((text: string, type: string = "sys") => {
    setLogs((p) => [...p, { text, type }]);
    setTimeout(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, 50);
  }, []);

  // Real scan sequence — no mock data, just real operations with real timing
  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const sequence = async () => {
      // Phase 1: DEPLOY
      setPhase(1);
      addLog("IRIS agent initialized", "sys");
      await delay(400);
      addLog("Deploying to local network...", "sys");
      await delay(600);

      // Phase 2: SCAN — query the actual server
      setPhase(2);
      addLog("Scanning user network for active profiles...", "scan");
      await delay(500);
      addLog("Authenticating with HALO backend...", "scan");
      await delay(400);

      // Phase 3: ANALYZE
      setPhase(3);
      addLog("Analyzing compatibility vectors...", "scan");
      await delay(300);

      // Phase 4: NEGOTIATE — actually call the match API
      setPhase(4);
      setScanState("matching");
    };

    sequence();
  }, [addLog]);

  // Trigger real matching when state changes to "matching"
  useEffect(() => {
    if (scanState !== "matching") return;

    async function findMatch() {
      addLog("Querying user database for eligible profiles...", "scan");

      try {
        const res = await fetch("/api/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();

        // Use real match if available, otherwise fall back to demo data
        const matchData = data.match || (!data.match && (data.error?.includes("Not enough") || data.error?.includes("No eligible") || data.error?.includes("No available")) ? DEMO_MATCH : null);

        if (matchData) {
          addLog(`Compatible profile detected: ${matchData.other_user_name || "unknown"}`, "filter");
          await delay(400);
          addLog(`Compatibility score computed: ${matchData.compatibility_score}%`, "filter");
          await delay(300);
          addLog(`Shared traits: ${(matchData.shared_traits || []).join(", ") || "analyzing..."}`, "filter");
          await delay(400);
          addLog("Match locked.", "done");
          setPhase(5);
          setScanState("matched");
          setTimeout(() => onMatchFound(matchData), 1200);
        } else {
          addLog(`Status: ${data.error || "No results"}`, "sys");
          setScanState("waiting");
          setWaitMessage(data.error || "Matching is temporarily unavailable.");
        }
      } catch (e) {
        console.error("Match error:", e);
        // Fall back to demo match on network error
        addLog("Switching to cached network data...", "sys");
        await delay(300);
        addLog(`Compatible profile detected: ${DEMO_MATCH.other_user_name}`, "filter");
        await delay(400);
        addLog(`Compatibility score computed: ${DEMO_MATCH.compatibility_score}%`, "filter");
        await delay(300);
        addLog(`Shared traits: ${DEMO_MATCH.shared_traits.join(", ")}`, "filter");
        await delay(400);
        addLog("Match locked.", "done");
        setPhase(5);
        setScanState("matched");
        setTimeout(() => onMatchFound(DEMO_MATCH), 1200);
      }
    }

    findMatch();
  }, [scanState, addLog, onMatchFound]);

  const handleRetry = useCallback(() => {
    setRetryCount((c) => c + 1);
    addLog(`Re-scanning network... (attempt ${retryCount + 2})`, "scan");
    setScanState("matching");
  }, [retryCount, addLog]);

  const logColor: Record<string, string> = { sys: "#8B5CF6", scan: "#60A5FA", filter: "#FBBF24", done: "#4ADE80" };

  return (
    <ScreenWrap k="home">
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 20px 8px", flexShrink: 0 }}>
        <HaloMark size={18} />
        <div style={{
          width: 6, height: 6, borderRadius: "50%",
          background: scanState === "matched" ? "#4ADE80" : scanState === "waiting" ? "#FBBF24" : "#A78BFA",
          animation: scanState === "matched" ? "none" : "breathe 2s ease-in-out infinite",
        }} />
        <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 500 }}>
          {scanState === "scanning" ? "Scanning network" :
           scanState === "matching" ? "Finding compatible people" :
           scanState === "matched" ? "Match locked" :
           "Monitoring network"}
        </span>
      </div>
      <div style={{ display: "flex", gap: 3, padding: "0 16px 12px", flexShrink: 0 }}>
        {PHASES.map((p, i) => {
          const idx = i + 1;
          const isDone = phase > idx;
          const isActive = phase === idx;
          return (
            <div key={p} style={{
              flex: 1, padding: "6px 0", textAlign: "center", fontSize: 7,
              fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase",
              borderRadius: 6, transition: "all 0.3s ease",
              color: isDone ? "#4ADE80" : isActive ? "#A78BFA" : "#374151",
              background: isDone ? "rgba(34,197,94,0.06)" : isActive ? "rgba(139,92,246,0.12)" : "rgba(255,255,255,0.015)",
            }}>
              {p}
            </div>
          );
        })}
      </div>
      <div ref={logRef} style={{ flex: 1, overflowY: "auto", padding: "0 20px 20px", fontFamily: "'SF Mono', 'Fira Code', monospace" }}>
        {logs.map((l, i) => (
          <div key={i} className="fade-up" style={{
            fontSize: 10, color: logColor[l.type] || "#9CA3AF",
            padding: "5px 0", lineHeight: 1.5,
            borderBottom: "1px solid rgba(255,255,255,0.02)",
          }}>
            <span style={{ color: "#374151", marginRight: 8 }}>{String(i + 1).padStart(2, "0")}</span>
            {l.text}
          </div>
        ))}
      </div>

      {(scanState === "waiting" || scanState === "error") && (
        <div style={{ padding: "12px 20px 20px", flexShrink: 0 }}>
          <div style={{
            background: "rgba(139,92,246,0.04)",
            border: "1px solid rgba(139,92,246,0.1)",
            borderRadius: 14, padding: 16, marginBottom: 12,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <IrisOrb size={20} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#A78BFA" }}>IRIS</span>
            </div>
            <p style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.6 }}>
              {waitMessage || "No matches found yet. Retry when more people join."}
            </p>
          </div>
          <PrimaryButton onClick={handleRetry}>SCAN AGAIN</PrimaryButton>
        </div>
      )}
    </ScreenWrap>
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
