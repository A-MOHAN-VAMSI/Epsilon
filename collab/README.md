# EPSILON Collaboration Server

A standalone Node.js WebSocket server that hosts **Yjs CRDT documents** for
real-time collaborative editing in the EPSILON editor.

It is fully independent from the Next.js frontend and uses the official
[`@y/websocket-server`](https://www.npmjs.com/package/@y/websocket-server)
package for the Yjs sync + awareness loop.

## Architecture

```
Next.js Client
   |
   | WebSocket + Supabase JWT (ws://...?token=<jwt>&room=epsilon/<workspaceId>/<fileId>)
   v
Collaboration Server (this directory)
   |
   | 1. verifies JWT via Supabase auth (supabase.auth.getUser)
   | 2. verifies workspace membership via Supabase service role (server-side only)
   | 3. unauthorized -> close(4001) BEFORE joining the Yjs document
   v
@y/websocket-server setupWSConnection  (Yjs sync + awareness)
   |
   v
y-monaco bindings (client side)
```

## Package versions

| Package | Version | Role |
| --- | --- | --- |
| `@y/websocket-server` | `^0.1.5` | Server-side Yjs sync + awareness (supported API) |
| `yjs` | `^13.6.31` | Yjs CRDT (client + server compatible) |
| `ws` | `^8.18.0` | WebSocket server |
| `@supabase/supabase-js` | `^2.45.4` | Supabase auth + membership lookup |

Client side uses `y-websocket@^3.0.0` + `y-protocols@^1.0.7` + `yjs@^13.6.31`.
The wire protocol (sync + awareness) is compatible across these maintained
packages.

## Prerequisites

- Node.js 18+
- A Supabase project with the `collaboration.sql` migration applied
  (which creates `workspace_members` and `workspace_invites` + RLS).

## Setup

```bash
cd collab
cp .env.example .env
# edit .env and fill in: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
npm install
```

## Run

```bash
npm run dev      # auto-restart on changes
# or
npm start        # production-style
```

The server listens on `ws://localhost:1234` (configurable via `COLLAB_PORT`).

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `COLLAB_PORT` | no | WebSocket port (default `1234`) |
| `SUPABASE_URL` | yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Server-side only. Used to verify memberships. Never exposed to the browser. |

## Security model

- The client sends its Supabase **access token** in the WebSocket query string.
- The server calls `supabase.auth.getUser(token)` to verify the user.
- The server then checks the requested workspace membership using the
  **service role** (server-side only).
- The WebSocket **room name is never treated as authorization**.
- Owners are always allowed (via `workspaces.owner_id`).
- Unauthorized connections are closed with **code 4001** before they are
  allowed to participate in the Yjs document.
- The client uses `getMyRole()` from Supabase **only for UI behavior**
  (editable vs read-only Monaco). It is NOT the security boundary.

### Viewer write-permission limitation

The collaboration server authenticates and authorizes every connection before
joining a Yjs document, but it does **not** enforce per-connection
read/write permissions *inside* a shared Yjs document. A malicious viewer
could open the browser DevTools and manually send Yjs updates over the socket
to modify the shared document.

Mitigations:
- Database RLS (in `collaboration.sql`) protects **Supabase persistence**: a
  viewer cannot write `workspace_files.content` via the REST API.
- The Monaco editor is set read-only for viewers.
- If strict collaborative write protection is required, a future step could
  add server-side message filtering (intercepting Yjs sync updates from
  viewer connections in `setupWSConnection`'s message listener). This is a
  documented limitation, not a silent guarantee.

## Deployment

This is a long-lived WebSocket service. Deploy it on a platform that supports
WebSockets (Fly.io, Railway, Render, GCP/EC2, etc.). It must be reachable by
the browser over `wss://`.

Set the client env var `NEXT_PUBLIC_COLLAB_WS_URL` to the deployed URL
(`wss://...` in production, `ws://localhost:1234` in development).
