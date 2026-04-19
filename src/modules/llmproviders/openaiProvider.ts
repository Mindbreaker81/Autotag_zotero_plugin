// src/modules/llmProviders/openaiProvider.ts

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

export const OpenAIProvider: LLMProvider = {
  name: "openai",

  async generateTags(prompt: string): Promise<string> {
    const apiKey = getApiKeyForProvider("openai").trim();
    if (!apiKey) {
      throw new Error("OpenAI API key not configured");
    }

    const customModel = getCustomModelForProvider("openai").trim();
    const selectedModel = getModelForProvider("openai").trim();
    const model = customModel || selectedModel;

    if (!model) {
      throw new Error(
        "No OpenAI model selected. Open Autotag settings and choose a model.",
      );
    }

    const customBaseUrl = getBaseUrlForProvider("openai").trim();
    const baseUrl = normalizeBaseUrl(customBaseUrl || "https://api.openai.com/v1");
    const endpoint = `${baseUrl}/chat/completions`;

    const body = {
      model,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are a careful assistant that ALWAYS returns ONLY valid JSON.",
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
      throw new Error("Empty OpenAI response");
    }

    const parsed = JSON.parse(raw);
    const content = parsed?.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("OpenAI response missing message content");
    }

    return content;
  },
};