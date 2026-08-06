"use client";

import { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { getSession } from "./supabaseAuth";

export type ConnectionStatus = "connecting" | "connected" | "reconnecting" | "offline";

export type CollabPeer = {
  clientId: number;
  userId: string;
  name: string;
  color: string;
};

export type CollabSession = {
  doc: Y.Doc;
  provider: WebsocketProvider;
  roomId: string;
  text: Y.Text;
  peers: CollabPeer[];
  connectionStatus: ConnectionStatus;
  canWrite: boolean;
  /** True when the server closed the connection with code 4001 (auth denied). */
  denied: boolean;
};

export const COLLAB_WS_URL =
  process.env.NEXT_PUBLIC_COLLAB_WS_URL ?? "ws://localhost:1234";

// Distinct, subtle colors for remote cursors / avatars.
const PEER_COLORS = [
  "#c7ff24", // primary lime
  "#7c5cff", // secondary violet
  "#00d4ff", // accent cyan
  "#f59e0b", // amber
  "#f472b6", // pink
  "#34d399", // emerald
  "#60a5fa", // blue
  "#fb7185", // rose
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Deterministic room per workspace+file. Prevents cross-document collisions. */
export function collabRoomId(workspaceId: string, fileId: string): string {
  return `epsilon/${workspaceId}/${fileId}`;
}

/**
 * React hook that creates a Yjs document + WebSocket provider for a single file.
 *
 * - Owners/editors can write; viewers are read-only (canWrite=false).
 * - Local edits are applied to the Y.Text and broadcast via y-websocket.
 * - `onRemoteUpdate` fires whenever the Y.Text changes (local or remote) with
 *   the new plaintext, so the UI can debounce-persist to Supabase.
 */
export function useCollabSession(params: {
  workspaceId: string;
  fileId: string;
  userName: string;
  userId: string;
  enabled: boolean;
  initialContent: string;
  canWrite: boolean;
  onRemoteUpdate: (content: string) => void;
}): CollabSession | null {
  const { workspaceId, fileId, userName, userId, enabled, initialContent, canWrite, onRemoteUpdate } = params;

const [session, setSession] = useState<CollabSession | null>(null);
  const [peers, setPeers] = useState<CollabPeer[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting");
  const [denied, setDenied] = useState(false);

  const onRemoteUpdateRef = useRef(onRemoteUpdate);
  onRemoteUpdateRef.current = onRemoteUpdate;

  const initialContentRef = useRef(initialContent);
  initialContentRef.current = initialContent;

  useEffect(() => {
    if (!enabled) return;

    const authSession = getSession();
    if (!authSession) return;

    const roomId = collabRoomId(workspaceId, fileId);
    const doc = new Y.Doc();
    const text = doc.getText("epsilon");

    // Seed the room from the persisted Supabase content when the doc is fresh.
    if (text.toString() === "" && initialContentRef.current) {
      text.insert(0, initialContentRef.current);
    }

    const provider = new WebsocketProvider(COLLAB_WS_URL, roomId, doc, {
      connect: false,
      params: { token: authSession.access_token },
    });

provider.on("status", (event: { status: string }) => {
      const status = event.status;
      if (status === "connected") setConnectionStatus("connected");
      else if (status === "connecting") setConnectionStatus("connecting");
      else if (status === "disconnected") {
        // y-websocket emits "disconnected" during a reconnect attempt too.
        // Show "reconnecting" unless we were denied (4001 → offline).
        setConnectionStatus((prev) => (denied ? "offline" : "reconnecting"));
      }
    });

    // Handle server-initiated close (e.g. code 4001 = authorization denied).
    // Stop auto-reconnect so we don't loop against a room we can't access.
    provider.on("connection-close", (event: unknown) => {
      const code = (event as { code?: number } | null)?.code;
      if (code === 4001) {
        setDenied(true);
        setConnectionStatus("offline");
        // y-websocket will keep retrying; force it to stop.
        provider.disconnect();
      }
    });

    // Presence / awareness: user identity + color.
    provider.awareness.setLocalStateField("user", {
      name: userName,
      userId,
      color: PEER_COLORS[hashString(userId) % PEER_COLORS.length],
    });

    const updatePeers = () => {
      const states = provider.awareness.getStates();
      const list: CollabPeer[] = [];
      states.forEach((state, clientId) => {
        if (clientId === provider.awareness.clientID) return;
        const user = (state as { user?: { name?: string; userId?: string; color?: string } }).user;
        if (user?.name) {
          list.push({
            clientId,
            userId: user.userId ?? "",
            name: user.name,
            color: user.color ?? PEER_COLORS[0],
          });
        }
      });
      setPeers(list);
    };
    provider.awareness.on("change", updatePeers);
    updatePeers();

    // Fire updates (local or remote) so the UI can debounce-persist.
    const observeText = () => {
      onRemoteUpdateRef.current(text.toString());
    };
    text.observe(observeText);

const built: CollabSession = {
      doc,
      provider,
      roomId,
      text,
      peers,
      connectionStatus,
      canWrite,
      denied,
    };
    setSession(built);

    provider.connect();

return () => {
      text.unobserve(observeText);
      provider.awareness.off("change", updatePeers);
      provider.destroy();
      doc.destroy();
      setSession(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, fileId, enabled]);

  // Merge the live peers/connectionStatus state into the returned session so
  // presence and connection UI update reactively (the base `session` object is
  // only recreated when the workspace/file changes).
  return session ? { ...session, peers, connectionStatus } : null;
}

