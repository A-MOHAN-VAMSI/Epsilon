export interface PricingFeature {
  label: string;
  included: boolean;
}

export interface PricingPlan {
  id: string;
  name: string;
  /** Display price string — "Free", "$19", "Custom" etc. */
  price: string;
  /** Shown below the price — "/month", "/seat/month", etc. */
  period: string;
  description: string;
  cta: string;
  href: string;
  /** When true the card renders with the lime accent treatment */
  highlighted: boolean;
  /** Optional badge rendered on the card — "Most Popular" etc. */
  badge?: string;
  features: PricingFeature[];
}

export const plans: PricingPlan[] = [
  {
    id: "plan-free",
    name: "Free",
    price: "$0",
    period: "forever",
    description:
      "Everything you need to explore EPSILON and collaborate on small personal projects.",
    cta: "Start for free",
    href: "#",
    highlighted: false,
    features: [
      { label: "Up to 3 active sessions", included: true },
      { label: "2 collaborators per session", included: true },
      { label: "Monaco Editor (full)", included: true },
      { label: "Cloud auto-save", included: true },
      { label: "Community support", included: true },
      { label: "Unlimited sessions", included: false },
      { label: "Priority support", included: false },
      { label: "AI assistant", included: false },
      { label: "SSO & audit logs", included: false },
    ],
  },
  {
    id: "plan-pro",
    name: "Pro",
    price: "$19",
    period: "/seat / month",
    description:
      "For professional developers and growing teams who need unlimited collaboration without limits.",
    cta: "Start free trial",
    href: "#",
    highlighted: true,
    badge: "Most Popular",
    features: [
      { label: "Unlimited active sessions", included: true },
      { label: "Unlimited collaborators", included: true },
      { label: "Monaco Editor (full)", included: true },
      { label: "Cloud auto-save", included: true },
      { label: "Priority support", included: true },
      { label: "AI assistant (beta)", included: true },
      { label: "Custom themes", included: true },
      { label: "SSO & audit logs", included: false },
      { label: "Dedicated SLA", included: false },
    ],
  },
  {
    id: "plan-enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "contact us",
    description:
      "Tailored for large organisations that require advanced security, compliance, and dedicated support.",
    cta: "Talk to sales",
    href: "mailto:sales@epsilon.dev",
    highlighted: false,
    features: [
      { label: "Unlimited active sessions", included: true },
      { label: "Unlimited collaborators", included: true },
      { label: "Monaco Editor (full)", included: true },
      { label: "Cloud auto-save", included: true },
      { label: "Dedicated support", included: true },
      { label: "AI assistant", included: true },
      { label: "Custom themes", included: true },
      { label: "SSO & audit logs", included: true },
      { label: "Dedicated SLA", included: true },
    ],
  },
];
