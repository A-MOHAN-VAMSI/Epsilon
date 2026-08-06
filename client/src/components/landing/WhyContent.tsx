"use client";

import { motion } from "framer-motion";

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

function fadeUp(delay: number) {
  return {
    initial: { opacity: 0, y: 32 },
    whileInView: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.65, ease: EASE },
    viewport: { once: true, margin: "-80px" },
  } as const;
}

export default function WhyContent() {
  return (
    <div className="flex flex-col justify-center">
      {/* Section label */}
      <motion.span
        {...fadeUp(0)}
        className="text-xs uppercase tracking-[0.3em] text-[#C8FF3D] sm:text-sm"
        aria-label="Section: Why EPSILON"
      >
        Why EPSILON
      </motion.span>

      {/* Heading */}
      <motion.h2
        {...fadeUp(0.1)}
        className="
          mt-5
          text-2xl
          font-semibold
          leading-[1.1]
          tracking-[-0.03em]
          sm:text-3xl
          lg:text-4xl
        "
      >
        The editor that gets{" "}
        <span className="text-[#C8FF3D]">out of your way</span>
      </motion.h2>

      {/* Description */}
      <motion.p
        {...fadeUp(0.2)}
        className="mt-8 max-w-lg text-base leading-7 text-white/60 sm:text-[1.0625rem] sm:leading-8"
      >
        EPSILON is built from the ground up for teams who need speed, clarity,
        and real collaboration — not just another code editor with a chat box
        bolted on.
      </motion.p>

      {/* Decorative accent line */}
      <motion.div
        {...fadeUp(0.3)}
        className="mt-9 h-px w-16 bg-[#C8FF3D]/40"
        aria-hidden="true"
      />
    </div>
  );
}
