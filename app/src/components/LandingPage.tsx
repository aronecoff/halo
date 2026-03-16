"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LandingPageProps {
  onGetStarted: (name: string) => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const [name, setName] = useState("");
  const [showInput, setShowInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showInput]);

  const handleSubmit = () => {
    if (name.trim()) onGetStarted(name.trim());
  };

  return (
    <div style={{ minHeight: "100dvh", background: "#0A0A0F", color: "#F3F4F6", overflowX: "hidden" }}>
      {/* Nav */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "20px 24px",
        background: "rgba(10,10,15,0.8)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "radial-gradient(circle, #A78BFA 0%, #7C3AED 50%, #4C1D95 100%)",
            boxShadow: "0 0 20px rgba(124,58,237,0.3)",
          }} />
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: 4, color: "#A78BFA" }}>HALO</span>
        </div>
        <button
          onClick={() => setShowInput(true)}
          style={{
            padding: "8px 20px", borderRadius: 8, border: "1px solid rgba(139,92,246,0.3)",
            background: "rgba(139,92,246,0.08)", color: "#A78BFA", fontSize: 13,
            fontWeight: 600, cursor: "pointer", letterSpacing: 0.5,
          }}
        >
          Get Started
        </button>
      </nav>

      {/* Hero */}
      <section style={{
        minHeight: "100dvh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", padding: "120px 24px 80px",
        background: "radial-gradient(ellipse at 50% 20%, rgba(124,58,237,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 60%, rgba(96,165,250,0.06) 0%, transparent 50%)",
        textAlign: "center", position: "relative",
      }}>
        {/* Orb */}
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          style={{
            width: 80, height: 80, borderRadius: "50%", marginBottom: 40,
            background: "radial-gradient(circle, rgba(167,139,250,0.6) 0%, rgba(124,58,237,0.4) 40%, rgba(76,29,149,0.2) 70%, transparent 100%)",
            boxShadow: "0 0 60px rgba(124,58,237,0.3), 0 0 120px rgba(124,58,237,0.1)",
          }}
        />

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{
            fontSize: "clamp(40px, 8vw, 72px)", fontWeight: 300, letterSpacing: "-0.02em",
            lineHeight: 1.1, maxWidth: 700, marginBottom: 24,
          }}
        >
          Meet people{" "}
          <span style={{
            background: "linear-gradient(135deg, #A78BFA, #7C3AED, #6366F1)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            worth meeting
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          style={{
            fontSize: "clamp(16px, 2.5vw, 20px)", fontWeight: 300, color: "#9CA3AF",
            maxWidth: 520, lineHeight: 1.7, marginBottom: 48,
          }}
        >
          An AI agent that actually learns who you are, finds compatible people nearby,
          and sets up a real-world meeting. No swiping. No browsing. You just show up.
        </motion.p>

        <AnimatePresence mode="wait">
          {!showInput ? (
            <motion.button
              key="cta"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              onClick={() => setShowInput(true)}
              style={{
                padding: "16px 48px", borderRadius: 14, border: "none",
                background: "linear-gradient(135deg, #A78BFA, #7C3AED)",
                color: "#fff", fontSize: 16, fontWeight: 600, cursor: "pointer",
                letterSpacing: 1, textTransform: "uppercase",
                boxShadow: "0 4px 30px rgba(124,58,237,0.4)",
              }}
            >
              Activate Your Agent
            </motion.button>
          ) : (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 360 }}
            >
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
                placeholder="Your first name"
                style={{
                  width: "100%", height: 52, borderRadius: 14,
                  border: "1px solid rgba(139,92,246,0.3)",
                  background: "rgba(139,92,246,0.06)", color: "#F3F4F6",
                  fontSize: 16, fontWeight: 500, textAlign: "center",
                  letterSpacing: 0.5, outline: "none",
                }}
              />
              <button
                onClick={handleSubmit}
                disabled={!name.trim()}
                style={{
                  width: "100%", height: 52, borderRadius: 14, border: "none",
                  background: name.trim()
                    ? "linear-gradient(135deg, #A78BFA, #7C3AED)"
                    : "rgba(139,92,246,0.15)",
                  color: name.trim() ? "#fff" : "#6B7280",
                  fontSize: 15, fontWeight: 600, cursor: name.trim() ? "pointer" : "default",
                  letterSpacing: 1, textTransform: "uppercase",
                  boxShadow: name.trim() ? "0 4px 30px rgba(124,58,237,0.4)" : "none",
                  transition: "all 0.3s ease",
                }}
              >
                Begin
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* How it works */}
      <section style={{
        padding: "100px 24px", maxWidth: 900, margin: "0 auto",
        borderTop: "1px solid rgba(255,255,255,0.04)",
      }}>
        <h2 style={{
          fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 300, textAlign: "center",
          marginBottom: 64, letterSpacing: "-0.01em",
        }}>
          How <span style={{ color: "#A78BFA" }}>HALO</span> works
        </h2>

        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 32,
        }}>
          {[
            {
              num: "01",
              title: "Your agent learns you",
              desc: "IRIS, your AI agent, has a short conversation with you. Not a quiz. A real conversation that maps how you think, connect, and communicate.",
              color: "#A78BFA",
            },
            {
              num: "02",
              title: "It finds your person",
              desc: "IRIS scans every active user, runs compatibility analysis across personality, values, intent, and communication style. No browsing. No swiping.",
              color: "#60A5FA",
            },
            {
              num: "03",
              title: "You just show up",
              desc: "When IRIS finds a high-compatibility match, it negotiates a time and place. You get a meeting. Public venue, safety verified, conversation starter ready.",
              color: "#4ADE80",
            },
          ].map((step) => (
            <div key={step.num} style={{
              padding: 28, borderRadius: 16,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.04)",
            }}>
              <div style={{
                fontSize: 11, fontWeight: 700, letterSpacing: 2, color: step.color,
                marginBottom: 16,
              }}>
                {step.num}
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10, color: "#F3F4F6" }}>
                {step.title}
              </h3>
              <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7 }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* What makes HALO different */}
      <section style={{
        padding: "80px 24px 100px", maxWidth: 700, margin: "0 auto",
        borderTop: "1px solid rgba(255,255,255,0.04)",
      }}>
        <h2 style={{
          fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 300, textAlign: "center",
          marginBottom: 48, letterSpacing: "-0.01em",
        }}>
          No profiles. No swiping.<br />
          <span style={{ color: "#A78BFA" }}>Just connection.</span>
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {[
            { text: "You never see a list of people to pick from", icon: "×" },
            { text: "Your agent negotiates everything — venue, time, safety", icon: "→" },
            { text: "Identity stays private until you both arrive", icon: "◉" },
            { text: "Every meeting is in a public, verified location", icon: "✓" },
            { text: "IRIS gets smarter with every interaction", icon: "∞" },
          ].map((item, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 16, padding: "16px 20px",
              borderRadius: 12, background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.04)",
            }}>
              <span style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(139,92,246,0.1)", color: "#A78BFA",
                fontSize: 14, fontWeight: 600,
              }}>
                {item.icon}
              </span>
              <span style={{ fontSize: 15, color: "#D1D5DB", fontWeight: 400 }}>{item.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section style={{
        padding: "80px 24px 120px", textAlign: "center",
        borderTop: "1px solid rgba(255,255,255,0.04)",
        background: "radial-gradient(ellipse at 50% 80%, rgba(124,58,237,0.08) 0%, transparent 60%)",
      }}>
        <h2 style={{
          fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 300, marginBottom: 20,
          letterSpacing: "-0.02em",
        }}>
          Ready to meet someone{" "}
          <span style={{ color: "#A78BFA" }}>real</span>?
        </h2>
        <p style={{ fontSize: 16, color: "#6B7280", marginBottom: 40, maxWidth: 400, margin: "0 auto 40px" }}>
          One conversation with IRIS. That is all it takes.
        </p>
        <button
          onClick={() => {
            setShowInput(true);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          style={{
            padding: "16px 48px", borderRadius: 14, border: "none",
            background: "linear-gradient(135deg, #A78BFA, #7C3AED)",
            color: "#fff", fontSize: 16, fontWeight: 600, cursor: "pointer",
            letterSpacing: 1, textTransform: "uppercase",
            boxShadow: "0 4px 30px rgba(124,58,237,0.4)",
          }}
        >
          Get Started
        </button>
      </section>

      {/* Footer */}
      <footer style={{
        padding: "24px", textAlign: "center",
        borderTop: "1px solid rgba(255,255,255,0.04)",
      }}>
        <span style={{ fontSize: 11, color: "#4B5563", letterSpacing: 1 }}>
          HALO · San Francisco · 2026
        </span>
      </footer>
    </div>
  );
}
