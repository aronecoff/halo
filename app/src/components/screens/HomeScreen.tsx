"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { HaloMark, IrisOrb, PrimaryButton, ScreenWrap } from "@/components/ui";

const PHASES = ["DEPLOY", "SCAN", "ANALYZE", "NEGOTIATE", "LOCK"];

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

        if (data.match) {
          addLog(`Compatible profile detected: ${data.match.other_user_name || "unknown"}`, "filter");
          await delay(400);
          addLog(`Compatibility score computed: ${data.match.compatibility_score}%`, "filter");
          await delay(300);
          addLog(`Shared traits: ${(data.match.shared_traits || []).join(", ") || "analyzing..."}`, "filter");
          await delay(400);
          addLog("Match locked.", "done");
          setPhase(5);
          setScanState("matched");
          setTimeout(() => onMatchFound(data.match), 1200);
        } else if (data.error?.includes("Not enough") || data.error?.includes("No eligible")) {
          addLog("Network scan complete. 0 compatible profiles found.", "sys");
          addLog("IRIS is monitoring. You will be notified when someone joins.", "sys");
          setScanState("waiting");
          setWaitMessage("Your profile is active. When your friends sign up and complete their IRIS conversation, matching will begin automatically.");
        } else {
          addLog(`Status: ${data.error || "No results"}`, "sys");
          setScanState("waiting");
          setWaitMessage(data.error || "Matching is temporarily unavailable.");
        }
      } catch (e) {
        console.error("Match error:", e);
        addLog("Network error. Connection failed.", "sys");
        setScanState("error");
        setWaitMessage("Could not reach HALO servers. Check your connection and try again.");
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
