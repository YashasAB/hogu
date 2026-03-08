"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runGetToKnowGenerator = runGetToKnowGenerator;
const openai_1 = __importDefault(require("openai"));
const prompt_1 = require("./prompt");
const types_1 = require("./types");
const openai = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY });
async function runGetToKnowGenerator(userMessage, input) {
    const lastMessages = userMessage !== null
        ? [...input.lastMessages, { role: "user", content: userMessage }]
        : [...input.lastMessages];
    const userTurn = JSON.stringify({
        user_id: input.userId,
        user_schema: input.userSchemaJson,
        last_messages: lastMessages,
    });
    const response = await openai.chat.completions.create({
        model: "gpt-4o",
        response_format: { type: "json_object" },
        max_tokens: 512,
        messages: [
            { role: "system", content: prompt_1.GET_TO_KNOW_SYSTEM_PROMPT },
            { role: "user", content: userTurn },
        ],
    });
    const raw = response.choices[0]?.message?.content ?? "{}";
    let parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch {
        console.error("[GetToKnow] Failed to parse LLM response:", raw);
        return { reply: null, profilePatch: {}, relationalPatch: {} };
    }
    console.log("[GetToKnow] raw LLM:", raw);
    console.log("[GetToKnow] parsed updates:", JSON.stringify(parsed.updates));
    const profilePatch = {};
    const relationalPatch = {};
    for (const update of parsed.updates ?? []) {
        const fieldName = update.field;
        if (types_1.LOCKED_FIELDS.has(fieldName) || types_1.SKIP_FIELDS.has(fieldName))
            continue;
        if (types_1.RELATIONAL_AGENT_FIELDS.has(fieldName)) {
            relationalPatch[fieldName] = String(update.value);
            continue;
        }
        const prismaCol = types_1.UPDATABLE_FIELD_MAP[fieldName];
        if (!prismaCol)
            continue;
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
    console.log("[GetToKnow] relationalPatch:", JSON.stringify(relationalPatch));
    return {
        reply: parsed.assistant_message ?? null,
        profilePatch,
        relationalPatch,
    };
}
