import { Container, Section } from "@/components/layout";
import PricingGrid from "./PricingGrid";

export default function Pricing() {
  return (
    <Section className="relative overflow-hidden py-32">
      {/* Background glow — left-leaning to alternate with the FAQ centred glow */}
      <div
        className="
          pointer-events-none
          absolute
          left-1/4
          top-1/2
          -z-10
          h-[700px]
          w-[700px]
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          bg-[radial-gradient(circle,rgba(200,255,61,0.07),transparent_70%)]
          blur-3xl
        "
        aria-hidden="true"
      />

      <Container className="max-w-[1200px]">
        {/* Section header — mirrors FeaturesHeader structure exactly */}
        <div className="mx-auto max-w-xl text-center">
          <span className="text-xs uppercase tracking-[0.3em] text-[#C8FF3D] sm:text-sm">
            Pricing
          </span>

          <h2 className="mt-5 text-2xl font-semibold leading-tight tracking-[-0.03em] sm:text-3xl lg:text-4xl">
            Simple, transparent pricing
          </h2>

          <p className="mt-8 text-base leading-7 text-white/70 sm:text-lg sm:leading-8">
            Start for free with no credit card required. Upgrade whenever your
            team is ready to scale.
          </p>
        </div>

        {/* Cards */}
        <PricingGrid />
      </Container>
    </Section>
  );
}
