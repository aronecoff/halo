"use client";
import { useState, useEffect, useRef, useCallback, useMemo, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  onboardingChat,
  personalityNodes,
  personalityEdges,
  userProfile,
  safetyConfig,
  postMeetingOptions,
  debriefItems,
  nextMatchCalibration,
  deviceScanPhases,
  generateSession,
  buildMatchData,
  buildScanLog,
  buildNegotiationSteps,
  buildDeviceScanLog,
  buildIntentProfile,
  buildProfileCompounding,
} from "@/lib/data";

// ═══════════════════════════════════════════════════════════════
// HALO · Agent-Mediated Human Connection
// Single-file prototype: 10 screens, conversational-first UX
// ═══════════════════════════════════════════════════════════════

// --- Session context (unique per user, persisted in localStorage) ---
const SessionCtx = createContext(null);
function useSession() { return useContext(SessionCtx); }

// --- Reusable: HALO wordmark ---
function HaloMark({ size = 52 }) {
  return (
    <span
      style={{
        fontSize: size,
        fontWeight: 900,
        letterSpacing: size > 30 ? 14 : 8,
        background: "linear-gradient(135deg,#A78BFA,#7C3AED,#6D28D9)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        lineHeight: 1.1,
      }}
    >
      HALO
    </span>
  );
}

// --- Reusable: IRIS orb ---
function IrisOrb({ size = 40, pulse = true }) {
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      {pulse && (
        <div
          className="pulse-ring"
          style={{
            position: "absolute",
            inset: -4,
            borderRadius: "50%",
            border: "1.5px solid rgba(167,139,250,0.3)",
          }}
        />
      )}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: "radial-gradient(circle, #A78BFA 0%, #7C3AED 40%, #4C1D95 100%)",
          animation: "breathe 4s ease-in-out infinite",
        }}
      />
    </div>
  );
}

// --- Reusable: Typing indicator ---
function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "4px 0" }}>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "radial-gradient(circle, #A78BFA 0%, #7C3AED 40%, #4C1D95 100%)",
          flexShrink: 0,
        }}
      />
      <div
        style={{
          background: "rgba(139,92,246,0.08)",
          border: "1px solid rgba(139,92,246,0.1)",
          borderRadius: "18px 18px 18px 4px",
          padding: "12px 18px",
          display: "flex",
          gap: 4,
          alignItems: "center",
        }}
      >
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </div>
  );
}

// --- Reusable: Primary button ---
function PrimaryButton({ children, onClick, color = "purple", style: sx = {} }) {
  const bgs = {
    purple: "linear-gradient(135deg, #A78BFA, #7C3AED, #6D28D9)",
    green: "linear-gradient(135deg, #4ADE80, #16A34A)",
  };
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.1 }}
      onClick={onClick}
      style={{
        width: "100%",
        height: 52,
        borderRadius: 14,
        border: "none",
        background: bgs[color] || bgs.purple,
        color: "#fff",
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: 1.5,
        textTransform: "uppercase",
        cursor: "pointer",
        ...sx,
      }}
    >
      {children}
    </motion.button>
  );
}

// --- Reusable: Card ---
function Card({ children, style: sx = {}, className = "" }) {
  return (
    <div
      className={className}
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(139,92,246,0.12)",
        borderRadius: 16,
        padding: 16,
        ...sx,
      }}
    >
      {children}
    </div>
  );
}

// --- Reusable: Section label ---
function Label({ children, style: sx = {} }) {
  return (
    <div
      style={{
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: 2,
        textTransform: "uppercase",
        color: "#6B7280",
        ...sx,
      }}
    >
      {children}
    </div>
  );
}

// --- Screen transition wrapper ---
const screenVariants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

function ScreenWrap({ children, k }) {
  return (
    <motion.div
      key={k}
      variants={screenVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ height: "100%", display: "flex", flexDirection: "column" }}
    >
      {children}
    </motion.div>
  );
}

