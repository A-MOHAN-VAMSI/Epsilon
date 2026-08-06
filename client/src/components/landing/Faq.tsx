import { Container, Section } from "@/components/layout";
import FaqAccordion from "./FaqAccordion";

export default function Faq() {
  return (
    <Section className="relative overflow-hidden py-32">
      {/* Background glow — centred, slightly left to alternate with the testimonials glow */}
      <div
        className="
          pointer-events-none
          absolute
          left-1/2
          top-1/2
          -z-10
          h-[700px]
          w-[700px]
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          bg-[radial-gradient(circle,rgba(200,255,61,0.06),transparent_70%)]
          blur-3xl
        "
        aria-hidden="true"
      />

      <Container className="max-w-[1200px]">
        {/* Section header */}
        <div className="mx-auto max-w-xl text-center">
          <span className="text-xs uppercase tracking-[0.3em] text-[#C8FF3D] sm:text-sm">
            FAQ
          </span>

          <h2 className="mt-5 text-2xl font-semibold leading-tight tracking-[-0.03em] sm:text-3xl lg:text-4xl">
            Questions &amp; Answers
          </h2>

          <p className="mt-8 text-base leading-7 text-white/70 sm:text-lg sm:leading-8">
            Everything you need to know before you start building with EPSILON.
            Still have a question?{" "}
            <a
              href="mailto:hello@epsilon.dev"
              className="text-[#C8FF3D]/80 underline underline-offset-4 transition-colors duration-200 hover:text-[#C8FF3D]"
            >
              Reach out anytime.
            </a>
          </p>
        </div>

        {/* Accordion */}
        <div className="mx-auto mt-12 max-w-3xl sm:mt-16">
          <FaqAccordion />
        </div>
      </Container>
    </Section>
  );
}
