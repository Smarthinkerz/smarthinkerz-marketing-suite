"use server";

import { generateJson } from "@/lib/ai";
import { runToolAction, type ActionState } from "@/lib/tool-runner";

export interface KeywordRow {
  keyword: string;
  intent: string;
  difficulty: "Low" | "Medium" | "High";
  opportunity: string;
}

export interface SeoResult {
  primaryKeywords: KeywordRow[];
  longTail: string[];
  contentIdeas: string[];
  metaTitle: string;
  metaDescription: string;
}

export async function generateSeo(
  input: Record<string, string>,
): Promise<ActionState<SeoResult>> {
  const { topic, region } = input;
  const prompt = `Seed topic: ${topic}\nTarget region/market: ${region || "Global"}`;

  return runToolAction("seo", prompt, () =>
    generateJson<SeoResult>({
      system:
        "You are an SEO strategist. Given a seed topic, produce a keyword & content plan. Return JSON with keys: primaryKeywords (array of {keyword, intent, difficulty ['Low'|'Medium'|'High'], opportunity}), longTail (array of 8 long-tail keyword phrases), contentIdeas (array of 6 content/article ideas), metaTitle (string <= 60 chars), metaDescription (string <= 155 chars).",
      prompt,
      temperature: 0.5,
    }),
  );
}
