"use client";

import { useState, useEffect, type CSSProperties } from "react";

interface AnimatedNumberProps {
  value: number | string;
  duration?: number;
  style?: CSSProperties;
}

export function AnimatedNumber({ value, duration = 1200, style: sx = {} }: AnimatedNumberProps) {
  const [display, setDisplay] = useState<number | string>(0);
  useEffect(() => {
    let start: number | null = null;
    const target = typeof value === "string" ? parseInt(value.replace(/,/g, ""), 10) : value;
    if (isNaN(target)) { setDisplay(value); return; }
    function step(ts: number) {
      if (!start) start = ts;
      const p = Math.min((ts - start!) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(eased * target));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [value, duration]);
  return <span style={sx}>{typeof value === "string" && value.includes(",") ? display.toLocaleString() : display}</span>;
}

export default AnimatedNumber;
