import type { Config } from "./config.ts";
import { ChatOpenAI } from "./deps/@langchain/openai/mod.ts";

export const getModel = (
  llm: string,
  config: Config,
  meta?: Record<string, string | number | boolean>,
) => {
  if (llm === "openai") {
    return getOpenAIModel(config, meta);
  }
};

const getOpenAIModel = (
  config: Config,
  meta?: Record<string, string | number | boolean>,
) => {
  return new ChatOpenAI({
    apiKey: config.openai?.apiKey || "",
    model: String(meta?.model || "gpt-4o"),
    temperature: Number(meta?.temperature || 0),
    streaming: true,
  });
};
