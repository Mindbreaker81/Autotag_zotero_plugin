// src/modules/llmProviders/deepseekProvider.ts

import type { LLMProvider } from "./LLMProvider";
import {
  getApiKeyForProvider,
  getBaseUrlForProvider,
  getCustomModelForProvider,
  getModelForProvider,
} from "../autotagPrefs";

declare const Zotero: _ZoteroTypes.Zotero;

function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

export const DeepSeekProvider: LLMProvider = {
  name: "deepseek",

  async generateTags(prompt: string): Promise<string> {
    const apiKey = getApiKeyForProvider("deepseek").trim();
    if (!apiKey) {
      throw new Error("DeepSeek API key not configured");
    }

    const customModel = getCustomModelForProvider("deepseek").trim();
    const selectedModel = getModelForProvider("deepseek").trim();
    const model = customModel || selectedModel;

    if (!model) {
      throw new Error(
        "No DeepSeek model selected. Open Autotag settings and choose a model.",
      );
    }

    const customBaseUrl = getBaseUrlForProvider("deepseek").trim();
    const baseUrl = normalizeBaseUrl(customBaseUrl || "https://api.deepseek.com/v1");
    const endpoint = `${baseUrl}/chat/completions`;

    const body = {
      model,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: "You must return ONLY valid JSON and no other text.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    };

    const response = await Zotero.HTTP.request("POST", endpoint, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey,
      },
      body: JSON.stringify(body),
    });

    const raw = (response as any).responseText;
    if (!raw) {
      throw new Error("Empty DeepSeek response");
    }

    const parsed = JSON.parse(raw);
    const content = parsed?.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("DeepSeek response missing message content");
    }

    return content;
  },
};