"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Testimonial } from "./testimonialData";

interface Props {
  testimonial: Testimonial;
  index: number;
}

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

export default function TestimonialCard({ testimonial, index }: Props) {
  const { name, role, company, rating, quote, initials, avatarHue } =
    testimonial;

  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay: index * 0.12, duration: 0.6, ease: EASE }}
      aria-label={`Testimonial from ${name}`}
      className="
        group
        relative
        flex
        flex-col
        rounded-3xl
        border
        border-white/10
        bg-white/5
        h-full
        p-8
        transition-all
        duration-300
        hover:-translate-y-2
        hover:border-[#C8FF3D]/30
        hover:bg-white/[0.07]
        hover:shadow-[0_24px_60px_rgba(0,0,0,0.45)]
      "
    >
      {/* Subtle lime glow that appears on hover */}
      <div
        className="
          pointer-events-none
          absolute
          inset-0
          rounded-3xl
          opacity-0
          transition-opacity
          duration-500
          group-hover:opacity-100
          bg-[radial-gradient(ellipse_at_top_left,rgba(200,255,61,0.05),transparent_65%)]
        "
        aria-hidden="true"
      />

      {/* Quote mark */}
      <span
        className="
          mb-6
          block
          select-none
          font-serif
          text-[4rem]
          leading-none
          text-[#C8FF3D]/20
          transition-colors
          duration-300
          group-hover:text-[#C8FF3D]/35
        "
        aria-hidden="true"
      >
        &ldquo;
      </span>

      {/* Star rating */}
      <div className="mb-6 flex items-center gap-1" aria-label={`${rating} out of 5 stars`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`
              h-4 w-4
              transition-colors duration-300
              ${i < rating
                ? "fill-[#C8FF3D] text-[#C8FF3D]"
                : "fill-white/10 text-white/10"}
            `}
            aria-hidden="true"
          />
        ))}
      </div>

      {/* Quote text */}
      <blockquote className="grow text-[1rem] leading-7 text-white/70 transition-colors duration-300 group-hover:text-white/85">
        {quote}
      </blockquote>

      {/* Divider */}
      <div
        className="my-8 h-px w-full bg-white/[0.07] transition-colors duration-300 group-hover:bg-[#C8FF3D]/15"
        aria-hidden="true"
      />

      {/* Author */}
      <footer className="flex items-center gap-4">
        {/* Avatar placeholder */}
        <div
          className="
            flex
            h-11
            w-11
            shrink-0
            items-center
            justify-center
            rounded-full
            text-sm
            font-semibold
            text-white
            ring-2
            ring-white/10
            transition-all
            duration-300
            group-hover:ring-[#C8FF3D]/30
            select-none
          "
          style={{
            background: `hsl(${avatarHue} 55% 28%)`,
          }}
          aria-hidden="true"
        >
          {initials}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{name}</p>
          <p className="truncate text-xs text-white/50">
            {role}
            <span className="mx-1.5 text-white/25">·</span>
            {company}
          </p>
        </div>
      </footer>
    </motion.article>
  );
}
