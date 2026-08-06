import { Container, Section } from "@/components/layout";
import FeaturesHeader from "./FeaturesHeader";
import FeatureGrid from "./FeatureGrid";

export default function Features() {
  return (
    <Section className="border-t border-white/[0.08] py-28 sm:py-32">
      <Container className="max-w-[1200px]">
        <FeaturesHeader />
        <FeatureGrid />
      </Container>
    </Section>
  );
}
