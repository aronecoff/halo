"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError("");

    // Try dev login first (only works when ENABLE_DEV_LOGIN=true on server)
    try {
      const res = await fetch("/api/auth/dev-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (res.ok && !data.error) {
        // Dev login succeeded — try instant sign-in
        if (data.token_hash) {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: data.token_hash,
            type: "magiclink",
          });

          if (!verifyError) {
            window.location.href = "/";
            return;
          }
        }

        if (data.action_link) {
          window.location.href = data.action_link;
          return;
        }
      }
    } catch {
      // Dev login unavailable, fall through to standard flow
    }

    // Standard Supabase magic link (production path)
    const { error: magicLinkError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (magicLinkError) {
      setError(magicLinkError.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  return (
    <div
      className="min-h-[100dvh] w-full flex items-center justify-center"
      style={{ background: "#07070D" }}
    >
      <div className="w-full max-w-[430px] px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center"
        >
          {/* IRIS Orb */}
          <div className="relative w-10 h-10 mb-6">
            <div
              className="pulse-ring"
              style={{
                position: "absolute",
                inset: -4,
                borderRadius: "50%",
                border: "1.5px solid rgba(167,139,250,0.3)",
              }}
            />
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "radial-gradient(circle, #A78BFA 0%, #7C3AED 40%, #4C1D95 100%)",
                animation: "breathe 4s ease-in-out infinite",
              }}
            />
          </div>

          {/* Logo */}
          <span
            style={{
              fontSize: 52,
              fontWeight: 900,
              letterSpacing: 14,
              background: "linear-gradient(135deg,#A78BFA,#7C3AED,#6D28D9)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              lineHeight: 1.1,
            }}
          >
            HALO
          </span>

          <div
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

          {sent ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-10 text-center"
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "rgba(34,197,94,0.1)",
                  border: "1px solid rgba(34,197,94,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8l3.5 3.5L13 5" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p style={{ fontSize: 16, fontWeight: 600, color: "#F3F4F6" }}>Check your email</p>
              <p style={{ fontSize: 13, color: "#6B7280", marginTop: 8, lineHeight: 1.5 }}>
                We sent a magic link to <span style={{ color: "#A78BFA" }}>{email}</span>.
                <br />Tap it to sign in.
              </p>
              <button
                onClick={() => { setSent(false); setEmail(""); }}
                style={{
                  marginTop: 20,
                  fontSize: 12,
                  color: "#6B7280",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Use a different email
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleLogin} className="w-full mt-10">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                autoComplete="email"
                autoFocus
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
                }}
                onFocus={(e) => { e.target.style.borderColor = "rgba(139,92,246,0.5)"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(139,92,246,0.2)"; }}
              />
              {error && (
                <p style={{ fontSize: 12, color: "#EF4444", textAlign: "center", marginTop: 8 }}>
                  {error}
                </p>
              )}
              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading || !email.trim()}
                style={{
                  width: "100%",
                  height: 52,
                  borderRadius: 14,
                  border: "none",
                  background: "linear-gradient(135deg, #A78BFA, #7C3AED, #6D28D9)",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  cursor: loading ? "wait" : "pointer",
                  marginTop: 12,
                  opacity: !email.trim() ? 0.4 : 1,
                }}
              >
                {loading ? "SENDING..." : "SIGN IN WITH MAGIC LINK"}
              </motion.button>
              <p style={{ fontSize: 10, color: "#374151", textAlign: "center", marginTop: 16, lineHeight: 1.5 }}>
                No password needed. We will send you a secure link.
              </p>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
