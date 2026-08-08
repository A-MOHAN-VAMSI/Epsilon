# EPSILON Button Visibility Fix

## Progress

- [x] Investigate root cause of invisible/near-invisible primary buttons
- [x] Agree on shared fix (wrap global `button` reset in `@layer base`)
- [x] Apply the fix in `client/src/styles/globals.css`
- [x] Verify Login "Sign in" button
- [x] Verify Register "Create account" button
- [x] Verify Dashboard "+ New Workspace" button
- [x] Search project for other primary buttons using same styling
- [x] Run TypeScript/build checks (3 pre-existing errors in WorkspaceEditor.tsx, unrelated to CSS change)