// --- Animated counter ---
function AnimatedNumber({ value, duration = 1200, style: sx = {} }) {
  const ref = useRef(null);
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = null;
    const target = typeof value === "string" ? parseInt(value.replace(/,/g, ""), 10) : value;
    if (isNaN(target)) { setDisplay(value); return; }
    function step(ts) {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(eased * target));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [value, duration]);
  return <span style={sx}>{typeof value === "string" && value.includes(",") ? display.toLocaleString() : display}</span>;
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function HaloApp() {
  const [screen, setScreen] = useState("welcome");
  const [userName, setUserName] = useState("");
  const [session, setSession] = useState(null);

  // Generate or restore a unique session when the user activates
  const activate = useCallback((name) => {
    const key = `halo_${name.toLowerCase().trim()}`;
    let data;
    try {
      const stored = typeof window !== "undefined" && localStorage.getItem(key);
      if (stored) { data = JSON.parse(stored); }
    } catch (e) { /* ignore */ }
    if (!data) {
      data = generateSession(name);
      try { if (typeof window !== "undefined") localStorage.setItem(key, JSON.stringify(data)); } catch (e) { /* ignore */ }
    }
    setSession(data);
  }, []);

  // Build all dynamic data from session (memoized, only recomputes when session changes)
  const ctx = useMemo(() => {
    if (!session) return null;
    return {
      matchData: buildMatchData(session),
      scanLog: buildScanLog(session),
      negotiationSteps: buildNegotiationSteps(session),
      deviceScanLog: buildDeviceScanLog(userName),
      intentProfile: buildIntentProfile(userName),
      profileCompounding: buildProfileCompounding(userName),
      session,
    };
  }, [session, userName]);

  return (
    <SessionCtx.Provider value={ctx}>
      <div className="flex items-center justify-center min-h-screen" style={{ background: "#07070D" }}>
        <div className="device-frame">
          <div className="device-screen">
            {/* Status bar */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 50,
                zIndex: 99,
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                padding: "0 24px 6px",
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600, color: "#F3F4F6" }}>9:41</span>
              <svg width="28" height="14" viewBox="0 0 28 14" fill="none">
                <rect x="0.5" y="0.5" width="22" height="13" rx="3" stroke="#F3F4F6" strokeOpacity="0.35" />
                <rect x="2" y="2" width="19" height="10" rx="2" fill="#F3F4F6" />
                <path d="M24 5v4a2 2 0 0 0 0-4z" fill="#F3F4F6" fillOpacity="0.35" />
              </svg>
            </div>
            {/* Screen content */}
            <div style={{ height: "100%", paddingTop: 50, paddingBottom: 20, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <AnimatePresence mode="wait">
                {screen === "welcome" && (
                  <WelcomeScreen
                    userName={userName}
                    onNameChange={setUserName}
                    onNext={() => {
                      activate(userName);
                      setScreen("methodChoice");
                    }}
                  />
                )}
                {screen === "methodChoice" && (
                  <MethodChoiceScreen
                    userName={userName}
                    onChat={() => setScreen("onboarding")}
                    onScan={() => setScreen("deviceScan")}
                  />
                )}
                {screen === "onboarding" && <OnboardingScreen userName={userName} onNext={() => setScreen("profileBuilt")} />}
                {screen === "deviceScan" && <DeviceScanScreen userName={userName} onNext={() => setScreen("profileBuilt")} />}
                {screen === "profileBuilt" && <ProfileBuiltScreen userName={userName} onNext={() => setScreen("home")} />}
                {screen === "home" && <HomeScreen onNext={() => setScreen("matchFound")} />}
                {screen === "matchFound" && <MatchFoundScreen onAccept={() => setScreen("handshake")} />}
                {screen === "handshake" && <HandshakeScreen onNext={() => setScreen("preMeeting")} />}
                {screen === "preMeeting" && <PreMeetingScreen onNext={() => setScreen("approach")} />}
                {screen === "approach" && <ApproachScreen onNext={() => setScreen("meeting")} />}
                {screen === "meeting" && <MeetingScreen onNext={() => setScreen("postMeeting")} />}
                {screen === "postMeeting" && <PostMeetingScreen userName={userName} onRestart={() => setScreen("home")} />}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </SessionCtx.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════
// SCREEN 1: Welcome
// ═══════════════════════════════════════════════════════════════
function WelcomeScreen({ onNext, userName, onNameChange }) {
  const inputRef = useRef(null);
  const canProceed = userName.trim().length > 0;

  return (
    <ScreenWrap k="welcome">
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 32px",
          background: "radial-gradient(ellipse at 50% 30%, rgba(139,92,246,0.06) 0%, transparent 60%)",
          gap: 0,
        }}
      >
        <div className="fade-up" style={{ marginBottom: 24 }}>
          <IrisOrb size={40} />
        </div>
        <div className="fade-up fade-up-1">
          <HaloMark size={52} />
        </div>
        <div
          className="fade-up fade-up-2"
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: 2.5,
            textTransform: "uppercase",
            color: "#6B7280",
            marginTop: 10,
          }}
        >
          AGENT MEDIATED HUMAN CONNECTION
        </div>
        <p
          className="fade-up fade-up-3"
          style={{
            fontSize: 15,
            fontWeight: 300,
            color: "#9CA3AF",
            maxWidth: 320,
            lineHeight: 1.7,
            textAlign: "center",
            marginTop: 24,
          }}
        >
          Your autonomous AI agent learns who you are, finds compatible people nearby, and
          facilitates a meeting in the real world. No swiping. No profiles. No browsing. You just show up.
        </p>

        {/* Name input */}
        <div className="fade-up fade-up-4" style={{ width: "100%", marginTop: 28 }}>
          <input
            ref={inputRef}
            type="text"
            value={userName}
            onChange={(e) => onNameChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && canProceed) onNext(); }}
            placeholder="Your first name"
            style={{
              width: "100%",
              height: 48,
              borderRadius: 14,
              border: "1px solid rgba(139,92,246,0.2)",
              background: "rgba(139,92,246,0.04)",
              color: "#F3F4F6",
              fontSize: 15,
              fontWeight: 500,
              textAlign: "center",
              letterSpacing: 0.5,
              outline: "none",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => { e.target.style.borderColor = "rgba(139,92,246,0.5)"; }}
            onBlur={(e) => { e.target.style.borderColor = "rgba(139,92,246,0.2)"; }}
          />
        </div>

        <div className="fade-up fade-up-5" style={{ width: "100%", marginTop: 12 }}>
          <PrimaryButton
            onClick={canProceed ? onNext : undefined}
            style={{ opacity: canProceed ? 1 : 0.4, pointerEvents: canProceed ? "auto" : "none" }}
          >
            ACTIVATE YOUR AGENT
          </PrimaryButton>
        </div>
        <div
          className="fade-up"
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 28,
            marginTop: 24,
            width: "100%",
            animationDelay: "0.35s",
          }}
        >
          {[
            { num: "2,847", label: "ACTIVE AGENTS" },
            { num: "SF", label: "LAUNCH CITY" },
            { num: "94%", label: "SHOW UP RATE" },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#A78BFA" }}>
                {s.num === "SF" ? "SF" : s.num === "94%" ? "94%" : <AnimatedNumber value={s.num} />}
              </div>
              <div
                style={{
                  fontSize: 9,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  color: "#6B7280",
                  marginTop: 4,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ScreenWrap>
  );
}

// ═══════════════════════════════════════════════════════════════
// SCREEN 1.5: Method Choice
// ═══════════════════════════════════════════════════════════════
function MethodChoiceScreen({ userName, onChat, onScan }) {
  const firstName = userName.trim().split(" ")[0];
  return (
    <ScreenWrap k="methodChoice">
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 20px",
          background: "radial-gradient(ellipse at 50% 30%, rgba(139,92,246,0.04) 0%, transparent 60%)",
        }}
      >
        <IrisOrb size={36} />
        <p style={{ fontSize: 16, fontWeight: 600, color: "#F3F4F6", textAlign: "center", marginTop: 20, lineHeight: 1.5 }}>
          {firstName}, how should I learn about you?
        </p>
        <p style={{ fontSize: 12, color: "#6B7280", textAlign: "center", marginTop: 8, lineHeight: 1.5 }}>
          Both paths build the same profile. Choose what feels right.
        </p>
        <div style={{ width: "100%", marginTop: 28, display: "flex", flexDirection: "column", gap: 12 }}>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onChat}
            className="fade-up"
            style={{
              width: "100%",
              padding: "18px 20px",
              background: "rgba(139,92,246,0.06)",
              border: "1px solid rgba(139,92,246,0.15)",
              borderRadius: 16,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: "#A78BFA", marginBottom: 4 }}>Talk to me</div>
            <div style={{ fontSize: 11, color: "#6B7280", lineHeight: 1.4 }}>I will ask you three questions. Takes about two minutes.</div>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onScan}
            className="fade-up fade-up-1"
            style={{
              width: "100%",
              padding: "18px 20px",
              background: "rgba(6,182,212,0.06)",
              border: "1px solid rgba(6,182,212,0.15)",
              borderRadius: 16,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
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

// ═══════════════════════════════════════════════════════════════
// SCREEN 1.75: Device Scan (Alternative Onboarding)
// ═══════════════════════════════════════════════════════════════
function DeviceScanScreen({ onNext, userName }) {
  const { deviceScanLog } = useSession();
  const [logs, setLogs] = useState([]);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const logRef = useRef(null);

  useEffect(() => {
    if (!permissionGranted || !deviceScanLog) return;
    let cancelled = false;
    const timers = deviceScanLog.map((entry, i) =>
      setTimeout(() => {
        if (cancelled) return;
        setLogs((p) => [...p, entry]);
        setCurrentPhase(entry.phase);
        setTimeout(() => {
          if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
        }, 50);
        if (i === deviceScanLog.length - 1) {
          setTimeout(() => { if (!cancelled) onNext(); }, 2000);
        }
      }, entry.ms + 600)
    );
    return () => { cancelled = true; timers.forEach(clearTimeout); };
  }, [permissionGranted, onNext, deviceScanLog]);

  const logColor = { sys: "#8B5CF6", scan: "#06B6D4", filter: "#FBBF24", done: "#4ADE80", intent: "#A78BFA" };

  if (!permissionGranted) {
    return (
      <ScreenWrap k="deviceScan">
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 24px",
          }}
        >
          <IrisOrb size={36} />
          <p style={{ fontSize: 15, fontWeight: 600, color: "#F3F4F6", textAlign: "center", marginTop: 20, lineHeight: 1.5 }}>
            IRIS needs access to learn who you are
          </p>
          <p style={{ fontSize: 11, color: "#6B7280", textAlign: "center", marginTop: 6, lineHeight: 1.4 }}>
            Your digital footprint is behavioral and emotional data. I use it for good.
          </p>
          <div style={{ width: "100%", marginTop: 20, display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              { label: "Messages", desc: "Communication style, emotional vocabulary, conflict patterns" },
              { label: "Social accounts", desc: "Relationship depth, engagement patterns, social energy" },
              { label: "Photos & media", desc: "Physical profile, lifestyle signals, presentation" },
              { label: "Contacts & usage", desc: "Social graph, behavioral patterns, location data" },
            ].map((p, i) => (
              <div
                key={p.label}
                className={`fade-up fade-up-${i + 1}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  background: "rgba(6,182,212,0.04)",
                  border: "1px solid rgba(6,182,212,0.08)",
                  borderRadius: 12,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "rgba(6,182,212,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" fill="none" stroke="#06B6D4" strokeWidth="1.2" />
                    <path d="M5 8l2 2 4-4" stroke="#06B6D4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#E0E0E0" }}>{p.label}</div>
                  <div style={{ fontSize: 10, color: "#6B7280" }}>{p.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ width: "100%", marginTop: 20 }}>
            <PrimaryButton onClick={() => setPermissionGranted(true)}>GRANT ACCESS</PrimaryButton>
          </div>
          <p style={{ fontSize: 9, color: "#374151", textAlign: "center", marginTop: 12, lineHeight: 1.5 }}>
            All analysis happens on device. Nothing leaves your phone.
          </p>
        </div>
      </ScreenWrap>
    );
  }

  return (
    <ScreenWrap k="deviceScanActive">
      <div style={{ padding: "12px 20px 4px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <HaloMark size={18} />
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: deviceScanPhases[currentPhase]?.color || "#06B6D4",
              animation: "breathe 2s ease-in-out infinite",
            }}
          />
          <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 500 }}>
            {deviceScanPhases[currentPhase]?.label || "Scanning"}
          </span>
        </div>
        {/* Phase progress bar */}
        <div style={{ display: "flex", gap: 2 }}>
          {deviceScanPhases.map((p, i) => (
            <div
              key={p.label}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 2,
                transition: "background 0.3s ease",
                background: i < currentPhase ? p.color : i === currentPhase ? p.color : "rgba(255,255,255,0.04)",
                opacity: i <= currentPhase ? 1 : 0.3,
              }}
            />
          ))}
        </div>
      </div>
      <div
        ref={logRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "8px 20px 20px",
          fontFamily: "'SF Mono', 'Fira Code', monospace",
        }}
      >
        {logs.map((l, i) => (
          <div
            key={i}
            className="fade-up"
            style={{
              fontSize: 10,
              color: logColor[l.type] || "#9CA3AF",
              padding: "5px 0",
              lineHeight: 1.5,
              borderBottom: "1px solid rgba(255,255,255,0.02)",
            }}
          >
            <span style={{ color: "#374151", marginRight: 8 }}>
              {String(i + 1).padStart(2, "0")}
            </span>
            {l.text}
          </div>
        ))}
      </div>
    </ScreenWrap>
  );
}

// ═══════════════════════════════════════════════════════════════
// SCREEN 2: Onboarding Chat
// ═══════════════════════════════════════════════════════════════
function OnboardingScreen({ onNext, userName }) {
  const firstName = userName.trim().split(" ")[0];
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const [qNum, setQNum] = useState(1);
  const chatRef = useRef(null);
  // Personalize the first IRIS message with the user's name
  const personalizedChat = useMemo(() => {
    const chat = [...onboardingChat];
    if (chat.length > 0 && chat[0].sender === "iris") {
      chat[0] = { ...chat[0], text: `Hey, ${firstName}. I am IRIS, your agent. I am going to learn who you are well enough to find people worth meeting. Not through a quiz. Just talk to me.` };
    }
    return chat;
  }, [firstName]);
  const queueRef = useRef(personalizedChat);
  const timerRef = useRef(null);

  const scrollDown = useCallback(() => {
    setTimeout(() => {
      if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }, 60);
  }, []);

  useEffect(() => {
    let cancelled = false;
    function showNext() {
      if (cancelled || queueRef.current.length === 0) return;
      const msg = queueRef.current.shift();
      // Show typing for IRIS messages
      if (msg.sender === "iris") {
        setTyping(true);
        scrollDown();
        timerRef.current = setTimeout(() => {
          if (cancelled) return;
          setTyping(false);
          setMessages((p) => [...p, msg]);
          // Count IRIS questions for progress
          if (msg.text.includes("?")) setQNum((q) => Math.min(q + 1, 3));
          scrollDown();
          timerRef.current = setTimeout(showNext, 1200);
        }, 1500);
      } else if (msg.sender === "system") {
        setMessages((p) => [...p, msg]);
        scrollDown();
        if (msg.text.includes("PROFILE CONSTRUCTION COMPLETE")) {
          timerRef.current = setTimeout(() => { if (!cancelled) onNext(); }, 2000);
        }
      } else {
        // user
        timerRef.current = setTimeout(() => {
          if (cancelled) return;
          setMessages((p) => [...p, msg]);
          scrollDown();
          timerRef.current = setTimeout(showNext, 800);
        }, 600);
      }
    }
    timerRef.current = setTimeout(showNext, 800);
    return () => { cancelled = true; clearTimeout(timerRef.current); };
  }, [onNext, scrollDown]);

  const progress = Math.min(qNum, 3);

  return (
    <ScreenWrap k="onboarding">
      {/* Header */}
      <div
        style={{
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          flexShrink: 0,
        }}
      >
        <HaloMark size={20} />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF", letterSpacing: 0.5 }}>
            Question {progress} of 3
          </span>
          <div style={{ width: 80, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.06)" }}>
            <div
              style={{
                width: `${(progress / 3) * 100}%`,
                height: "100%",
                borderRadius: 2,
                background: "linear-gradient(135deg,#A78BFA,#7C3AED)",
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>
      </div>
      {/* Chat */}
      <div ref={chatRef} style={{ flex: 1, overflowY: "auto", padding: "8px 16px 16px" }}>
        {messages.map((m, i) => (
          <ChatBubble key={i} msg={m} />
        ))}
        {typing && <TypingIndicator />}
      </div>
    </ScreenWrap>
  );
}

function ChatBubble({ msg }) {
  if (msg.sender === "system") {
    return (
      <div className="fade-up" style={{ textAlign: "center", margin: "16px 0" }}>
        <div
          style={{
            display: "inline-block",
            background: "rgba(34,197,94,0.06)",
            border: "1px solid rgba(34,197,94,0.1)",
            borderRadius: 12,
            padding: "8px 16px",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 2,
            color: "#4ADE80",
            textTransform: "uppercase",
          }}
        >
          {msg.text}
        </div>
      </div>
    );
  }
  const isIris = msg.sender === "iris";
  return (
    <div
      className="fade-up"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isIris ? "flex-start" : "flex-end",
        marginBottom: 14,
      }}
    >
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          color: isIris ? "#8B5CF6" : "#60A5FA",
          marginBottom: 4,
          marginLeft: isIris ? 40 : 0,
          marginRight: isIris ? 0 : 4,
        }}
      >
        {isIris ? "IRIS" : "YOU"}
      </span>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, maxWidth: "88%" }}>
        {isIris && (
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "radial-gradient(circle, #A78BFA 0%, #7C3AED 40%, #4C1D95 100%)",
              flexShrink: 0,
            }}
          />
        )}
        <div
          style={{
            background: isIris ? "rgba(139,92,246,0.08)" : "rgba(59,130,246,0.12)",
            border: isIris
              ? "1px solid rgba(139,92,246,0.1)"
              : "1px solid rgba(59,130,246,0.15)",
            borderRadius: isIris ? "18px 18px 18px 4px" : "18px 18px 4px 18px",
            padding: "12px 16px",
            fontSize: 14,
            lineHeight: 1.6,
            color: "#E0E0E0",
            fontWeight: 400,
            ...(msg.isInferenceCallout ? { borderLeft: "3px solid #7C3AED" } : {}),
          }}
        >
          {msg.text}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SCREEN 3: Profile Built
// ═══════════════════════════════════════════════════════════════
function ProfileBuiltScreen({ onNext, userName }) {
  const { intentProfile, profileCompounding } = useSession();
  const [visibleNodes, setVisibleNodes] = useState(0);
  const [expandedTrait, setExpandedTrait] = useState(null);

  useEffect(() => {
    if (visibleNodes < personalityNodes.length) {
      const t = setTimeout(() => setVisibleNodes((v) => v + 1), 200);
      return () => clearTimeout(t);
    }
  }, [visibleNodes]);

  const nodeMap = {};
  personalityNodes.forEach((n) => { nodeMap[n.id] = n; });

  return (
    <ScreenWrap k="profileBuilt">
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px 60px", minHeight: 0 }}>
        <div style={{ textAlign: "center", marginBottom: 6 }}>
          <HaloMark size={18} />
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: "#6B7280",
              marginTop: 4,
            }}
          >
            {userName.trim().split(" ")[0].toUpperCase()}, YOUR PERSONALITY WEB
          </div>
        </div>

        {/* SVG Personality Web */}
        <svg viewBox="0 0 380 320" width="100%" height="130" style={{ display: "block" }}>
          {/* Edges */}
          {personalityEdges.map((e, i) => {
            const s = nodeMap[e.source];
            const t = nodeMap[e.target];
            if (!s || !t) return null;
            const sVis = personalityNodes.indexOf(s) < visibleNodes;
            const tVis = personalityNodes.indexOf(t) < visibleNodes;
            return (
              <line
                key={i}
                x1={s.x}
                y1={s.y}
                x2={t.x}
                y2={t.y}
                stroke={s.domainColor}
                strokeOpacity={sVis && tVis ? e.weight * 0.3 : 0}
                strokeWidth={1}
                style={{ transition: "stroke-opacity 0.5s ease" }}
              />
            );
          })}
          {/* Nodes */}
          {personalityNodes.map((n, i) => {
            const show = i < visibleNodes;
            return (
              <g key={n.id} style={{ transition: "opacity 0.4s ease, transform 0.4s ease" }}>
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={show ? n.size / 2 : 0}
                  fill={n.domainColor}
                  fillOpacity={0.8}
                  style={{ transition: "r 0.4s ease" }}
                />
                <text
                  x={n.x}
                  y={n.y + n.size / 2 + 12}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize={8}
                  opacity={show ? 0.9 : 0}
                  style={{ transition: "opacity 0.4s ease" }}
                >
                  {n.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* IRIS summary */}
        <Card style={{ marginTop: 8, padding: 12 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <IrisOrb size={22} pulse={false} />
            <p style={{ fontSize: 11.5, lineHeight: 1.55, color: "#E0E0E0", fontWeight: 400 }}>
              {userProfile.profileSummary}
            </p>
          </div>
        </Card>

        {/* Traits list */}
        <div style={{ marginTop: 12 }}>
          <Label>DETECTED TRAITS</Label>
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 2 }}>
            {userProfile.traits.map((t) => (
              <div key={t.label}>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setExpandedTrait(expandedTrait === t.label ? null : t.label)}
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 12px",
                    background: expandedTrait === t.label ? "rgba(139,92,246,0.06)" : "transparent",
                    border: "none",
                    borderRadius: 10,
                    cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 1 }}>
                    {t.label}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#E0E0E0" }}>{t.value}</span>
                </motion.button>
                {expandedTrait === t.label && userProfile.traitInsights[t.label] && (
                  <div
                    className="fade-up"
                    style={{
                      padding: "6px 12px 12px",
                      fontSize: 12,
                      color: "#8B5CF6",
                      lineHeight: 1.5,
                      fontStyle: "italic",
                    }}
                  >
                    {userProfile.traitInsights[t.label]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Intent Detection */}
        <div style={{ marginTop: 12 }}>
          <Label style={{ marginBottom: 8 }}>INTENT DETECTED</Label>
          <Card style={{ padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#A78BFA" }}>{intentProfile.classification}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#4ADE80" }}>{intentProfile.confidence * 100}%</span>
            </div>
            <div style={{ display: "flex", gap: 4, height: 6, borderRadius: 3, overflow: "hidden" }}>
              <div style={{ flex: intentProfile.breakdown.genuine, background: "#A78BFA", borderRadius: 3 }} />
              <div style={{ flex: intentProfile.breakdown.casual, background: "#6B7280", borderRadius: 3 }} />
              <div style={{ flex: intentProfile.breakdown.physical, background: "#374151", borderRadius: 3 }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontSize: 8, color: "#A78BFA" }}>Genuine {intentProfile.breakdown.genuine}%</span>
              <span style={{ fontSize: 8, color: "#6B7280" }}>Casual {intentProfile.breakdown.casual}%</span>
              <span style={{ fontSize: 8, color: "#4B5563" }}>Physical {intentProfile.breakdown.physical}%</span>
            </div>
          </Card>
        </div>

        {/* Profile Accuracy Compounding */}
        <div style={{ marginTop: 12 }}>
          <Label style={{ marginBottom: 8 }}>PROFILE ACCURACY</Label>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {profileCompounding.stages.map((s, i) => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 14, height: 14, borderRadius: "50%", background: "rgba(74,222,128,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="8" height="8" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8l3.5 3.5L13 5" stroke="#4ADE80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span style={{ fontSize: 10, color: "#9CA3AF", flex: 1 }}>{s.label}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#4ADE80" }}>{s.confidence}%</span>
                <span style={{ fontSize: 8, color: "#4B5563" }}>{s.dataPoints.toLocaleString()} pts</span>
              </div>
            ))}
            {profileCompounding.projections.slice(0, 2).map((p) => (
              <div key={p.label} style={{ display: "flex", alignItems: "center", gap: 8, opacity: 0.5 }}>
                <div style={{ width: 14, height: 14, borderRadius: "50%", border: "1px solid rgba(107,114,128,0.3)" }} />
                <span style={{ fontSize: 10, color: "#6B7280", flex: 1 }}>{p.label}</span>
                <span style={{ fontSize: 10, color: "#6B7280" }}>{p.confidence}%</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <PrimaryButton onClick={onNext}>BEGIN SCANNING</PrimaryButton>
        </div>
      </div>
    </ScreenWrap>
  );
}

// ═══════════════════════════════════════════════════════════════
// SCREEN 4: Home (Scanning)
// ═══════════════════════════════════════════════════════════════
const PHASES = ["DEPLOY", "SCAN", "ANALYZE", "NEGOTIATE", "LOCK"];

function HomeScreen({ onNext }) {
  const { scanLog } = useSession();
  const [logs, setLogs] = useState([]);
  const [phase, setPhase] = useState(0);
  const logRef = useRef(null);

  useEffect(() => {
    if (!scanLog) return;
    let cancelled = false;
    const timers = scanLog.map((entry, i) =>
      setTimeout(() => {
        if (cancelled) return;
        setLogs((p) => [...p, entry]);
        // Advance phase based on log index
        if (i <= 1) setPhase(1);
        else if (i <= 3) setPhase(2);
        else if (i <= 5) setPhase(3);
        else if (i <= 6) setPhase(4);
        else setPhase(5);
        setTimeout(() => {
          if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
        }, 50);
        // Auto advance on done
        if (entry.type === "done") {
          setTimeout(() => { if (!cancelled) onNext(); }, 2000);
        }
      }, entry.ms + 600)
    );
    return () => { cancelled = true; timers.forEach(clearTimeout); };
  }, [onNext, scanLog]);

  const logColor = { sys: "#8B5CF6", scan: "#60A5FA", filter: "#FBBF24", done: "#4ADE80" };

  return (
    <ScreenWrap k="home">
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 20px 8px",
          flexShrink: 0,
        }}
      >
        <HaloMark size={18} />
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#FBBF24",
            animation: "breathe 2s ease-in-out infinite",
          }}
        />
        <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 500 }}>Scanning San Francisco</span>
      </div>

      {/* Phase bar */}
      <div style={{ display: "flex", gap: 3, padding: "0 16px 12px", flexShrink: 0 }}>
        {PHASES.map((p, i) => {
          const idx = i + 1;
          const isDone = phase > idx;
          const isActive = phase === idx;
          return (
            <div
              key={p}
              style={{
                flex: 1,
                padding: "6px 0",
                textAlign: "center",
                fontSize: 7,
                fontWeight: 700,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                borderRadius: 6,
                transition: "all 0.3s ease",
                color: isDone ? "#4ADE80" : isActive ? "#A78BFA" : "#374151",
                background: isDone
                  ? "rgba(34,197,94,0.06)"
                  : isActive
                  ? "rgba(139,92,246,0.12)"
                  : "rgba(255,255,255,0.015)",
              }}
            >
              {p}
            </div>
          );
        })}
      </div>

      {/* Log terminal */}
      <div
        ref={logRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0 20px 20px",
          fontFamily: "'SF Mono', 'Fira Code', monospace",
        }}
      >
        {logs.map((l, i) => (
          <div
            key={i}
            className="fade-up"
            style={{
              fontSize: 10,
              color: logColor[l.type] || "#9CA3AF",
              padding: "5px 0",
              lineHeight: 1.5,
              borderBottom: "1px solid rgba(255,255,255,0.02)",
            }}
          >
            <span style={{ color: "#374151", marginRight: 8 }}>
              {String(i + 1).padStart(2, "0")}
            </span>
            {l.text}
          </div>
        ))}
      </div>
    </ScreenWrap>
  );
}

// ═══════════════════════════════════════════════════════════════
// SCREEN 5: Match Found
// ═══════════════════════════════════════════════════════════════
function MatchFoundScreen({ onAccept }) {
  const { matchData } = useSession();
  return (
    <ScreenWrap k="matchFound">
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px 24px" }}>
        {/* IRIS description */}
        <div className="fade-up" style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "flex-start" }}>
          <IrisOrb size={28} pulse={false} />
          <div
            style={{
              background: "rgba(139,92,246,0.08)",
              border: "1px solid rgba(139,92,246,0.1)",
              borderRadius: "18px 18px 18px 4px",
              padding: "14px 16px",
              fontSize: 14,
              lineHeight: 1.65,
              color: "#E0E0E0",
              flex: 1,
            }}
          >
            {matchData.irisDescription}
          </div>
        </div>

        {/* Match photo + info */}
        <div className="fade-up fade-up-1" style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 16 }}>
          <div style={{ position: "relative", marginBottom: 12 }}>
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: "50%",
                border: "2px solid rgba(236,72,153,0.5)",
                background: "linear-gradient(135deg, rgba(236,72,153,0.15), rgba(139,92,246,0.15))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 36,
                color: "#F9A8D4",
              }}
            >
              {matchData.matchName[0]}
            </div>
            {matchData.matchPhoto.verified && (
              <div
                style={{
                  position: "absolute",
                  bottom: 2,
                  right: 2,
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "#4ADE80",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid #07070D",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8l3 3 7-7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </div>
          <span style={{ fontSize: 11, color: "#9CA3AF" }}>{matchData.matchPhoto.contextLine}</span>
          <span style={{ fontSize: 9, color: "#6B7280", marginTop: 2 }}>
            Verified {matchData.matchPhoto.verifiedAt}
          </span>
        </div>

        {/* Shared traits */}
        <div className="fade-up fade-up-2" style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginBottom: 16 }}>
          {matchData.sharedTraits.map((t) => (
            <span
              key={t}
              style={{
                padding: "3px 10px",
                borderRadius: 12,
                fontSize: 9,
                fontWeight: 600,
                background: "rgba(236,72,153,0.08)",
                color: "#F9A8D4",
                border: "1px solid rgba(236,72,153,0.15)",
              }}
            >
              {t}
            </span>
          ))}
        </div>

        {/* Venue safety */}
        <div
          className="fade-up fade-up-3"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            background: "rgba(34,197,94,0.04)",
            border: "1px solid rgba(34,197,94,0.08)",
            borderRadius: 12,
            marginBottom: 20,
          }}
        >
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ADE80", flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: "#9CA3AF" }}>
            Public venue &middot; Easy exit &middot; High foot traffic
          </span>
        </div>

        {/* Buttons */}
        <div className="fade-up fade-up-4" style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onAccept}
            style={{
              flex: 1,
              height: 52,
              borderRadius: 14,
              border: "none",
              background: "linear-gradient(135deg, #4ADE80, #16A34A)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            ACCEPT
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.98 }}
            style={{
              flex: 1,
              height: 52,
              borderRadius: 14,
              background: "transparent",
              border: "1px solid rgba(107,114,128,0.3)",
              color: "#9CA3AF",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            DECLINE
          </motion.button>
        </div>

        <p
          style={{
            textAlign: "center",
            fontSize: 10,
            color: "#4B5563",
            lineHeight: 1.5,
          }}
        >
          Neither person sees the other decision unless both accept.
        </p>
      </div>
    </ScreenWrap>
  );
}

// ═══════════════════════════════════════════════════════════════
// SCREEN 6: Handshake
// ═══════════════════════════════════════════════════════════════
const HS_PHASES = ["DISCOVERY", "NEGOTIATE", "VERIFY", "ACCEPT", "VENUE"];

function HandshakeScreen({ onNext }) {
  const { negotiationSteps } = useSession();
  const [steps, setSteps] = useState([]);
  const [phase, setPhase] = useState(0);
  const [done, setDone] = useState(false);
  const logRef = useRef(null);

  useEffect(() => {
    if (!negotiationSteps) return;
    let cancelled = false;
    const timers = negotiationSteps.map((s, i) =>
      setTimeout(() => {
        if (cancelled) return;
        setSteps((p) => [...p, s]);
        // Phase mapping
        if (i <= 1) setPhase(1);
        else if (i <= 3) setPhase(2);
        else if (i <= 6) setPhase(3);
        else if (i <= 9) setPhase(4);
        else setPhase(5);
        setTimeout(() => {
          if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
        }, 50);
        // Last entry
        if (i === negotiationSteps.length - 1) {
          setTimeout(() => {
            if (!cancelled) setDone(true);
            setTimeout(() => { if (!cancelled) onNext(); }, 2000);
          }, 800);
        }
      }, s.ms + 500)
    );
    return () => { cancelled = true; timers.forEach(clearTimeout); };
  }, [onNext, negotiationSteps]);

  const agentColor = { A: "#60A5FA", B: "#F472B6", sys: "#8B5CF6" };

  return (
    <ScreenWrap k="handshake">
      {/* Header */}
      <div style={{ padding: "12px 20px 4px", textAlign: "center", flexShrink: 0 }}>
        <HaloMark size={18} />
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: "#6B7280",
            marginTop: 4,
          }}
        >
          AGENT TO AGENT HANDSHAKE
        </div>
      </div>

      {/* Phase bar */}
      <div style={{ display: "flex", gap: 3, padding: "8px 16px 10px", flexShrink: 0 }}>
        {HS_PHASES.map((p, i) => {
          const idx = i + 1;
          const isDone = phase > idx;
          const isActive = phase === idx;
          return (
            <div
              key={p}
              style={{
                flex: 1,
                padding: "5px 0",
                textAlign: "center",
                fontSize: 7,
                fontWeight: 700,
                letterSpacing: 1.2,
                textTransform: "uppercase",
                borderRadius: 6,
                transition: "all 0.3s ease",
                color: isDone ? "#4ADE80" : isActive ? "#A78BFA" : "#374151",
                background: isDone
                  ? "rgba(34,197,94,0.06)"
                  : isActive
                  ? "rgba(139,92,246,0.12)"
                  : "rgba(255,255,255,0.015)",
              }}
            >
              {p}
            </div>
          );
        })}
      </div>

      {/* Agent cards */}
      <div style={{ display: "flex", gap: 10, padding: "0 16px 10px", flexShrink: 0 }}>
        {[
          { letter: "A", label: "Your Agent", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.2)", color: "#60A5FA" },
          { letter: "B", label: "Match Agent", bg: "rgba(236,72,153,0.12)", border: "rgba(236,72,153,0.2)", color: "#F472B6" },
        ].map((a) => (
          <div
            key={a.letter}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              background: a.bg,
              border: `1px solid ${a.border}`,
              borderRadius: 12,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: `rgba(${a.letter === "A" ? "59,130,246" : "236,72,153"},0.2)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 800,
                color: a.color,
              }}
            >
              {a.letter}
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: a.color }}>{a.label}</span>
          </div>
        ))}
      </div>

      {/* Log */}
      <div
        ref={logRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0 20px 16px",
          fontFamily: "'SF Mono', 'Fira Code', monospace",
        }}
      >
        {steps.map((s, i) => (
          <div
            key={i}
            className="fade-up"
            style={{
              fontSize: 10,
              color: agentColor[s.agent] || "#9CA3AF",
              padding: "4px 0",
              lineHeight: 1.5,
              borderBottom: "1px solid rgba(255,255,255,0.02)",
            }}
          >
            <span style={{ color: "#374151", marginRight: 8 }}>
              [{s.agent === "sys" ? "SYS" : `AGENT ${s.agent}`}]
            </span>
            {s.text}
          </div>
        ))}
        {done && (
          <div
            className="fade-up"
            style={{
              textAlign: "center",
              marginTop: 16,
              padding: "10px",
              background: "rgba(34,197,94,0.06)",
              border: "1px solid rgba(34,197,94,0.1)",
              borderRadius: 12,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1.5,
              color: "#4ADE80",
              textTransform: "uppercase",
            }}
          >
            HANDSHAKE COMPLETE &middot; 3.4 SECONDS
          </div>
        )}
      </div>
    </ScreenWrap>
  );
}

