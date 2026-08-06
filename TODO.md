# EPSILON Collaboration Milestone — Implementation Plan

## Approved Decisions
- Align server with the modern y-websocket 3.x ecosystem using `@y/websocket-server`.
- Remove the raw JSON `epsilon:access` frame from the Yjs binary stream.
- Server-side auth required before joining a Yjs document.
- Client uses `getMyRole()` for UI only; server independently verifies.
- Handle close code 4001 (authorization denied) by stopping reconnect.

## Steps
- [x] 1. Update `collab/package.json` to use `@y/websocket-server` + aligned deps; run `npm install`.
- [x] 2. Rewrite `collab/server.js`: server-side auth (JWT + membership) before Yjs sync, close 4001 on denial, remove JSON frame.
- [x] 3. Update `collab/README.md` with env vars, deployment, security model.
- [x] 4. Update `client/supabase/collaboration.sql` (refine RLS, add display-name helper, ensure idempotency).
- [x] 5. Update `client/src/lib/workspaceService.ts`: `getUserWorkspaces` includes shared workspaces; add role-aware access.
- [x] 6. Update `client/src/lib/memberService.ts`: expose `getMyRole` (already present) + display-name lookup.
- [x] 7. Update `client/src/lib/collabProvider.ts`: 4001 handling (stop reconnect), surface `reconnecting`, expose role.
- [ ] 8. Update `client/src/components/editor/WorkspaceEditor.tsx`: fetch actual role, correct `canWrite`.
- [ ] 9. Update `client/src/components/editor/CollaborativeEditor.tsx`: read-only enforcement from role.
- [ ] 10. Update `client/src/components/editor/WorkspaceTopBar.tsx`: role badge.
- [ ] 11. Update `client/src/app/workspace/[id]/page.tsx`: role-aware page access.
- [ ] 12. Update `client/src/styles/globals.css`: y-monaco remote cursor CSS.
- [ ] 13. Create `client/.env.example` and document env vars.
- [ ] 14. Update root `README.md` with architecture + manual test sequence.
- [ ] 15. Final report + lint/build verification.
