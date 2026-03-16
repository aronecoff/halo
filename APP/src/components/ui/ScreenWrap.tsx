"use client";

import { motion } from "framer-motion";
import { type ReactNode } from "react";

interface ScreenWrapProps {
  children: ReactNode;
  k: string;
}

const screenVariants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

export function ScreenWrap({ children, k }: ScreenWrapProps) {
  return (
    <motion.div
      key={k}
      variants={screenVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ height: "100%", display: "flex", flexDirection: "column" }}
    >
      {children}
    </motion.div>
  );
}

export default ScreenWrap;
