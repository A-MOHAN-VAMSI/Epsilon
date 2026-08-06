import type { FooterLinkGroupData } from "./footerData";

interface Props {
  group: FooterLinkGroupData;
}

export default function FooterLinkGroup({ group }: Props) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-white">{group.title}</h3>
      <ul className="mt-4 space-y-3" role="list">
        {group.links.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              className="text-sm text-white/50 transition-colors duration-200 hover:text-[#C8FF3D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8FF3D]/60"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
