# EPSILON — Real-Time Collaboration Milestone

## Task Progress

- [x] Inspect existing architecture (workspaces, files, editor, auth)
- [x] Plan approved (Yjs + y-websocket + y-monaco + standalone collab server)
- [ ] Create `client/supabase/collaboration.sql` (workspace_members + workspace_invites + RLS)
- [ ] Create `collab/` standalone WebSocket server (server.js, package.json, .env.example, README)
- [ ] Client libs: `memberService.ts`, `collabProvider.ts`
- [ ] Editor components: `CollaborativeEditor.tsx`, `PresenceBar.tsx`, `InviteModal.tsx`, `ConnectionBadge.tsx`
- [ ] Modify `WorkspaceEditor`, `WorkspaceTopBar`, `EditorStatusBar`, `MonacoEditor`
- [ ] Modify `workspaceService`, `fileService`, `workspace/[id]/page.tsx`
- [ ] Modify `DashboardHeader` + `DashboardLayout` (Join Workspace flow)
- [ ] Documentation: `README.md`, `collab/README.md`
- [ ] Verify: `npm run build` / `npx tsc --noEmit`
