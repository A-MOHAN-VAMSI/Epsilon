# EPSILON — Collaborative Code Editor

EPSILON is a collaborative coding environment built with **Next.js**, **Supabase**,
and **Yjs** real-time synchronization over a standalone **Node.js WebSocket server**.

This repository contains two deployable parts:

| Directory | What it is |
| --- | --- |
| `client/` | Next.js frontend (auth, dashboard, Monaco editor, collaboration UI) |
| `collab/` | Standalone Node.js WebSocket server (Yjs documents + presence) |

---

## Architecture

```
Next.js Client
      |
      | Supabase REST / Auth (HTTPS)
      v
Supabase
  - Auth (email/password, email confirmation)
  - workspaces
  - workspace_members
  - workspace_invites
  - workspace_files
  - Row Level Security (RLS)

Next.js Client
      |
      | WebSocket (wss://...) + Supabase JWT
      v
Collaboration Server  (collab/ — Node.js + @y/websocket-server)
      |
      | verification (JWT + membership) happens BEFORE joining a room
      v
Yjs Documents  (one document per workspace file)
      |
      v
y-monaco bindings (client side) <-> Monaco editor
```

### How Yjs changes eventually persist to Supabase

1. Two users edit the same file in Monaco.
2. `y-monaco` applies each keystroke to a shared `Y.Text` in a `Y.Doc`.
3. `y-websocket` (client) broadcasts Yjs sync updates to the collaboration
   server, which fans them out to every connected peer in the same room.
4. Locally, the `Y.Text` is observed. On every change (local or remote) the
   client calls `onRemoteUpdate(plainText)`.
5. `WorkspaceEditor` debounces these snapshots (800 ms) and writes the latest
   plaintext to `workspace_files.content` via Supabase REST.
6. Because every peer runs the same observe-and-persist logic, the last writer
   wins for Supabase persistence — but Yjs guarantees the live collaborative
   state is always consistent across all peers while they are connected.

> **Persistence is debounced, not per-keystroke.** Yjs owns the live document;
> Supabase is the durable store. On refresh/reopen, the client seeds the fresh
> Yjs document from the latest persisted `content`.

---

## Prerequisites

- Node.js 18+
- A Supabase project
- Supabase SQL migrations applied (see below)

---

## Database setup (Supabase)

Run these SQL files **in order** in the Supabase SQL Editor:

1. `client/supabase/workspaces.sql` — `workspaces` table + RLS + `updated_at` trigger.
2. `client/supabase/workspace_files.sql` — `workspace_files` table + RLS.
3. `client/supabase/collaboration.sql` — **collaboration**:
   - `workspace_members` (roles: owner / editor / viewer)
   - `workspace_invites` (random invite tokens)
   - `workspace_member_profiles` view (members + display names)
   - RLS policies for `workspace_members`, `workspace_invites`
   - **Additional** member-based RLS policies on `workspaces` and `workspace_files`
   - Auto-owner membership (backfill + trigger) so every owner is represented
     in `workspace_members` without breaking existing workspaces.

You **must execute these manually** — the code does not run them automatically.

---

## Client setup (`client/`)

```bash
cd client
npm install
cp .env.example .env.local   # if you have one; or create .env.local
```

Environment variables for the client:

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Supabase anon key (safe for browser) |
| `NEXT_PUBLIC_COLLAB_WS_URL` | yes* | Collaboration server URL (`ws://localhost:1234` locally, `wss://...` in prod) |

\* If `NEXT_PUBLIC_COLLAB_WS_URL` is omitted it defaults to `ws://localhost:1234`.

Run the client:

```bash
npm run dev        # http://localhost:3000
```

---

## Collaboration server setup (`collab/`)

```bash
cd collab
cp .env.example .env
# edit .env: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, COLLAB_PORT
npm install
```

Environment variables for the collaboration server:

| Variable | Required | Description |
| --- | --- | --- |
| `COLLAB_PORT` | no | WebSocket port (default `1234`) |
| `SUPABASE_URL` | yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | **Server-side only.** Used to verify membership. Never exposed to the browser. |

Run the server:

```bash
npm run dev        # auto-restart on changes
# or
npm start          # production-style
```

Health check: `http://localhost:1234/`

---

## Authentication flow for WebSockets

1. The user signs in through the Next.js client against Supabase Auth.
2. The client stores the Supabase **access token** (JWT) in `localStorage`.
3. When a file opens, `collabProvider` creates a `WebsocketProvider` connecting
   to `NEXT_PUBLIC_COLLAB_WS_URL` with `?token=<access_token>` and a room name
   `epsilon/<workspaceId>/<fileId>`.
