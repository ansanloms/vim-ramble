import { marked } from "./deps/marked/mod.ts";
import matter from "./deps/gray-matter/mod.ts";
import { is } from "./deps/@core/unknownutil/mod.ts";
import { ChatOpenAI } from "./deps/@langchain/openai/mod.ts";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "./deps/@langchain/core/messages/mod.ts";

type ChatMessage = {
  /**
   * role.
   */
  role: "system" | "assistant" | "user";

  /**
   * message.
   */
  message: string;
};

export type ChatContent = {
  /**
   * LLM.
   */
  llm: string;

  /**
   * messages.
   */
  messages: ChatMessage[];

  /**
   * meta.
   */
  meta?: Record<string, string | number | boolean>;
};

export const isChatMessageRole = is.UnionOf([
  is.LiteralOf("system"),
  is.LiteralOf("assistant"),
  is.LiteralOf("user"),
]);

const isChatContentMetaData = is.UnionOf([
  is.Number,
  is.String,
  is.Boolean,
]);

export const isChatContentMeta = is.RecordObjectOf<
  (string | number | boolean),
  string
>(isChatContentMetaData);

export const isChatMessage = is.ObjectOf({
  role: isChatMessageRole,
  message: is.String,
});

export const parse = (body: string) => {
  const { data: meta, content } = matter(body.trim());

  const chatContent: ChatContent = {
    llm: String(meta.llm || ""),
    messages: [],
    meta: Object.fromEntries(
      Object.entries(meta).filter((
        item,
      ): item is [string, number | string | boolean] =>
        item.at(0) !== "llm" && isChatContentMetaData(item.at(1))
      ),
    ),
  };

  for (const token of marked.lexer(content.trim())) {
    if (
      token.type === "heading" && token.depth === 2 &&
      isChatMessageRole(token.text)
    ) {
      chatContent.messages.push({ role: token.text, message: "" });
    } else if (chatContent.messages.length > 0) {
      chatContent.messages[chatContent.messages.length - 1].message +=
        token.raw;
    }
  }

  return chatContent;
};

export const toStringList = (chatContent: ChatContent) => {
  const metaTexts = Object.entries({
    llm: chatContent.llm,
    ...(chatContent.meta || {}),
  }).map((
    [k, v],
  ) => `${k}: ${v}`);

  const messagesTexts = chatContent.messages.map((
    message,
  ) => [message.role, "---", message.message, "", ""])
    .flat();

  return [
    "---",
    ...metaTexts,
    "---",
    "",
    ...messagesTexts,
  ];
};

export const chat = async (chatContent: ChatContent, apiKey: string) => {
  if (
    chatContent.messages.length <= 0 ||
    chatContent.messages.at(-1)?.role !== "user"
  ) {
    return undefined;
  }

  const model = new ChatOpenAI({
    apiKey,
    model: String(chatContent.meta?.model || "gpt-4o"),
    temperature: Number(chatContent.meta?.temperature || 0),
  });

  const messages = chatContent.messages.map((message) => {
    if (message.role == "system") {
      return new SystemMessage(message.message);
    }

    if (message.role == "assistant") {
      return new AIMessage(message.message);
    }

    return new HumanMessage(message.message);
  });

  return (await model.invoke(messages)).content.toString();
};
