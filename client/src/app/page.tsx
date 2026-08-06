import { Footer, Hero, Features, WhyEpsilon, Testimonials, Faq, Pricing } from "@/components/landing";
import { Navbar } from "@/components/layout";

export default function Home() {
  return (
    <>
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
