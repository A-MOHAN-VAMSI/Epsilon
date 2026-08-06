import {
  BackgroundGrid,
  EditorPreview,
  HeroButtons,
  HeroContent,
} from "@/components/landing";
import {
  Container,
  Section,
} from "@/components/layout";

export default function Hero() {
  return (
    <Section className="relative overflow-hidden pb-20 pt-40 sm:pb-24 sm:pt-44">
      <BackgroundGrid />
      <Container className="relative z-10">
        <div className="mx-auto max-w-[1520px]">
          <HeroContent />

          <HeroButtons />

          <EditorPreview />
        </div>
      </Container>
    </Section>
  );
}
