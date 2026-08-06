"use client";

import { Users } from "lucide-react";
import type { CollabPeer } from "@/lib/collabProvider";

type PresenceBarProps = {
  peers: CollabPeer[];
  currentUser?: { name: string; isOwner: boolean };
};

export default function PresenceBar({ peers, currentUser }: PresenceBarProps) {
  const total = peers.length + (currentUser ? 1 : 0);

  return (
    <div className="flex items-center" title={`${total} online`}>
      {currentUser && (
        <div
          className="relative -ml-1.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#0a0f16] bg-[var(--color-primary)] text-[10px] font-semibold text-[#07100b] shadow"
          title={`${currentUser.name} (you)`}
        >
          {currentUser.name.charAt(0).toUpperCase()}
          <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-[#0a0f16] bg-[var(--color-primary)]" />
        </div>
      )}

      {peers.slice(0, 4).map((peer) => (
        <div
          key={peer.clientId}
          className="relative -ml-1.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#0a0f16] text-[10px] font-semibold text-[#07100b] shadow transition-transform hover:-translate-y-0.5"
          style={{ backgroundColor: peer.color }}
          title={`${peer.name} (online)`}
        >
          {peer.name.charAt(0).toUpperCase()}
          <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 animate-pulse rounded-full border border-[#0a0f16] bg-[var(--color-primary)]" />
        </div>
      ))}

      {peers.length > 4 && (
        <div className="relative -ml-1.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#0a0f16] bg-white/10 text-[10px] font-semibold text-white/70">
          +{peers.length - 4}
        </div>
      )}

      {total === 0 && (
        <span className="flex items-center gap-1.5 text-[11px] text-white/35 px-1">
          <Users size={12} />
          <span className="hidden sm:inline">No one online</span>
        </span>
      )}
    </div>
  );
}
