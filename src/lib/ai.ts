import OpenAI from "openai";
import { config } from "@/lib/config";

/**
 * Thin, deterministic wrapper around the OpenAI API used by every marketing
 * tool. When OpenAI is not configured the helpers throw a typed, recognizable
 * error so server actions can surface a clean "setup required" state instead of
 * crashing or fabricating data.
 */

export class AiNotConfiguredError extends Error {
  constructor() {
    super("AI is not configured. Set OPENAI_API_KEY to enable generation.");
    this.name = "AiNotConfiguredError";
  }
}

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!config.openai.isConfigured) throw new AiNotConfiguredError();
  if (!client) client = new OpenAI({ apiKey: config.openai.apiKey });
  return client;
}

export function isAiConfigured(): boolean {
  return config.openai.isConfigured;
}

interface TextOptions {
  system: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
}

/** Generate freeform text completion. */
export async function generateText({
  system,
  prompt,
  temperature = 0.7,
  maxTokens = 1200,
}: TextOptions): Promise<string> {
  const openai = getClient();
  const res = await openai.chat.completions.create({
    model: config.openai.model,
    temperature,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: system },
      { role: "user", content: prompt },
    ],
  });
  return res.choices[0]?.message?.content?.trim() ?? "";
}

/**
 * Generate a structured JSON object. The model is instructed to return JSON and
 * the response is parsed defensively.
 */
export async function generateJson<T>({
  system,
  prompt,
  temperature = 0.5,
  maxTokens = 1800,
}: TextOptions): Promise<T> {
  const openai = getClient();
  const res = await openai.chat.completions.create({
    model: config.openai.model,
    temperature,
    max_tokens: maxTokens,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `${system}\n\nRespond ONLY with a single valid JSON object. No markdown, no commentary.`,
      },
      { role: "user", content: prompt },
    ],
  });
  const raw = res.choices[0]?.message?.content?.trim() ?? "{}";
  try {
    return JSON.parse(raw) as T;
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as T;
    throw new Error("AI returned malformed JSON.");
  }
}

/** Generate an image and return its URL. */
export async function generateImage(prompt: string, size: "1024x1024" | "1792x1024" | "1024x1792" = "1024x1024"): Promise<string> {
  const openai = getClient();
  const res = await openai.images.generate({
    model: config.openai.imageModel,
    prompt,
    size,
    n: 1,
  });
  const url = res.data?.[0]?.url;
  if (!url) throw new Error("Image generation returned no result.");
  return url;
}
