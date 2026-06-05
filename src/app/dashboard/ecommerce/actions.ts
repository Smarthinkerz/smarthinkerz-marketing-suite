"use server";

import { generateJson } from "@/lib/ai";
import { runToolAction, type ActionState } from "@/lib/tool-runner";

export interface EcommerceResult {
  optimizedTitle: string;
  bulletPoints: string[];
  description: string;
  keywords: string[];
  improvements: string[];
}

export async function optimizeListing(
  input: Record<string, string>,
): Promise<ActionState<EcommerceResult>> {
  const { productName, features, platform } = input;
  const prompt = `Product: ${productName}\nKey features/details: ${features}\nMarketplace: ${platform}`;

  return runToolAction("ecommerce", prompt, () =>
    generateJson<EcommerceResult>({
      system:
        "You are an e-commerce conversion expert. Optimize a product listing for the given marketplace. Return JSON with keys: optimizedTitle (string, keyword-rich, within platform limits), bulletPoints (array of 5 benefit-driven bullets), description (string, persuasive, formatted), keywords (array of up to 10 search keywords), improvements (array of 3-5 specific recommendations to boost conversion).",
      prompt,
      temperature: 0.6,
    }),
  );
}
