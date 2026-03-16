"use client";

export function TypingIndicator() {
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

export default TypingIndicator;
