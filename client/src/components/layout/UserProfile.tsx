import { ChevronDown } from "lucide-react";

type UserProfileProps = {
  name: string;
  email: string;
};

export default function UserProfile({ name, email }: UserProfileProps) {
  return (
    <button type="button" className="flex items-center gap-2 rounded-lg p-1.5 text-left transition-colors hover:bg-white/[0.06]">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-[#8bbd1f] text-xs font-bold text-[#07100b]">{name.charAt(0)}</span>
      <span className="hidden min-w-0 sm:block"><span className="block truncate text-xs font-medium text-white/85">{name}</span><span className="block truncate text-[10px] text-white/40">{email}</span></span>
      <ChevronDown size={14} className="hidden text-white/40 sm:block" />
    </button>
  );
}
