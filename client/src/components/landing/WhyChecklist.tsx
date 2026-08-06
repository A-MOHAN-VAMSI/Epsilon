"use client";

import { motion } from "framer-motion";
import { Brain, CloudCog, Globe, ShieldCheck, Users, Zap } from "lucide-react";
import { Reason } from "./reasons";

interface Props {
  reasons: Reason[];
}

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

const icons = {
  users: Users,
  zap: Zap,
  globe: Globe,
  cloud: CloudCog,
  brain: Brain,
  shield: ShieldCheck,
};

export default function WhyChecklist({ reasons }: Props) {
  return (
    <ul
      className="flex flex-col gap-4 lg:gap-5"
      role="list"
      aria-label="Reasons to choose EPSILON"
    >
      {reasons.map((reason, i) => {
        const Icon = icons[reason.icon];

        return (
          <motion.li
            key={reason.id}
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{
              delay: i * 0.1 + 0.2,
              duration: 0.5,
              ease: EASE,
            }}
            className="
              group
              flex
              items-start
              gap-4
              rounded-2xl
              border
              border-white/[0.06]
              bg-white/[0.03]
              p-8
              transition-all
              duration-300
              hover:border-[#C8FF3D]/30
              hover:bg-[#C8FF3D]/[0.04]
              cursor-default
            "
          >
            {/* Icon badge */}
            <div
              className="
                mt-0.5
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-[#C8FF3D]/10
                transition-colors
                duration-300
                group-hover:bg-[#C8FF3D]/20
              "
              aria-hidden="true"
            >
              <Icon
                className="
                  h-5
                  w-5
                  text-[#C8FF3D]
                  transition-transform
                  duration-300
                  group-hover:scale-110
                "
              />
            </div>

            {/* Text */}
            <div className="min-w-0">
              <p className="text-[0.9375rem] font-semibold leading-snug text-white sm:text-base">
                {reason.label}
              </p>
              <p className="mt-2 text-sm leading-6 text-white/55 transition-colors duration-300 group-hover:text-white/70">
                {reason.description}
              </p>
            </div>
          </motion.li>
        );
      })}
    </ul>
  );
}
