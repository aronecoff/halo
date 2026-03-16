"use client";

interface ChatMessage {
  sender: "iris" | "user" | "system";
  text: string;
  isInferenceCallout?: boolean;
}

interface ChatBubbleProps {
  msg: ChatMessage;
}

export function ChatBubble({ msg }: ChatBubbleProps) {
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

export default ChatBubble;
