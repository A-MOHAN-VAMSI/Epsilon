import type { SocialLink } from "./footerData";

interface Props {
  links: SocialLink[];
}

const icons = {
  github: (
    <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.61-3.37-1.18-3.37-1.18-.45-1.15-1.11-1.46-1.11-1.46-.91-.62.07-.61.07-.61 1 .07 1.54 1.04 1.54 1.04.9 1.53 2.35 1.09 2.92.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02A9.57 9.57 0 0 1 12 6.8c.85 0 1.7.11 2.5.34 1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.91.68 1.84v2.73c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
  ),
  linkedin: (
    <path d="M6.94 8.5A1.72 1.72 0 1 0 6.94 5a1.72 1.72 0 0 0 0 3.5ZM5.4 10h3.08v9H5.4v-9Zm5.02 0h2.95v1.23h.04c.41-.78 1.42-1.6 2.92-1.6 3.12 0 3.7 2.05 3.7 4.72V19h-3.08v-4.12c0-.98-.02-2.25-1.37-2.25-1.37 0-1.58 1.07-1.58 2.18V19h-3.08v-9Z" />
  ),
  x: <path d="M5 4h3.38l3.86 5.16L16.7 4H19l-5.71 6.54L19.35 20h-3.38l-4.27-5.71L6.7 20H4.4l6.06-6.94L5 4Zm2.16 1.58 9.62 12.84h1.41L8.57 5.58H7.16Z" />,
};

export default function SocialLinks({ links }: Props) {
  return (
    <div className="flex items-center gap-3">
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          aria-label={link.label}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/55 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C8FF3D]/40 hover:bg-[#C8FF3D]/10 hover:text-[#C8FF3D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8FF3D]/60"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
            {icons[link.icon]}
          </svg>
        </a>
      ))}
    </div>
  );
}
