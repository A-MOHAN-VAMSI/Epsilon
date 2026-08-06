import { Container, Section } from "@/components/layout";
import TestimonialGrid from "./TestimonialGrid";

export default function Testimonials() {
  return (
    <Section className="relative overflow-hidden py-32">
      {/* Background glow — right side to balance the left glow from WhyEpsilon */}
      <div
        className="
          pointer-events-none
          absolute
          right-0
          top-1/2
          -z-10
          h-[600px]
          w-[600px]
          -translate-y-1/2
          translate-x-1/3
          rounded-full
          bg-[radial-gradient(circle,rgba(200,255,61,0.07),transparent_70%)]
          blur-3xl
        "
        aria-hidden="true"
      />

      <Container className="max-w-[1200px]">
        {/* Section header */}
        <div className="mx-auto max-w-xl text-center">
          <span className="text-xs uppercase tracking-[0.3em] text-[#C8FF3D] sm:text-sm">
            Testimonials
          </span>

          <h2 className="mt-5 text-2xl font-semibold leading-tight tracking-[-0.03em] sm:text-3xl lg:text-4xl">
            Trusted by real teams
          </h2>

          <p className="mt-8 text-base leading-7 text-white/70 sm:text-lg sm:leading-8">
            Developers and engineering managers worldwide rely on EPSILON to
            write, review, and ship code together — every single day.
          </p>
        </div>

        {/* Cards */}
        <TestimonialGrid />
      </Container>
    </Section>
  );
}
