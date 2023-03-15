import { ChatBlock, ChatContents, Provider } from "./Provider.ts";
import type {
  ChatCompletionRequestMessage,
  CreateChatCompletionResponse,
} from "../deps/openai/index.ts";

export type Config = {
  token: string;
  system?: string[];
};

export class ChatGpt extends Provider {
  public static readonly provider = "chatgpt";

  private token: string;
  private system: string[];

  public constructor(config: Config) {
    super();

    this.token = config.token;
    this.system = config.system || [];
  }

  public template() {
    return [
      "---",
      `provider: ${ChatGpt.provider}`,
      "---",
      "",
    ].concat(
      ...this.system.map((v) => this.format({ role: "system", content: v }))
        .flat(),
    );
  }

  public question(content?: ChatBlock["content"]) {
    return this.format({ role: "user", content: content || "" });
  }

  public async chat(content: ChatContents) {
    const systemMessages: ChatCompletionRequestMessage[] = content.blocks
      .filter((v) => v.role === "system")
      .map((v) => ({ role: "system", content: v.content }));

    const prevMessages: ChatCompletionRequestMessage[] = content.blocks
      .filter((v) => v.role === "user" || v.role === "assistant")
      .map((v) => ({
        role: v.role as ChatCompletionRequestMessage["role"],
        content: v.content,
      }));

    //const openai = new OpenAIApi(new Configuration({ apiKey: this.token }));
    //const completion = await openai.createChatCompletion({
    //  model: "gpt-3.5-turbo",
    //  messages: [...systemMessages, ...prevMessages ],
    //});

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.token}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [...systemMessages, ...prevMessages],
      }),
    });

    const data = (await response.json()) as CreateChatCompletionResponse;

    const assistantMessages = data.choices.map<ChatBlock>((v) => ({
      role: v.message?.role || "assistant",
      content: v.message?.content || "",
    }));

    return assistantMessages;
  }
}
