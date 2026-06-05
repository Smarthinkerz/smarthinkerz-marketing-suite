"use server";

import { generateJson } from "@/lib/ai";
import { runToolAction, type ActionState } from "@/lib/tool-runner";

export interface SocialPost {
  platform: string;
  caption: string;
  hashtags: string[];
  bestTime: string;
}

export interface SocialResult {
  posts: SocialPost[];
}

export async function generateSocial(
  input: Record<string, string>,
): Promise<ActionState<SocialResult>> {
  const { topic, platforms, tone } = input;
  const prompt = `Topic: ${topic}\nPlatforms: ${platforms}\nTone: ${tone}`;

  return runToolAction("social", prompt, () =>
    generateJson<SocialResult>({
      system:
        "You are a social media manager. Create platform-optimized posts. Return JSON with key posts (array of {platform, caption, hashtags (array, no # symbol), bestTime (recommended posting time as a short phrase)}). Tailor caption length and style to each platform.",
      prompt,
      temperature: 0.85,
    }),
  );
}
