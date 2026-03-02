import OpenAI from "openai";
import { INTRO_AGENT_SYSTEM_PROMPT } from "./prompt";
import { IntroInput, IntroOutput, IntroMessage } from "./types";

function getOpenAIClient(): OpenAI {
  if (process.env.OPENAI_API_KEY) {
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  if (baseURL && apiKey) {
    return new OpenAI({ apiKey, baseURL });
  }
  throw new Error("No OpenAI credentials configured.");
}

function parsePlainTextOutput(
  rawText: string,
  input: IntroInput
): [IntroMessage, IntroMessage] {
  const wingMarker = "🔥 Winging";

  const parts = rawText.split(wingMarker).filter((p) => p.trim().length > 0);

  if (parts.length < 2) {
    throw new Error("Could not parse two wing messages from LLM output.");
  }

  function parseBlock(block: string, blockIndex: number): IntroMessage {
    const lines = block.trim().split("\n").map((l) => l.trim()).filter((l) => l.length > 0);

    const titleLine = `${wingMarker} ${lines[0]}`;

    const bodyLines: string[] = [];
    let ctaLine = "";

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const isLast = i === lines.length - 1;
      const looksLikeCta =
        line.toLowerCase().startsWith("reply") ||
        line.toLowerCase().startsWith("let me know") ||
        line.toLowerCase().startsWith("drop me") ||
        line.toLowerCase().startsWith("send me") ||
        line.toLowerCase().startsWith("share your") ||
        line.toLowerCase().startsWith("when are you");

      if (isLast || (looksLikeCta && i >= lines.length - 2)) {
        ctaLine = line;
      } else {
        bodyLines.push(line);
      }
    }

    const body = bodyLines.join("\n\n");

    // Block 0 = message TO user A (about user B) — prompt guarantees this order
    // Block 1 = message TO user B (about user A)
    const recipient = input.users[blockIndex === 0 ? 0 : 1];

    const usedFields: string[] = [];
    const profileFields = Object.keys(input.users[0].profile);
    for (const field of profileFields) {
      if (body.toLowerCase().includes(field.toLowerCase())) {
        usedFields.push(field);
      }
    }

    return {
      to_user_id: recipient.user_id,
      to_role: recipient.role,
      title: titleLine,
      body,
      cta: ctaLine,
      used_fields: usedFields,
    };
  }

  const msgA = parseBlock(parts[0], 0);
  const msgB = parseBlock(parts[1], 1);

  return [msgA, msgB];
}

export async function generateIntroMessages(input: IntroInput): Promise<IntroOutput> {
  const openai = getOpenAIClient();

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: INTRO_AGENT_SYSTEM_PROMPT },
      { role: "user", content: JSON.stringify(input, null, 2) },
    ],
    max_tokens: 1024,
  });

  const rawText = response.choices[0]?.message?.content ?? "";

  if (!rawText) {
    throw new Error("LLM returned an empty response.");
  }

  const [msg1, msg2] = parsePlainTextOutput(rawText, input);

  return {
    match_id: input.match_id,
    messages: [msg1, msg2],
  };
}
