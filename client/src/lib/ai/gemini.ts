import { GoogleGenAI } from "@google/genai";
import type { AIWorkspaceContext } from "@/lib/ai/context";
import type { AIEditAction, AIEditProposal, AISelectionContext } from "@/lib/ai/editorTypes";

const GEMINI_MODEL = "gemini-3.6-flash";

/** The structured JSON "path" passed to Gemini for editor actions. */
const EDIT_JSON_SCHEMA = {
  type: "object",
  properties: {
    explanation: { type: "string" },
    edit: {
      type: "object",
      properties: {
        type: { type: "string", enum: ["replace_selection", "replace_file"] },
        replacement: { type: "string" },
      },
      required: ["type", "replacement"],
    },
  },
  required: ["explanation", "edit"],
};

const ACTION_INSTRUCTIONS: Record<AIEditAction, string> = {
  explain:
    "You are doing an EXPLAIN action. Provide a clear, concise explanation of the selected code (or active file if there is no selection). Only explain; do NOT propose any code change. Set the top-level 'edit' value to null.",
  fix: "You are doing a FIX action. Inspect the selected code (or active file) and identify the problem, then propose corrected code. The replacement must EXACTLY replace the selected region (if a selection is provided) or the entire file (if not). Do not wrap the replacement in Markdown code fences. Do not change unrelated code.",
  refactor: "You are doing a REFACTOR action. Improve readability, structure, and maintainability while preserving behavior. Return replacement code that EXACTLY replaces the selected region (if a selection is provided) or the entire file (if not). Do not wrap the replacement in Markdown code fences. Avoid changing unrelated behavior or unrelated files.",
  optimize: "You are doing an OPTIMIZE action. Improve performance only where meaningful while preserving intended behavior. Explain important trade-offs in the explanation. Return replacement code that EXACTLY replaces the selected region (if a selection is provided) or the entire file (if not). Do not wrap the replacement in Markdown code fences.",
  ask: "You are answering a custom instruction from the user. If the instruction asks for code, you may propose a replacement. Return an EXACT replacement (selected region if a selection exists, otherwise the entire file). If the request is explanation-only, set the top-level 'edit' value to null. Do not wrap replacements in Markdown fences.",
};

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export type GeminiResponse = {
  assistantText: string;
};

export async function requestGeminiAssistant(
  prompt: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
  workspaceContext?: Pick<AIWorkspaceContext, "id" | "name" | "files" | "activeFile" | "selection" | "role" | "truncated"> | null
): Promise<GeminiResponse> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Gemini API key is not configured.");
  }

  const recentHistory = history
    .slice(-6)
    .map((message) => `${message.role === "user" ? "User" : "Assistant"}: ${message.content}`)
    .join("\n");

  const systemInstruction =
    "You are EPSILON AI, an AI pair programmer integrated into the EPSILON real-time collaborative code editor. Help developers understand code, debug errors, generate code, refactor code, and improve code quality. When code is provided, reason about that code rather than inventing missing project details. When information is insufficient, say what additional context is needed. Prefer concise, practical programming answers. Use Markdown code blocks with the correct language when returning code. Keep your answers implementation-aware and grounded in the project context you are given.";

  const workspaceFiles = workspaceContext?.files?.length
    ? workspaceContext.files
        .map((file) => {
          const fileHeader = `\n--- FILE: ${file.path}${file.language ? ` (${file.language})` : ""} ---\n`;
          return `${fileHeader}${file.content.trim() || "[empty file]"}`;
        })
        .join("\n")
    : "";

  const activeFileBlock = workspaceContext?.activeFile
    ? `\nActive file: ${workspaceContext.activeFile.path}\nSelection: ${workspaceContext.selection?.selectedText ? `"${workspaceContext.selection.selectedText.slice(0, 600)}"` : "none"}\n\n${workspaceContext.activeFile.content ?? "[no file contents available]"}`
    : "";

  const workspaceMeta = workspaceContext
    ? `\nWorkspace context:\n- id: ${workspaceContext.id}\n- name: ${workspaceContext.name}\n- role: ${workspaceContext.role}\n- project context included: ${workspaceContext.files.length} files${workspaceContext.truncated ? " (truncated for size)" : ""}`
    : "";

  const contents = `${systemInstruction}${workspaceMeta}${activeFileBlock ? `\n${activeFileBlock}` : ""}${workspaceFiles ? `\nProject files:\n${workspaceFiles}` : ""}\n\n${recentHistory ? `${recentHistory}\n` : ""}User: ${prompt}`;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
    });

    if (!response || typeof response.text !== "string") {
      throw new Error("Gemini returned an invalid response.");
    }

    return { assistantText: response.text.trim() };
  } catch (error) {
  console.error("========== GEMINI REAL ERROR ==========");
  console.error(error);
  console.error("=======================================");

  const message =
    error instanceof Error ? error.message : String(error);

  if (/rate limit|quota|429/i.test(message)) {
    throw new Error(
      "You have reached the AI request limit. Please try again shortly."
    );
  }

throw new Error(`Gemini request failed: ${message}`);
}
}

