import * as chat from "./chat.ts";
import { assertEquals } from "./deps/@std/assert/mod.ts";

Deno.test("markdown のパース確認。 @todo", () => {
  const markdown = `---
llm: OpenAI
model: gpt-4o-mini
---

system
--------




user
--------

こんにちは


assistant
--------

こんにちは！どのようにお手伝いできますか？


user
--------`;

  assertEquals(chat.parse(markdown), {
    llm: "OpenAI",
    meta: { model: "gpt-4o-mini" },
    messages: [
      { role: "system", type: "text", message: "" },
      { role: "user", type: "text", message: "こんにちは\n\n" },
      {
        role: "assistant",
        type: "text",
        message: "こんにちは！どのようにお手伝いできますか？\n\n",
      },
      {
        message: "",
        role: "user",
        type: "text",
      },
    ],
  });
});
