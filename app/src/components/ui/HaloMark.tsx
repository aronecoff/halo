"use client";

interface HaloMarkProps {
  size?: number;
}

export function HaloMark({ size = 52 }: HaloMarkProps) {
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

export default HaloMark;