/**
 * Asset that a Gemini-generated value is a plain object, rejecting anything
 * else (prevents prototype-pollution / unexpected shapes).
 */
function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  return true;
}

/**
 * Validate a raw Gemini structured response into a strict AIEditProposal.
 * Throws a descriptive error when the response does not match the contract.
 */
function validateEditProposal(raw: unknown): AIEditProposal {
  if (!isPlainRecord(raw)) {
    throw new Error("Gemini returned an invalid structured response.");
  }

  if (typeof raw.explanation !== "string" || !raw.explanation.trim()) {
    throw new Error("Gemini response is missing an explanation.");
  }

  const explanation = raw.explanation.trim();

  // Explanation-only responses: edit === null.
  if (raw.edit === null || raw.edit === undefined) {
    return { explanation, edit: null };
  }

  if (!isPlainRecord(raw.edit)) {
    throw new Error("Gemini response has an invalid edit object.");
  }

  const editType = raw.edit.type;
  if (editType !== "replace_selection" && editType !== "replace_file") {
    throw new Error("Gemini response has an unsupported edit type.");
  }

  if (typeof raw.edit.replacement !== "string") {
    throw new Error("Gemini response is missing an edit replacement.");
  }

  return {
    explanation,
    edit: {
      type: editType,
      replacement: raw.edit.replacement,
    },
  };
}

/** Build the prompt contents for an editor action. */
function buildEditorContents(
  action: AIEditAction,
  userRequest: string | undefined,
  workspaceContext: Pick<AIWorkspaceContext, "id" | "name" | "files" | "activeFile" | "selection" | "role" | "truncated">,
  selection: AISelectionContext | null
): string {
  const systemInstruction =
    "You are EPSILON AI, an AI pair programmer integrated into the EPSILON real-time collaborative code editor.";

  const workspaceMeta = `\nWorkspace context:\n- id: ${workspaceContext.id}\n- name: ${workspaceContext.name}\n- role: ${workspaceContext.role}\n- project context included: ${workspaceContext.files.length} files${workspaceContext.truncated ? " (truncated for size)" : ""}`;

const selectionBlock = selection
    ? `\nSelected code (lines ${selection.startLine}-${selection.endLine}):\n${selection.selectedText}`
    : "\nNo text is selected; operate on the active file.";

  // The active file is already seeded into workspaceContext.files by
  // loadWorkspaceAiContext, so we present it once here.
  const activeFileBlock = workspaceContext.activeFile
    ? `\nActive file: ${workspaceContext.activeFile.path} (${workspaceContext.activeFile.language})`
    : "";

  const workspaceFiles = workspaceContext.files?.length
    ? workspaceContext.files
        .map((file) => {
          const fileHeader = `\n--- FILE: ${file.path}${file.language ? ` (${file.language})` : ""} ---\n`;
          return `${fileHeader}${file.content.trim() || "[empty file]"}`;
        })
        .join("\n")
    : "";

  const userPrompt =
    action === "ask" && userRequest && userRequest.trim()
      ? userRequest.trim()
      : `Perform the '${action}' action on the code.`;

  return `${systemInstruction}
${workspaceMeta}
${activeFileBlock}
${selectionBlock}
${workspaceFiles ? `\nProject files:\n${workspaceFiles}` : ""}

Response contract:
- Respond ONLY with a single valid JSON object matching this schema:
  {"explanation":"string","edit":{"type":"replace_selection"|"replace_file","replacement":"string"} | null}
- explanation: your reasoning / description of the change (or explanation for the EXPLAIN action).
- For code-changing actions, the replacement must EXACTLY match the selected region (when a selection exists) or the complete new file (otherwise).
- Do NOT wrap the replacement in Markdown code fences.
- Preserve language/framework/style and unrelated behavior.
- Do not fabricate unavailable dependencies or files.

${ACTION_INSTRUCTIONS[action]}

User instruction:
${userPrompt}`;
}

/**
 * Request a STRUCTURED editor edit from Gemini.
 *
 * Unlike the conversational assistant (which returns Markdown), this returns a
 * validated AIEditProposal suitable for the diff → accept/reject flow.
 */
export async function requestGeminiEditor(
  workspaceContext: Pick<AIWorkspaceContext, "id" | "name" | "files" | "activeFile" | "selection" | "role" | "truncated">,
  action: AIEditAction,
  userRequest?: string,
  selection?: AISelectionContext | null
): Promise<AIEditProposal> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Gemini API key is not configured.");
  }

  const contents = buildEditorContents(action, userRequest, workspaceContext, selection ?? null);

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: EDIT_JSON_SCHEMA,
      },
    });

    const text = response?.text;
    if (typeof text !== "string" || !text.trim()) {
      throw new Error("Gemini returned an empty response.");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("Gemini returned malformed JSON for the edit request.");
    }

    return validateEditProposal(parsed);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (/rate limit|quota|429/i.test(message)) {
      throw new Error("You have reached the AI request limit. Please try again shortly.");
    }

    throw new Error(`Gemini request failed: ${message}`);
  }
}
