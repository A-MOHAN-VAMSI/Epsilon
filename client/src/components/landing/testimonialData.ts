export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  rating: number;
  quote: string;
  /** Initials shown inside the avatar placeholder */
  initials: string;
  /** Hue (0–360) used to tint each avatar uniquely without breaking the palette */
  avatarHue: number;
}

export const testimonials: Testimonial[] = [
  {
    id: "testimonial-sara",
    name: "Sara Mitchell",
    role: "Senior Frontend Engineer",
    company: "Vercel",
    rating: 5,
    quote:
      "EPSILON completely replaced our ad-hoc screen-share sessions. The live cursor sync is so smooth it feels like we're sitting at the same desk — even across continents.",
    initials: "SM",
    avatarHue: 145,
  },
  {
    id: "testimonial-james",
    name: "James Okafor",
    role: "Staff Software Engineer",
    company: "Stripe",
    rating: 5,
    quote:
      "The Monaco-based editor means zero learning curve for the team. We onboarded five engineers in a single afternoon. The cloud sync alone saved us hours of painful merge conflicts.",
    initials: "JO",
    avatarHue: 260,
  },
  {
    id: "testimonial-priya",
    name: "Priya Nair",
    role: "Engineering Manager",
    company: "Linear",
    rating: 5,
    quote:
      "I was skeptical a browser-based editor could feel premium. EPSILON proved me wrong. The performance, the design, the real-time presence — it's the first tool my team actually loves.",
    initials: "PN",
    avatarHue: 30,
  },
];
