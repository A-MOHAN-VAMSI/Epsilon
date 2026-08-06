export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterLinkGroupData {
  title: string;
  links: FooterLink[];
}

export interface SocialLink extends FooterLink {
  icon: "github" | "linkedin" | "x";
}

export const footerLinkGroups: FooterLinkGroupData[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Changelog", href: "#" },
    ],
  },
  {
    title: "Documentation",
    links: [
      { label: "Getting started", href: "#" },
      { label: "Guides", href: "#" },
      { label: "API reference", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Contact", href: "mailto:hello@epsilon.dev" },
      { label: "Privacy", href: "#" },
    ],
  },
];

export const socialLinks: SocialLink[] = [
  { label: "GitHub", href: "#", icon: "github" },
  { label: "LinkedIn", href: "#", icon: "linkedin" },
  { label: "X", href: "#", icon: "x" },
];
