import type { Config } from "./config.ts";
import type { ChatContent } from "./chat.ts";
import { ChatOpenAI } from "./deps/@langchain/openai/mod.ts";
import { ChatGoogleGenerativeAI } from "./deps/@langchain/google-genai/mod.ts";

export const getModel = (
  llm: ChatContent["llm"],
  config: Config,
  meta?: Record<string, string | number | boolean>,
) => {
  if (llm === "OpenAI") {
    return getOpenAIModel(config, meta);
  }

  if (llm === "GoogleGenerativeAI") {
    return getGoogleGenerativeAIModel(config, meta);
  }

  return undefined;
};

const getOpenAIModel = (
  config: Config,
  meta?: Record<string, string | number | boolean>,
) => {
  return new ChatOpenAI({
    apiKey: config.openAI?.apiKey,
    model: String(meta?.model || "gpt-4o"),
    temperature: Number(meta?.temperature || 0),
    streaming: true,
  });
};

const getGoogleGenerativeAIModel = (
  config: Config,
  meta?: Record<string, string | number | boolean>,
) => {
  return new ChatGoogleGenerativeAI({
    apiKey: config.googleGenerativeAI?.apiKey,
    model: String(meta?.model || "gemini-pro"),
    maxOutputTokens: Number(meta?.maxOutputTokens || 2048),
    streaming: true,
  });
};
