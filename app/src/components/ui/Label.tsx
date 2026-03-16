"use client";

import { type CSSProperties, type ReactNode } from "react";

interface LabelProps {
  children: ReactNode;
  style?: CSSProperties;
}

export function Label({ children, style: sx = {} }: LabelProps) {
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

export default Label;
