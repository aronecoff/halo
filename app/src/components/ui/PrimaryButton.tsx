"use client";

import { motion } from "framer-motion";
import { type CSSProperties, type ReactNode } from "react";

interface PrimaryButtonProps {
  children: ReactNode;
  onClick?: () => void;
  color?: "purple" | "green";
  style?: CSSProperties;
}

const bgs: Record<string, string> = {
  purple: "linear-gradient(135deg, #A78BFA, #7C3AED, #6D28D9)",
  green: "linear-gradient(135deg, #4ADE80, #16A34A)",
};

export function PrimaryButton({ children, onClick, color = "purple", style: sx = {} }: PrimaryButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.1 }}
      onClick={onClick}
      style={{
        width: "100%",
        height: 52,
        borderRadius: 14,
        border: "none",
        background: bgs[color] || bgs.purple,
        color: "#fff",
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: 1.5,
        textTransform: "uppercase",
        cursor: "pointer",
        ...sx,
      }}
    >
      {children}
    </motion.button>
  );
}

export default PrimaryButton;
