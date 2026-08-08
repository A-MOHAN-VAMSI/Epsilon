# EPSILON — AI-Powered Monaco Editing + Code Runner / Output Terminal + Real-Time Yjs Collaboration

## AI-Powered Monaco Editing (Safe Diff / Accept / Reject)

- [x] Inspect existing architecture (workspaces, files, editor, auth, AI, collaboration)
- [x] Plan approved (structured AI edit endpoint + Monaco selection tracking + diff/Accept/Reject + Yjs transaction apply)
- [x] Create `client/src/lib/ai/editorTypes.ts` (strict AISelectionContext / AICodeEditRequest / AIEditProposal / StoredAIProposal)
- [x] Create `client/src/lib/ai/aiEditUtils.ts` (position↔offset, replaceSelection, hashContent)
- [x] Add `requestGeminiEditor` + structured JSON schema + validation to `client/src/lib/ai/gemini.ts`
- [x] Create `client/src/app/api/ai/editor/route.ts` (auth, payload validation, workspace context reuse, viewer guard, structured response)
- [x] Create `client/src/lib/ai/aiEditService.ts` (client service + buildStoredProposal + isProposalStale)
- [x] Extend `CollaborativeEditor.tsx` (selection tracking, editorApiRef, Yjs transaction applySelectionEdit/applyWholeFileEdit)
- [x] Create `EditorAIActionBar.tsx` (Explain/Fix/Refactor/Optimize/Ask AI contextual bar)
- [x] Create `AIEditPreview.tsx` (side-by-side diff with syntax highlighting, line ranges, accept/reject)
- [x] Create `EditorAIPanel.tsx` (Idle/Generating/Explanation/Proposal/Stale/Error/Applied states)
- [x] Wire AI state + handlers into `WorkspaceEditor.tsx`

## Code Runner + Output Terminal (LIVE Yjs content via replaceable execution abstraction)

- [x] Create `client/src/lib/execution/executionTypes.ts` (ExecutionLanguage/Status/Request/Result/RunMetadata + detectExecutionLanguage)
- [x] Create `client/src/lib/execution/executionService.ts` (client runExecution + typed ExecutionError + language label)
- [x] Create `client/src/lib/execution/executionRunner.ts` (local dev adapter: spawn node/python3, allowlist, timeout, output cap, stripped env, temp cleanup)
- [x] Create `client/src/app/api/execution/run/route.ts` (auth, body-bound, language allowlist, server-authoritative permission, 4xx/5xx mapping)
- [x] Create `RunButton.tsx` (Run/Stop + Ctrl/Cmd+Enter)
- [x] Create `ExecutionPanel.tsx` (bottom Output terminal, clear/close, Fix with EPSILON AI on error/timeout)
- [x] Wire execution state + handlers into `WorkspaceEditor.tsx`
- [x] Verify: `npm run build` (EXIT:0, compiled successfully; clean, no errors/warnings)