// ═══════════════════════════════════════════════════════════════
// SCREEN 7: Pre-Meeting
// ═══════════════════════════════════════════════════════════════
function PreMeetingScreen({ onNext }) {
  const { matchData } = useSession();
  return (
    <ScreenWrap k="preMeeting">
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px 24px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <HaloMark size={18} />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "4px 10px",
              borderRadius: 20,
              background: "rgba(20,184,166,0.08)",
              border: "1px solid rgba(20,184,166,0.15)",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6c0 1.5.7 2.8 1.8 3.7L8 14.5l2.7-4.8A4.48 4.48 0 0 0 12.5 6c0-2.5-2-4.5-4.5-4.5z"
                stroke="#14B8A6"
                strokeWidth="1.2"
                fill="none"
              />
              <circle cx="8" cy="6" r="1.5" fill="#14B8A6" />
            </svg>
            <span style={{ fontSize: 10, fontWeight: 600, color: "#14B8A6", letterSpacing: 0.5 }}>Safety</span>
          </div>
        </div>

        {/* Meeting card */}
        <Card
          className="fade-up"
          style={{
            background: "rgba(34,197,94,0.04)",
            border: "1px solid rgba(34,197,94,0.1)",
            marginBottom: 14,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700, color: "#4ADE80" }}>{matchData.venue}</div>
          <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{matchData.area}</div>
          <div style={{ display: "flex", gap: 12, marginTop: 8, alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#FBBF24" }}>
              {matchData.day} &middot; {matchData.time}
            </span>
            <span style={{ fontSize: 11, color: "#6B7280" }}>{matchData.duration}</span>
          </div>
        </Card>

        {/* Countdown */}
        <div className="fade-up fade-up-1" style={{ textAlign: "center", marginBottom: 14 }}>
          <span style={{ fontSize: 32, fontWeight: 300, color: "#F3F4F6" }}>In 18 hours</span>
        </div>

        {/* Compatibility ring */}
        <div className="fade-up fade-up-2" style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
          <div style={{ position: "relative", width: 56, height: 56 }}>
            <svg viewBox="0 0 56 56" width="56" height="56">
              <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(139,92,246,0.1)" strokeWidth="3" />
              <circle
                cx="28"
                cy="28"
                r="24"
                fill="none"
                stroke="#A78BFA"
                strokeWidth="3"
                strokeDasharray={`${(matchData.compatibility / 100) * 150.8} 150.8`}
                strokeLinecap="round"
                transform="rotate(-90 28 28)"
                style={{ transition: "stroke-dasharray 1.2s ease" }}
              />
            </svg>
            <span
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 800,
                color: "#A78BFA",
              }}
            >
              <AnimatedNumber value={matchData.compatibility} />%
            </span>
          </div>
          <div>
            <Label>COMPATIBILITY</Label>
            <p style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.5, marginTop: 2 }}>
              {matchData.reason}
            </p>
            <p style={{ fontSize: 10, color: "#A78BFA", lineHeight: 1.4, marginTop: 4 }}>
              {matchData.intentMatch}
            </p>
          </div>
        </div>

        {/* Conversation starter */}
        <Card className="fade-up fade-up-3" style={{ marginBottom: 14 }}>
          <Label style={{ marginBottom: 8 }}>YOUR OPENING</Label>
          <p style={{ fontSize: 14, color: "#E0E0E0", fontStyle: "italic", lineHeight: 1.6 }}>
            &ldquo;{matchData.starter}&rdquo;
          </p>
        </Card>

        {/* Privacy note */}
        <div
          className="fade-up fade-up-4"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 14,
            padding: "8px 12px",
            borderRadius: 10,
            background: "rgba(139,92,246,0.04)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6c0 1.5.7 2.8 1.8 3.7L8 14.5l2.7-4.8A4.48 4.48 0 0 0 12.5 6c0-2.5-2-4.5-4.5-4.5z"
              stroke="#8B5CF6"
              strokeWidth="1.2"
              fill="none"
            />
            <circle cx="8" cy="6" r="1.5" fill="#8B5CF6" />
          </svg>
          <span style={{ fontSize: 11, color: "#9CA3AF", lineHeight: 1.4 }}>
            Name, photo, and contact protected until you arrive
          </span>
        </div>

        {/* Safety checklist */}
        <div className="fade-up fade-up-4" style={{ marginBottom: 16 }}>
          <Label style={{ marginBottom: 8 }}>BEFORE YOU GO</Label>
          {safetyConfig.meetingChecklist.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 0",
                borderBottom: "1px solid rgba(255,255,255,0.03)",
              }}
            >
              {item.auto ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" fill="rgba(34,197,94,0.12)" stroke="#4ADE80" strokeWidth="1" />
                  <path d="M5 8l2 2 4-4" stroke="#4ADE80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    border: "1px solid rgba(107,114,128,0.4)",
                  }}
                />
              )}
              <span style={{ fontSize: 12, color: item.auto ? "#E0E0E0" : "#9CA3AF", flex: 1 }}>
                {item.label}
              </span>
              {!item.auto && (
                <span style={{ fontSize: 9, fontWeight: 600, color: "#A78BFA", textTransform: "uppercase", letterSpacing: 1 }}>
                  Set up
                </span>
              )}
            </div>
          ))}
        </div>

        <PrimaryButton onClick={onNext} color="green">
          ON MY WAY
        </PrimaryButton>
        <button
          style={{
            width: "100%",
            marginTop: 10,
            padding: "12px",
            background: "transparent",
            border: "none",
            color: "#6B7280",
            fontSize: 11,
            cursor: "pointer",
            textAlign: "center",
          }}
        >
          Share meeting details with a friend
        </button>
      </div>
    </ScreenWrap>
  );
}

