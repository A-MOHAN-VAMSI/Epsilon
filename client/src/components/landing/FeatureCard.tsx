import { LucideIcon } from "lucide-react";

interface Props { title: string; description: string; icon: LucideIcon; badge?: string; }

export default function FeatureCard({ title, description, icon: Icon, badge }: Props) {
  return <div className="group relative rounded-2xl border border-white/10 bg-white/[0.025] p-7 transition-all duration-300 hover:-translate-y-1 hover:border-[#C8FF3D]/40 hover:bg-white/[0.045]"><div className="mb-7 flex h-12 w-12 items-center justify-center rounded-xl bg-[#C8FF3D]/10"><Icon className="h-6 w-6 text-[#C8FF3D]" /></div><h3 className="mb-3 text-lg font-semibold leading-snug">{title}</h3><p className="leading-7 text-white/60">{description}</p>{badge && <span className="mt-7 inline-block rounded-full border border-[#C8FF3D]/30 bg-[#C8FF3D]/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wide text-[#C8FF3D]">{badge}</span>}</div>;
}