4. The collaboration server calls `supabase.auth.getUser(token)` to verify the
   JWT and resolve the user id.
5. The server then checks authorization for the workspace:
   - If `workspaces.owner_id === userId` → allowed (owner).
   - Else it looks up `workspace_members` for `(workspace_id, user_id)`.
6. If authorized, the connection proceeds into the Yjs sync loop. If not, the
   server closes the socket with **code 4001** before the client can join the
   document.
7. **The room name is never treated as authorization.** Authorization is the
   JWT + the server-side membership check.

---

## Membership / role architecture

| Role | Read workspace | Edit workspace | Read files | Write files | Invite | Remove members | Delete workspace |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **owner** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **editor** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **viewer** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| *(unauthorized)* | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

- **Ownership is authoritative**: `workspaces.owner_id` grants full access even
  if the owner is not present in `workspace_members`. This ensures existing
  workspaces are never locked out.
- For consistency, `collaboration.sql` backfills an `owner` membership row for
  every existing owner and auto-inserts it on new workspace creation.
- The client reads the role via `getWorkspaceAccess()` (UI behavior only) and
  the collaboration server re-verifies it server-side (the real boundary).

---

## Invitation flow

1. A workspace **owner** opens the Invite modal in the workspace top bar.
2. `createInvite()` generates a cryptographically random 48-hex-char token and
   inserts a row into `workspace_invites`.
3. The owner copies a shareable link `https://<app>/join?invite=<token>`.
4. The invitee opens the link (or uses **Join Workspace** on the dashboard),
   signs in, and lands on `/join?invite=<token>`.
5. `acceptInvite()` looks up the invite by token, verifies it has not expired,
   and inserts a `workspace_members` row with the invite's role (idempotent —
   `ON CONFLICT`/unique key prevents duplicates).
6. The invitee is redirected into the workspace.

Knowing a workspace UUID or `/workspace/{id}` URL provides **no** access; the
random invite token is required to join.

---

## Yjs / Monaco synchronization

- `collabProvider.ts` creates a `Y.Doc` + `Y.Text` per open file and a
  `WebsocketProvider` to the collaboration server.
- `CollaborativeEditor.tsx` binds the `Y.Text` to Monaco with `y-monaco`
  (`MonacoBinding`), giving bidirectional sync, real-time remote edits, and
  selection awareness.
- The room id is deterministic: `epsilon/<workspaceId>/<fileId>`, so two
  different workspaces/files can never share a Yjs document.
- The editor is set **read-only for viewers**.

---

## Presence & remote cursors

- Presence uses Yjs **awareness**. Each client publishes `{ name, userId, color }`.
- `PresenceBar` renders authenticated display names/initials with online status.
- Remote cursors are rendered by `y-monaco` from awareness; cursor labels use
  the authenticated display name and are kept visually subtle.

---

## Connection states

| State | Meaning |
| --- | --- |
| `Connecting` | Attempting initial connection |
| `Connected` | Live WebSocket established |
| `Reconnecting` | Temporary disconnect; y-websocket is retrying |
| `Offline` | Connection lost (or server denied with 4001) |

- A temporary WebSocket loss does **not** crash Monaco. Yjs retains local edits
  while disconnected and re-synchronizes after reconnection.
- On a server-side authorization denial (code 4001), the client stops retrying
  and shows **Offline** instead of looping.

---

## What was NOT changed

- The public landing page editor preview (`client/src/components/landing/*`)
  keeps its intentional Alice/Bob/Emma demo collaborators. Landing demo data is
  separate from real workspace data.
- Existing auth, email confirmation, dashboard, workspace/file CRUD, Monaco
  editor, tabs, routing, and local persistence all continue to work.

---

## Deployment

- **Client**: Vercel/Netlify/any Node host. Set `NEXT_PUBLIC_*` env vars.
- **Collaboration server**: A long-lived WebSocket service. Needs a platform
  that supports WebSockets (Fly.io, Railway, Render, GCP/EC2, etc.) and must be
  reachable by the browser over `wss://`.
- Set `NEXT_PUBLIC_COLLAB_WS_URL` to the deployed `wss://` URL in production.
- Keep the Supabase **service role key** on the collaboration server only.

See `collab/README.md` for the collaboration server's detailed security model
and deployment notes.
