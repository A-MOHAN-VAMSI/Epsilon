import type { ReactNode } from "react";

type DashboardSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export default function DashboardSection({ title, description, children, className = "" }: DashboardSectionProps) {
  return (
    <section className={className} aria-labelledby={`${title.toLowerCase().replaceAll(" ", "-")}-heading`}>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 id={`${title.toLowerCase().replaceAll(" ", "-")}-heading`} className="text-base font-semibold text-white">{title}</h2>
          {description && <p className="mt-1 text-sm text-white/45">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}
