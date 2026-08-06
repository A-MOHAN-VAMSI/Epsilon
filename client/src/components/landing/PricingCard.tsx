"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Minus } from "lucide-react";
import { PricingPlan } from "./pricingData";

interface Props {
  plan: PricingPlan;
  index: number;
}

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

export default function PricingCard({ plan, index }: Props) {
  const { name, price, period, description, cta, href, highlighted, badge, features } = plan;

  return (
    <motion.div
      initial={{ opacity: 0, y: 48 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay: index * 0.13, duration: 0.6, ease: EASE }}
      className={`
        group
        relative
        flex
        flex-col
        rounded-3xl
        border
        h-full
        p-8
        transition-all
        duration-300
        ${highlighted
          ? /* Pro card — always-on lime border & surface, extra glow on hover */
            "border-[#C8FF3D]/40 bg-[#C8FF3D]/[0.05] hover:-translate-y-2 hover:shadow-[0_32px_80px_rgba(200,255,61,0.12)]"
          : /* Free / Enterprise cards — subtle until hovered */
            "border-white/10 bg-white/5 hover:-translate-y-2 hover:border-[#C8FF3D]/30 hover:bg-white/[0.07] hover:shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
        }
      `}
    >
      {/* ── Inset radial glow (always visible on Pro, reveal-on-hover elsewhere) ── */}
      <div
        className={`
          pointer-events-none
          absolute
          inset-0
          rounded-3xl
          transition-opacity
          duration-500
          bg-[radial-gradient(ellipse_at_top_left,rgba(200,255,61,0.08),transparent_65%)]
          ${highlighted ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
        `}
        aria-hidden="true"
      />

      {/* ── Badge ── */}
      {badge && (
        <span className="
          mb-6
          inline-block
          self-start
          rounded-full
          border
          border-[#C8FF3D]/30
          bg-[#C8FF3D]/10
          px-3
          py-1
          text-xs
          font-semibold
          tracking-wide
          text-[#C8FF3D]
        ">
          {badge}
        </span>
      )}

      {/* ── Plan name ── */}
      <h3 className="text-base font-semibold text-white">
        {name}
      </h3>

      {/* ── Price ── */}
      <div className="mt-5 flex items-end gap-2">
        <span className={`
          text-5xl
          font-semibold
          tracking-[-0.04em]
          leading-none
          transition-colors
          duration-300
          ${highlighted ? "text-[#C8FF3D]" : "text-white group-hover:text-[#C8FF3D]"}
        `}>
          {price}
        </span>
        <span className="mb-1 text-sm text-white/40">{period}</span>
      </div>

      {/* ── Description ── */}
      <p className="mt-5 text-sm leading-6 text-white/55">
        {description}
      </p>

      {/* ── Divider ── */}
      <div
        className={`
          my-8
          h-px
          w-full
          transition-colors
          duration-300
          ${highlighted
            ? "bg-[#C8FF3D]/20 group-hover:bg-[#C8FF3D]/35"
            : "bg-white/[0.07] group-hover:bg-[#C8FF3D]/15"}
        `}
        aria-hidden="true"
      />

      {/* ── Feature list ── */}
      <ul className="flex grow flex-col gap-3.5" role="list" aria-label={`${name} plan features`}>
        {features.map((feature) => (
          <li key={feature.label} className="flex items-center gap-3">
            {feature.included ? (
              <span
                className="
                  flex
                  h-5
                  w-5
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-[#C8FF3D]/15
                  transition-colors
                  duration-300
                  group-hover:bg-[#C8FF3D]/25
                "
                aria-hidden="true"
              >
                <Check className="h-3 w-3 text-[#C8FF3D]" strokeWidth={2.5} />
              </span>
            ) : (
              <span
                className="
                  flex
                  h-5
                  w-5
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-white/5
                "
                aria-hidden="true"
              >
                <Minus className="h-3 w-3 text-white/20" strokeWidth={2} />
              </span>
            )}
            <span className={`text-sm transition-colors duration-300 ${feature.included ? "text-white/80" : "text-white/30"}`}>
              {feature.label}
            </span>
          </li>
        ))}
      </ul>

      {/* ── CTA button ── */}
      <Link
        href={href}
        className={`
          mt-9
          inline-flex
          w-full
          items-center
          justify-center
          rounded-full
          px-6
          py-3.5
          text-sm
          font-semibold
          transition-all
          duration-300
          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-[#C8FF3D]/60
          focus-visible:ring-offset-2
          focus-visible:ring-offset-[#050816]
          ${highlighted
            ? /* Solid lime — primary CTA */
              "bg-[#C8FF3D] text-black hover:-translate-y-0.5 hover:shadow-[0_0_32px_rgba(200,255,61,0.40)]"
            : /* Ghost — secondary CTA */
              "border border-white/10 text-white hover:border-[#C8FF3D]/40 hover:bg-[#C8FF3D]/[0.06]"}
        `}
        aria-label={`${cta} — ${name} plan`}
      >
        {cta}
      </Link>
    </motion.div>
  );
}
