import { ENV } from "./env.js";

export type OpenAIModelConfig = {
  model: string;
  maxTokens?: number;
  temperature?: number;
  apiKey?: string | undefined;
  baseUrl: string;
};

export function openaiModelConfig({
  maxTokens = 512,
  temperature = 0,
}: {
  maxTokens?: number;
  temperature?: number;
}): OpenAIModelConfig {
  return {
    model: ENV.AI_MODEL || "Qwen/Qwen2.5-7B-Instruct",
    maxTokens,
    temperature,
    apiKey: ENV.OPENAI_API_KEY,
    baseUrl: "https://api.featherless.ai/v1",
  };
}
