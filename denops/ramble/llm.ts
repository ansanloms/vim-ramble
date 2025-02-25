import type { Config } from "./config.ts";
import type { ChatContent } from "./chat.ts";
import { ChatOpenAI } from "./deps/@langchain/openai/mod.ts";
import { ChatGoogleGenerativeAI } from "./deps/@langchain/google-genai/mod.ts";
import { ChatAnthropic } from "./deps/@langchain/anthropic/mod.ts";

type Meta = Record<string, string | number | boolean>;

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

  if (llm === "Anthropic") {
    return getAnthropicModel(config, meta);
  }

  throw new Error("Invalid model.");
};

const getOpenAIModel = (config: Config, meta?: Meta) => {
  return new ChatOpenAI({
    apiKey: config.OpenAI?.apiKey,
    model: String(meta?.model ?? "gpt-4o"),
    temperature: meta?.temperature ? Number(meta?.temperature) : undefined,
    streaming: true,
  });
};

const getGoogleGenerativeAIModel = (config: Config, meta?: Meta) => {
  return new ChatGoogleGenerativeAI({
    apiKey: config.Google?.apiKey,
    model: String(meta?.model ?? "gemini-pro"),
    maxOutputTokens: Number(meta?.maxOutputTokens ?? 2048),
    streaming: true,
  });
};

const getAnthropicModel = (config: Config, meta?: Meta) => {
  return new ChatAnthropic({
    apiKey: config.Anthropic?.apiKey,
    model: String(meta?.model ?? "claude-3-7-sonnet-20250219"),
    streaming: true,
  });
};
