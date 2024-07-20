import { marked } from "./deps/marked/mod.ts";
import matter from "./deps/gray-matter/mod.ts";
import { assert, is } from "./deps/@core/unknownutil/mod.ts";
import {
  AIMessage,
  AIMessageChunk,
  HumanMessage,
  SystemMessage,
} from "./deps/@langchain/core/messages/mod.ts";
import { concat } from "./deps/@langchain/core/utils/stream/mod.ts";
import type { Config } from "./config.ts";
import * as llm from "./llm.ts";

type ChatMessage = {
  /**
   * role.
   */
  role: "system" | "assistant" | "user";

  /**
   * type.
   */
  type: "text" | "image_url";

  /**
   * message.
   */
  message: string;
};

export type ChatContent = {
  /**
   * LLM.
   */
  llm: keyof Config;

  /**
   * messages.
   */
  messages: ChatMessage[];

  /**
   * meta.
   */
  meta?: Record<string, string | number | boolean>;
};

export const isChatContentLlm = is.UnionOf([
  is.LiteralOf("OpenAI"),
  is.LiteralOf("GoogleGenerativeAI"),
]);

export const isChatMessageRole = is.UnionOf([
  is.LiteralOf("system"),
  is.LiteralOf("assistant"),
  is.LiteralOf("user"),
]);

export const isChatMessageType = is.UnionOf([
  is.LiteralOf("text"),
  is.LiteralOf("image_url"),
]);

const isChatContentMetaData = is.UnionOf([is.Number, is.String, is.Boolean]);

export const isChatContentMeta = is.RecordObjectOf<
  string | number | boolean,
  string
>(isChatContentMetaData);

export const isChatMessage = is.ObjectOf({
  role: isChatMessageRole,
  type: isChatMessageType,
  message: is.String,
});

export const parse = (body: string): ChatContent => {
  const { data, content } = matter(body.trim());

  const llm = parseLlm(data) || "OpenAI";
  const messages = parseMessages(content);
  const meta = parseMeta(data);

  return { llm, meta, messages };
};

const parseLlm = (data: {
  [key: string]: unknown;
}): ChatContent["llm"] | undefined => {
  const llm = String(data.llm || "");

  return isChatContentLlm(llm) ? llm : undefined;
};

const parseMeta = (data: {
  [key: string]: unknown;
}): ChatContent["meta"] => {
  return Object.fromEntries(
    Object.entries(data).filter(
      (item): item is [string, number | string | boolean] =>
        item.at(0) !== "llm" && isChatContentMetaData(item.at(1)),
    ),
  );
};

const parseMessages = (data: string): ChatContent["messages"] => {
  const messages: ChatContent["messages"] = [];

  for (const token of marked.lexer(data.trim())) {
    const [role, type] = token.type === "heading" &&
        token.depth === 2
      ? String(token.text).split(":", 2).map((v) => v.trim())
      : [undefined, undefined];

    if (is.String(role)) {
      assert(role, isChatMessageRole);
      if (!is.Undefined(type)) {
        assert(type, isChatMessageType);
      }

      messages.push({
        role,
        type: type || "text",
        message: "",
      });
    } else if (messages.length > 0) {
      messages[messages.length - 1].message += token.raw;
    }
  }

  return messages;
};

export const toStringList = (chatContent: ChatContent) => {
  const metaTexts = Object.entries({
    llm: chatContent.llm,
    ...(chatContent.meta || {}),
  }).map(([k, v]) => `${k}: ${v}`);

  const messagesTexts = chatContent.messages
    .map((message) => [...messageToStringList(message), "", ""])
    .flat();

  return ["---", ...metaTexts, "---", "", ...messagesTexts];
};

export const messageToStringList = (message: ChatMessage) => {
  return [
    `${message.role}${message.type === "image_url" ? ":image_url" : ""}`,
    "---",
    "",
    ...message.message.trim().split("\n"),
  ];
};

export const chat = async (
  chatContent: ChatContent,
  config: Config,
  callback?: (
    chunk: AIMessageChunk,
    currentChunk: AIMessageChunk | undefined,
  ) => Promise<void>,
) => {
  if (
    chatContent.messages.length <= 0 ||
    chatContent.messages.at(-1)?.role !== "user"
  ) {
    return undefined;
  }

  const model = llm.getModel(chatContent.llm, config, chatContent.meta);
  if (!model) {
    return undefined;
  }

  const messages = chatContent.messages.map((message) => {
    if (message.role == "system") {
      return new SystemMessage({
        content: [{
          type: "text",
          text: message.message,
        }],
      });
    }

    if (message.role == "assistant") {
      return new AIMessage({
        content: [{
          type: "text",
          text: message.message,
        }],
      });
    }

    if (message.type === "image_url") {
      // @todo
    }

    return new HumanMessage({
      content: [{
        type: "text",
        text: message.message,
      }],
    });
  });

  let currentChunk: AIMessageChunk | undefined;
  const stream = await model.stream(messages, {
    stream_options: {
      include_usage: true,
    },
  });

  for await (const chunk of stream) {
    currentChunk = currentChunk ? concat(currentChunk, chunk) : chunk;
    if (callback) {
      await callback(chunk, currentChunk);
    }
  }

  return currentChunk?.content.toString();
};