// ═══════════════════════════════════════════════════════════════
// SCREEN 8: Approach (GPS)
// ═══════════════════════════════════════════════════════════════
function ApproachScreen({ onNext }) {
  const { matchData } = useSession();
  const [distance, setDistance] = useState(12);
  const [arrived, setArrived] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Simulate distance decreasing
    const interval = setInterval(() => {
      setDistance((d) => {
        if (d <= 2) return d;
        return d - 2;
      });
    }, 1000);

    const arriveTimer = setTimeout(() => {
      if (!cancelled) {
        setArrived(true);
        clearInterval(interval);
        setTimeout(() => { if (!cancelled) onNext(); }, 2000);
      }
    }, 6000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      clearTimeout(arriveTimer);
    };
  }, [onNext]);

  return (
    <ScreenWrap k="approach">
      <div style={{ flex: 1, padding: "12px 16px 24px", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: "#F3F4F6",
            }}
          >
            THE APPROACH
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6c0 1.5.7 2.8 1.8 3.7L8 14.5l2.7-4.8A4.48 4.48 0 0 0 12.5 6c0-2.5-2-4.5-4.5-4.5z"
                stroke="#4ADE80"
                strokeWidth="1.2"
                fill="none"
              />
              <circle cx="8" cy="6" r="1.5" fill="#4ADE80" />
            </svg>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ADE80", animation: "breathe 2s ease-in-out infinite" }} />
            <span style={{ fontSize: 10, fontWeight: 600, color: "#4ADE80", letterSpacing: 0.5 }}>GPS ACTIVE</span>
          </div>
        </div>

        {/* Distance */}
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 48, fontWeight: 300, color: "#F3F4F6" }}>
            {arrived ? "0" : distance}m
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#4ADE80",
              letterSpacing: 1,
              marginTop: 4,
            }}
          >
            Inside geofence
          </div>
        </div>

        {/* Geofence visualization */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg viewBox="0 0 200 200" width="200" height="200">
            {/* Geofence circle */}
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="rgba(74,222,128,0.2)"
              strokeWidth="1.5"
              strokeDasharray="6 4"
            />
            <circle cx="100" cy="100" r="40" fill="none" stroke="rgba(74,222,128,0.1)" strokeWidth="1" strokeDasharray="4 4" />
            {/* Venue */}
            <circle cx="100" cy="100" r="4" fill="rgba(74,222,128,0.4)" />
            <text x="100" y="118" textAnchor="middle" fill="#4ADE80" fontSize="8" fontWeight="600">
              {matchData.venueShort}
            </text>
            {/* Your position */}
            <circle
              cx={100 + (arrived ? 0 : (distance / 12) * 30)}
              cy={100 - (arrived ? 0 : (distance / 12) * 20)}
              r="5"
              fill="#3B82F6"
              style={{ transition: "cx 1s ease, cy 1s ease" }}
            >
              <animate attributeName="r" values="5;7;5" dur="2s" repeatCount="indefinite" />
            </circle>
            <text
              x={100 + (arrived ? 0 : (distance / 12) * 30)}
              y={100 - (arrived ? 0 : (distance / 12) * 20) - 12}
              textAnchor="middle"
              fill="#60A5FA"
              fontSize="7"
              fontWeight="600"
            >
              YOU
            </text>
          </svg>
        </div>

        {/* Arrived banner */}
        {arrived && (
          <div
            className="fade-up"
            style={{
              textAlign: "center",
              padding: "14px",
              background: "rgba(34,197,94,0.08)",
              border: "1px solid rgba(34,197,94,0.15)",
              borderRadius: 14,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: 2,
              color: "#4ADE80",
              textTransform: "uppercase",
            }}
          >
            BOTH ARRIVED
          </div>
        )}
      </div>
    </ScreenWrap>
  );
}

