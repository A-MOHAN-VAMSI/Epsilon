"use client";

import { LoaderCircle, Wifi, WifiOff } from "lucide-react";
import type { ConnectionStatus } from "@/lib/collabProvider";

type ConnectionBadgeProps = {
  status: ConnectionStatus;
};

const CONFIG: Record<
  ConnectionStatus,
  { label: string; className: string; Icon: typeof Wifi }
> = {
  connecting: {
    label: "Connecting",
    className: "border-white/10 bg-white/[0.03] text-white/50",
    Icon: LoaderCircle,
  },
  connected: {
    label: "Connected",
    className: "border-[var(--color-primary)]/25 bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
    Icon: Wifi,
  },
  reconnecting: {
    label: "Reconnecting",
    className: "border-amber-400/25 bg-amber-400/10 text-amber-300",
    Icon: LoaderCircle,
  },
  offline: {
    label: "Offline",
    className: "border-red-400/25 bg-red-400/10 text-red-300",
    Icon: WifiOff,
  },
};

export default function ConnectionBadge({ status }: ConnectionBadgeProps) {
  const { label, className, Icon } = CONFIG[status];
  const spinning = status === "connecting" || status === "reconnecting";

  return (
    <span
      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${className}`}
      title={`Collaboration: ${label}`}
    >
      <Icon size={12} className={spinning ? "animate-spin" : ""} />
      <span className="hidden sm:inline">{label}</span>
    </span>
  );
}
