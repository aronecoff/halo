"use client";

import { useState, useEffect } from "react";

interface ProgressBarProps {
  value: number;
  delay?: number;
}

export function ProgressBar({ value, delay = 0 }: ProgressBarProps) {
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

export default ProgressBar;