// ═══════════════════════════════════════════════════════════════
// SCREEN 9: Meeting
// ═══════════════════════════════════════════════════════════════
function MeetingScreen({ onNext }) {
  const { matchData } = useSession();
  const [blur, setBlur] = useState(20);

  useEffect(() => {
    // Animate blur from 20 to 0 over 2s
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
        {/* GPS OFF banner */}
        <div
          className="fade-up"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            background: "rgba(34,197,94,0.06)",
            border: "1px solid rgba(34,197,94,0.1)",
            borderRadius: 12,
            marginBottom: 12,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" fill="none" stroke="#4ADE80" strokeWidth="1.2" />
            <path d="M5 8l2 2 4-4" stroke="#4ADE80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#4ADE80", letterSpacing: 1, textTransform: "uppercase" }}>
              GPS IS OFF
            </div>
            <div style={{ fontSize: 10, color: "#9CA3AF" }}>Location sharing permanently disabled</div>
          </div>
        </div>

        <p className="fade-up fade-up-1" style={{ fontSize: 12, color: "#6B7280", textAlign: "center", marginBottom: 24 }}>
          Your agent has stepped back.
        </p>

        {/* Match photo reveal */}
        <div className="fade-up fade-up-2" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: "50%",
              border: "2px solid rgba(236,72,153,0.4)",
              background: "linear-gradient(135deg, rgba(236,72,153,0.2), rgba(139,92,246,0.2))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 44,
              color: "#F9A8D4",
              filter: `blur(${blur}px)`,
              transition: "filter 0.1s linear",
              marginBottom: 16,
            }}
          >
            {matchData.matchName[0]}
          </div>
          <span style={{ fontSize: 24, fontWeight: 800, color: "#F3F4F6" }}>{matchData.matchName}</span>
          <span style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>{matchData.matchPhoto.contextLine}</span>

          {/* Shared traits */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginTop: 16 }}>
            {matchData.sharedTraits.slice(0, 4).map((t) => (
              <span
                key={t}
                style={{
                  padding: "3px 10px",
                  borderRadius: 12,
                  fontSize: 9,
                  fontWeight: 600,
                  background: "rgba(236,72,153,0.08)",
                  color: "#F9A8D4",
                  border: "1px solid rgba(236,72,153,0.15)",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <p
          style={{
            textAlign: "center",
            fontSize: 11,
            color: "#4B5563",
            marginTop: 40,
            marginBottom: 16,
            cursor: "pointer",
          }}
        >
          Tap here if you need help
        </p>

        <PrimaryButton onClick={onNext}>MEETING OVER</PrimaryButton>
      </div>
    </ScreenWrap>
  );
}

// ═══════════════════════════════════════════════════════════════
// SCREEN 10: Post-Meeting
// ═══════════════════════════════════════════════════════════════
function PostMeetingScreen({ onRestart, userName }) {
  const { matchData } = useSession();
  const [selected, setSelected] = useState(null);
  const [showDebrief, setShowDebrief] = useState(false);

  const handleSelect = (id) => {
    setSelected(id);
    setTimeout(() => setShowDebrief(true), 600);
  };

  return (
    <ScreenWrap k="postMeeting">
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px 24px" }}>
        {/* IRIS check-in */}
        <div className="fade-up" style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "flex-start" }}>
          <IrisOrb size={28} pulse={false} />
          <div
            style={{
              background: "rgba(139,92,246,0.08)",
              border: "1px solid rgba(139,92,246,0.1)",
              borderRadius: "18px 18px 18px 4px",
              padding: "12px 16px",
              fontSize: 14,
              lineHeight: 1.6,
              color: "#E0E0E0",
            }}
          >
            How did it go with {matchData.matchName}?
          </div>
        </div>

        {/* Options */}
        {!showDebrief && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {postMeetingOptions.map((opt, i) => (
              <motion.button
                key={opt.id}
                whileTap={{ scale: 0.98 }}
                className={`fade-up fade-up-${i + 1}`}
                onClick={() => handleSelect(opt.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 16px",
                  background: selected === opt.id ? "rgba(139,92,246,0.1)" : "rgba(255,255,255,0.025)",
                  border: selected === opt.id
                    ? "1px solid rgba(139,92,246,0.3)"
                    : "1px solid rgba(139,92,246,0.08)",
                  borderRadius: 14,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: opt.id === "yes" ? "rgba(74,222,128,0.1)" : opt.id === "no" ? "rgba(239,68,68,0.1)" : "rgba(139,92,246,0.1)",
                  flexShrink: 0,
                }}>
                  {opt.icon === "check" && (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8l3.5 3.5L13 5" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {opt.icon === "x" && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 3l8 8M11 3l-8 8" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  )}
                  {opt.icon === "pause" && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <rect x="3" y="2" width="2.5" height="10" rx="1" fill="#A78BFA" />
                      <rect x="8.5" y="2" width="2.5" height="10" rx="1" fill="#A78BFA" />
                    </svg>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#F3F4F6" }}>{opt.label}</div>
                  <div style={{ fontSize: 11, color: "#6B7280", marginTop: 1 }}>{opt.sublabel}</div>
                </div>
              </motion.button>
            ))}
          </div>
        )}

        {/* Debrief */}
        {showDebrief && (
          <div className="fade-up" style={{ marginTop: 8 }}>
            <Label style={{ marginBottom: 12, fontSize: 10, letterSpacing: 2.5, color: "#A78BFA" }}>
              AGENT INTELLIGENCE REPORT
            </Label>

            {/* Debrief items */}
            {debriefItems.map((item, i) => (
              <div
                key={item.label}
                className={`fade-up fade-up-${i + 1}`}
                style={{ marginBottom: 14 }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 500 }}>{item.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#4ADE80" }}>{item.change}</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.04)", overflow: "hidden" }}>
                  <ProgressBar value={item.after} delay={i * 200} />
                </div>
              </div>
            ))}

            {/* Calibration */}
            <Label style={{ marginTop: 20, marginBottom: 10 }}>NEXT MATCH CALIBRATION</Label>
            {nextMatchCalibration.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  padding: "6px 0",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ marginTop: 1, flexShrink: 0 }}>
                  <circle cx="8" cy="8" r="7" fill="rgba(139,92,246,0.1)" stroke="#8B5CF6" strokeWidth="1" />
                  <path d="M5 8l2 2 4-4" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span style={{ fontSize: 11, color: "#9CA3AF", lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}

            <p
              style={{
                fontSize: 10,
                color: "#6B7280",
                textAlign: "center",
                marginTop: 16,
                marginBottom: 20,
                fontStyle: "italic",
              }}
            >
              IRIS is getting smarter. Each meeting refines your compatibility model.
            </p>

            <PrimaryButton onClick={onRestart}>START NEW SEARCH</PrimaryButton>
          </div>
        )}
      </div>
    </ScreenWrap>
  );
}

// --- Animated progress bar ---
function ProgressBar({ value, delay = 0 }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value * 100), delay + 300);
    return () => clearTimeout(t);
  }, [value, delay]);
  return (
    <div
      style={{
        height: "100%",
        width: `${width}%`,
        borderRadius: 2,
        background: "linear-gradient(135deg, #A78BFA, #7C3AED)",
        transition: "width 0.8s ease-out",
      }}
    />
  );
}
