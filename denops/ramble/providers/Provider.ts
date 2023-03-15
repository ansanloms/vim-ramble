export type ChatBlock = { role: string; content: string };
export type ChatContents = {
  meta:
    & Record<"provider", typeof Provider.provider>
    & Record<string, string | undefined>;
  blocks: ChatBlock[];
};

export abstract class Provider {
  public static readonly provider: string;

  public constructor() {
  }

  /**
   * chat format.
   */
  public format(block: ChatBlock): string[] {
    return [`${block.role}`, "---", "", ...block.content.split("\n"), ""];
  }

  /**
   * チャットバッファのテンプレートを作成する。
   */
  public abstract template(): string[];

  /**
   * 質問テンプレート。
   */
  public abstract question(content?: ChatBlock["content"]): string[];

  /**
   * チャットの結果を返却する。
   */
  public abstract chat(content: ChatContents): Promise<ChatBlock[]>;
}
