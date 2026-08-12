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
    <Section className="epsilon-hero relative overflow-hidden pb-20 pt-40 sm:pb-24 sm:pt-44">
      <BackgroundGrid />

      <Container className="relative z-10">
        <div className="mx-auto max-w-[1520px]">

          <div className="epsilon-hero-content">
            <HeroContent />
          </div>

          <div className="epsilon-hero-buttons">
            <HeroButtons />
          </div>

          <div className="epsilon-hero-editor">
            <EditorPreview />
          </div>

        </div>
      </Container>
    </Section>
  );
}
