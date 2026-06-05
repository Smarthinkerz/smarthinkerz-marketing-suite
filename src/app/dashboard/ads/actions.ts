"use server";

import { generateJson } from "@/lib/ai";
import { runToolAction, type ActionState } from "@/lib/tool-runner";

export interface AdVariant {
  headline: string;
  primaryText: string;
  description: string;
}

export interface AdResult {
  platform: string;
  variants: AdVariant[];
  targeting: string[];
  budgetTip: string;
  estimatedCtr: string;
}

export async function generateAds(
  input: Record<string, string>,
): Promise<ActionState<AdResult>> {
  const { platform, product, audience, objective } = input;
  const prompt = `Platform: ${platform}\nProduct/offer: ${product}\nAudience: ${audience}\nObjective: ${objective}`;

  return runToolAction("ads", prompt, () =>
    generateJson<AdResult>({
      system:
        "You are a paid-ads strategist. Create ad creative and a media plan. Return JSON with keys: platform (string), variants (array of 3 {headline, primaryText, description}), targeting (array of 5 audience/targeting suggestions), budgetTip (string with a concrete budget allocation recommendation), estimatedCtr (a realistic CTR range string like '1.2%–2.5%'). Keep headlines within platform character limits.",
      prompt,
      temperature: 0.8,
    }),
  );
}
