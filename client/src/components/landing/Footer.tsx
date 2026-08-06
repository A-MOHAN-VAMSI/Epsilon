import { Container } from "@/components/layout";
import BackToTopButton from "./BackToTopButton";
import FooterLinkGroup from "./FooterLinkGroup";
import SocialLinks from "./SocialLinks";
import { footerLinkGroups, socialLinks } from "./footerData";

export default function Footer() {
  return (
    <footer className="mt-8 border-t border-white/[0.08] bg-[#050816] md:mt-12">
      <Container className="max-w-[1200px] py-32">
        <div className="grid gap-12 lg:grid-cols-[1.35fr_2fr] lg:gap-20">
          <div className="max-w-xs">
            <a href="#" className="text-xl font-semibold tracking-[-0.04em] text-white">
              EPSILON<span className="text-[#C8FF3D]">.</span>
            </a>
            <p className="mt-4 text-sm leading-6 text-white/50">
              The collaborative workspace where teams build better software together.
            </p>
            <div className="mt-6">
              <SocialLinks links={socialLinks} />
            </div>
          </div>

          <nav className="grid grid-cols-2 gap-8 sm:grid-cols-3" aria-label="Footer navigation">
            {footerLinkGroups.map((group) => (
              <FooterLinkGroup key={group.title} group={group} />
            ))}
          </nav>
        </div>

        <div className="mt-16 flex flex-col gap-5 border-t border-white/[0.08] pt-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-white/40">© 2026 EPSILON. All rights reserved.</p>
          <BackToTopButton />
        </div>
      </Container>
    </footer>
  );
}
