"use client";

interface IrisOrbProps {
  size?: number;
  pulse?: boolean;
}

export function IrisOrb({ size = 40, pulse = true }: IrisOrbProps) {
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

export default IrisOrb;
