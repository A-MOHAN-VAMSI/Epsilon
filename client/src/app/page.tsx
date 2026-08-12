import { Footer, Hero, Features, WhyEpsilon, Testimonials, Faq, Pricing } from "@/components/landing";
import { Navbar } from "@/components/layout";
import EpsilonBootSequence from "@/components/landing/EpsilonBootSequence";

export default function Home() {
  return (
    <>
      <EpsilonBootSequence />
      <Navbar />
      <Hero />
      <Features />
      <WhyEpsilon />
      <Testimonials />
      <Faq />
      <Pricing />
      <Footer />
      
    </>
  );
}
