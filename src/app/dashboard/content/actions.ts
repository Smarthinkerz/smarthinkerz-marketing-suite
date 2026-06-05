"use server";

import { generateJson } from "@/lib/ai";
import { runToolAction, type ActionState } from "@/lib/tool-runner";

export interface ContentResult {
  title: string;
  body: string;
  variants: string[];
  hashtags: string[];
}

export async function generateContent(
  input: Record<string, string>,
): Promise<ActionState<ContentResult>> {
  const { contentType, topic, tone, audience, keywords } = input;
  const prompt = `Content type: ${contentType}\nTopic: ${topic}\nTone: ${tone}\nAudience: ${audience}\nKeywords: ${keywords}`;

  return runToolAction("content", prompt, () =>
    generateJson<ContentResult>({
      system:
        "You are an expert marketing copywriter. Produce publish-ready marketing content. Return JSON with keys: title (string), body (string, well-formatted with line breaks), variants (array of 3 alternative short versions), hashtags (array of up to 8 relevant hashtags without the # symbol).",
      prompt,
      temperature: 0.8,
    }),
  );
}
