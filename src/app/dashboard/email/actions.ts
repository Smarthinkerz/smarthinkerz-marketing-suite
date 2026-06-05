"use server";

import { generateJson } from "@/lib/ai";
import { runToolAction, type ActionState } from "@/lib/tool-runner";

export interface EmailResult {
  subjectLines: string[];
  preheader: string;
  body: string;
  cta: string;
}

export async function generateEmail(
  input: Record<string, string>,
): Promise<ActionState<EmailResult>> {
  const { goal, product, audience, tone } = input;
  const prompt = `Goal: ${goal}\nProduct/offer: ${product}\nAudience: ${audience}\nTone: ${tone}`;

  return runToolAction("email", prompt, () =>
    generateJson<EmailResult>({
      system:
        "You are an email marketing expert. Write a high-converting marketing email. Return JSON with keys: subjectLines (array of 5 A/B subject line options), preheader (string), body (string, formatted with line breaks, persuasive and scannable), cta (call-to-action button text).",
      prompt,
      temperature: 0.75,
    }),
  );
}
