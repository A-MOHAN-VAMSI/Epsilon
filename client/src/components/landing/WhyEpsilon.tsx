import { Container, Section } from "@/components/layout";
import WhyContent from "./WhyContent";
import WhyChecklist from "./WhyChecklist";
import { reasons } from "./reasons";

export default function WhyEpsilon() {
  return (
    <Section className="relative overflow-hidden py-32">
      {/* Subtle background glow — matches the design language of the Hero section */}
      <div
        className="
          pointer-events-none
          absolute
          left-0
          top-1/2
          -z-10
          h-[600px]
          w-[600px]
          -translate-y-1/2
          rounded-full
          bg-[radial-gradient(circle,rgba(200,255,61,0.07),transparent_70%)]
          blur-3xl
        "
        aria-hidden="true"
      />

      <Container className="max-w-[1200px]">
        <div
          className="
            grid
            grid-cols-1
            items-start
            gap-12
            md:gap-16
            lg:grid-cols-2
            lg:gap-28
          "
        >
          {/* Left column — label, heading, description */}
          <WhyContent />

          {/* Right column — animated checklist of reasons */}
          <WhyChecklist reasons={reasons} />
        </div>
      </Container>
    </Section>
  );
}
