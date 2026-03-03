import OpenAI from "openai";
import { GET_TO_KNOW_SYSTEM_PROMPT } from "./prompt";
import { UPDATABLE_FIELD_MAP, LOCKED_FIELDS, SKIP_FIELDS, GetToKnowAgentOutput } from "./types";
import type { BuiltInput } from "./buildInput";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface GeneratorResult {
  reply: string | null;
  profilePatch: Record<string, string | number>;
}

export async function runGetToKnowGenerator(
  userMessage: string | null,
  input: BuiltInput
): Promise<GeneratorResult> {
  const last5Messages = userMessage !== null
    ? [...input.last5Messages, { role: "user", content: userMessage }]
    : [...input.last5Messages];

  const userTurn = JSON.stringify({
    user_id: input.userId,
    user_schema: input.userSchemaJson,
    last_5_messages: last5Messages,
  });

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    max_tokens: 512,
    messages: [
      { role: "system", content: GET_TO_KNOW_SYSTEM_PROMPT },
      { role: "user", content: userTurn },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  let parsed: GetToKnowAgentOutput;

  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error("[GetToKnow] Failed to parse LLM response:", raw);
    return { reply: null, profilePatch: {} };
  }

  console.log("[GetToKnow] raw LLM:", raw);
  console.log("[GetToKnow] parsed updates:", JSON.stringify(parsed.updates));

  const profilePatch: Record<string, string | number> = {};

  for (const update of parsed.updates ?? []) {
    const fieldName = update.field;
    if (LOCKED_FIELDS.has(fieldName) || SKIP_FIELDS.has(fieldName)) continue;
    const prismaCol = UPDATABLE_FIELD_MAP[fieldName];
    if (!prismaCol) continue;
    profilePatch[prismaCol] = update.value;
  }

  // Coerce Int fields — LLM may return them as strings
  if (profilePatch.agePreferenceMin != null) {
    profilePatch.agePreferenceMin = Number(profilePatch.agePreferenceMin);
  }
  if (profilePatch.agePreferenceMax != null) {
    profilePatch.agePreferenceMax = Number(profilePatch.agePreferenceMax);
  }

  console.log("[GetToKnow] profilePatch:", JSON.stringify(profilePatch));

  return {
    reply: parsed.assistant_message ?? null,
    profilePatch,
  };
}
