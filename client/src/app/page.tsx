import {
  Footer,
  Hero,
  Features,
  WhyEpsilon,
  Testimonials,
  Faq,
  Pricing,
} from "@/components/landing";

import { Navbar } from "@/components/layout";

import EpsilonBootSequence from "@/components/landing/EpsilonBootSequence";

export default function Home() {
  return (
    <>
      <EpsilonBootSequence />

      <div className="epsilon-page">
        <Navbar />

        <main>
          <Hero />
          <Features />
          <WhyEpsilon />
          <Testimonials />
          <Faq />
          <Pricing />
        </main>

        <Footer />
      </div>
    </>
  );
}