"use client";

import { type CSSProperties, type ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}

export function Card({ children, style: sx = {}, className = "" }: CardProps) {
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

export default Card;
