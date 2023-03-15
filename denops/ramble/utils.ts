import { assertString } from "./deps/unknownutil/mod.ts";
import { default as xdg } from "./deps/xdg/mod.ts";
import * as path from "./deps/std/path/mod.ts";
import { BlockLexer, TokenType } from "./deps/markdown/mod.ts";

import { ChatContents, Provider } from "./providers/Provider.ts";
import { ChatGpt, Config as ChatGptConfig } from "./providers/ChatGpt.ts";

type ProviderName = typeof ChatGpt.provider;

type Config = {
  [ChatGpt.provider]: ChatGptConfig;
};

export const configFilePath = path.join(
  xdg.config(),
  "ramble",
  "config.json",
);

const getConfig = () => {
  const raw = Deno.readTextFileSync(configFilePath);
  const config = JSON.parse(raw) as Config; // @fimex

  return config;
};

export function assertProvider(x: unknown): asserts x is ProviderName {
  assertString(x);

  // @fixme
  if (ChatGpt.provider !== x) {
    throw new Error(`"${x}" is not expected "Provider".`);
  }
}

export const getProvider = (provider: ProviderName): Provider => {
  const config = getConfig();

  if (provider === ChatGpt.provider) {
    return new ChatGpt(config[ChatGpt.provider]);
  }

  throw new Error(`"${provider}" is not expected "Provider".`);
};

export const parse = (body: string): ChatContents => {
  const result: ChatContents = { meta: { provider: "" }, blocks: [] };

  const p = BlockLexer.lex(body, { breaks: true });
  const provider = p.meta?.provider;
  assertProvider(provider);
  result.meta = { provider: String(provider), ...p.meta };

  let role = "";
  let content: string[] = [];
  let blockquote = 0;
  for (const [index, token] of p.tokens.entries()) {
    if (token.type === TokenType.heading && token.depth === 2) {
      if (role !== "") {
        result.blocks.push({ role, content: content.join("\n") });
      }

      role = token.text || "";
      content = [];

      continue;
    } else {
      if (token.type === TokenType.blockquoteStart) {
        blockquote++;
      }

      if (token.type === TokenType.blockquoteEnd) {
        blockquote--;
      }

      if (
        typeof token.text !== "undefined" || token.type === TokenType.space
      ) {
        const quote = [...new Array(blockquote)].map((_) => "> ").join("");
        const text = token.text || "";
        content.push(quote + text);
      }
    }

    if (index >= (p.tokens.length - 1)) {
      if (role !== "") {
        result.blocks.push({ role, content: content.join("\n") });
      }
      break;
    }
  }

  return result;
};
