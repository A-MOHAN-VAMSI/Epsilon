import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import { createClient } from "@supabase/supabase-js";
import { setupWSConnection } from "y-websocket/bin/utils";
// ============================================================
// EPSILON Collaboration Server
// ------------------------------------------------------------
// A standalone Node.js WebSocket server that hosts Yjs documents
// for real-time collaborative editing. Uses the official
// `@y/websocket-server` package (supported server API) for the
// Yjs sync + awareness loop.
//
// Authentication & authorization:
//   * The client connects with ?token=<supabase access token>&room=<roomId>
//   * The server verifies the JWT via Supabase auth
//   * The server then checks workspace membership (server-side service
//     role key only) to confirm the user may access the room.
//   * The WebSocket room name is NEVER treated as authorization.
//   * Unauthorized connections are closed with code 4001 BEFORE they
//     are allowed to participate in the Yjs document.
//   * Viewers are admitted but flagged read-only; editors/owners are
//     flagged writable. (See "Security limitation" notes below.)
// ============================================================

// Port resolution priority:
//   1. process.env.PORT (injected by Render in production)
//   2. process.env.COLLAB_PORT (local development)
//   3. fallback: 1234
// Safe numeric conversion: NaN (invalid value) falls through to the default.
const PORT = Number(
  process.env.PORT || process.env.COLLAB_PORT || 1234
) || 1234;
const RESERVED_ROOM_PREFIX = "epsilon/";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
// Service role: used ONLY server-side to look up memberships.
// NEVER expose this to the browser.
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRole) {
  console.error(
    "Missing required environment variables: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRole, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const server = createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ ok: true, service: "epsilon-collab" }));
});

const wss = new WebSocketServer({ server, perMessageDeflate: false });

// Track which users are currently connected (for presence / logging).
const connectedPeers = new Map();

function parseRoom(room) {
  // room format: epsilon/<workspaceId>/<fileId>
  if (typeof room !== "string" || !room.startsWith(RESERVED_ROOM_PREFIX)) {
    return null;
  }
  const parts = room.slice(RESERVED_ROOM_PREFIX.length).split("/");
  if (parts.length < 2) return null;
  return { workspaceId: parts[0], fileId: parts.slice(1).join("/") };
}

async function verifyAccess(token, room) {
  const parsed = parseRoom(room);
  if (!parsed) return { allowed: false, reason: "invalid-room" };

  // 1. Verify the Supabase JWT / fetch the user.
  const { data: user, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user?.user) {
    return { allowed: false, reason: "unauthenticated" };
  }
  const userId = user.user.id;

  // 2. Check membership / ownership for the workspace.
  //    Owners are always allowed (workspaces.owner_id is authoritative).
  const { data: ws, error: wsError } = await supabase
    .from("workspaces")
    .select("id, owner_id")
    .eq("id", parsed.workspaceId)
    .maybeSingle();

  if (wsError || !ws) {
    return { allowed: false, reason: "no-workspace" };
  }

  if (ws.owner_id === userId) {
    return { allowed: true, role: "owner", userId, workspaceId: parsed.workspaceId };
  }

  // 3. Otherwise check workspace_members.
  const { data: member, error: memberError } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", parsed.workspaceId)
    .eq("user_id", userId)
    .maybeSingle();

  if (memberError || !member) {
    return { allowed: false, reason: "not-a-member" };
  }

  return {
    allowed: true,
    role: member.role,
    userId,
    workspaceId: parsed.workspaceId,
  };
}

wss.on("connection", (ws, req) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  const token = url.searchParams.get("token") ?? "";
  // y-websocket appends the room name to the URL path (URI-encoded).
  // Format: /epsilon/<workspaceId>/<fileId>
  const room = decodeURIComponent(url.pathname.replace(/^\//, ""));

  // Validate before entering the Yjs sync loop.
  verifyAccess(token, room)
    .then((verdict) => {
      if (!verdict.allowed) {
        // Close BEFORE joining the Yjs document. 4001 = authorization denied.
        ws.close(4001, `denied:${verdict.reason}`);
        return;
      }

      const canWrite = verdict.role === "owner" || verdict.role === "editor";

      connectedPeers.set(`${verdict.userId}:${room}`, canWrite);

      console.log(
        `[+] user=${verdict.userId} room=${room} role=${verdict.role} write=${canWrite}`
      );

      // Attach metadata so listeners can inspect the authenticated user.
      ws.epsilon = {
        userId: verdict.userId,
        role: verdict.role,
        canWrite,
        workspaceId: verdict.workspaceId,
        room,
      };

      // Enter the Yjs document sync loop (supported @y/websocket-server API).
      setupWSConnection(ws, req, { docName: room });

      ws.on("close", () => {
        connectedPeers.delete(`${verdict.userId}:${room}`);
        console.log(`[-] user=${verdict.userId} room=${room}`);
      });
    })
    .catch((err) => {
      console.error("Auth error", err);
      ws.close(1011, "auth-error");
    });
});

server.listen(PORT, () => {
  const host = process.env.PORT ? "0.0.0.0 (production)" : "localhost (local)";
  console.log(`EPSILON collaboration server listening on port ${PORT} (${host})`);
  console.log(`Health check available at http://localhost:${PORT}/`);
});
