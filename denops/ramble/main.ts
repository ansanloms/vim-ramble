import type { Entrypoint } from "./deps/@denops/std/mod.ts";
import * as helper from "./deps/@denops/std/helper/mod.ts";
import { bufload } from "./deps/@denops/std/function/mod.ts";
import { assert, is } from "./deps/@core/unknownutil/mod.ts";
import * as config from "./config.ts";
import * as chat from "./chat.ts";

export const main: Entrypoint = (denops) => {
  denops.dispatcher = {
    /**
     * 設定ファイルを開く。
     */
    config: async () => {
      await denops.cmd(`edit ${config.path()}`);
    },

    /**
     * 新しいチャットバッファを作成する。
     */
    new: async (llm, meta?, messages?) => {
      assert(llm, is.String);

      if (!is.Undefined(meta)) {
        assert(meta, chat.isChatContentMeta);
      }

      if (is.Undefined(messages)) {
        messages = [{ role: "system", message: "system message is here..." }, {
          role: "user",
          message: "first question is here...",
        }];
      }
      assert(messages, is.ArrayOf(chat.isChatMessage));

      await denops.cmd("vertical botright new");
      await denops.cmd("setlocal ft=markdown");
      await denops.call(
        "append",
        0,
        chat.toStringList({ llm, messages, meta }),
      );
    },

    /**
     * チャットする。
     */
    chat: async (bufnr) => {
      assert(bufnr, is.Number);
      await bufload(denops, bufnr);

      await helper.echo(denops, "loading...");

      await denops.call(
        "appendbufline",
        bufnr,
        "$",
        ["", ""],
      );

      const bufline = await denops.call(
        "getbufline",
        bufnr,
        0,
        "$",
      ) as string[];

      const chatContent = chat.parse(bufline.join("\n"));
      const lastLine = bufline.length;

      await chat.chat(
        chatContent,
        config.config().openai.apiKey,
        async (_, currentChunk) => {
          await denops.cmd(`silent ${lastLine},$d`);
          await denops.call(
            "appendbufline",
            bufnr,
            "$",
            [
              ...chat.messageToStringList({
                role: "assistant",
                message: currentChunk?.content.toString() || "",
              }),
              "",
              "",
            ],
          );
          await denops.cmd("$");
          await denops.redraw();
        },
      );

      await denops.call(
        "appendbufline",
        bufnr,
        "$",
        [
          ...chat.messageToStringList({
            role: "user",
            message: "",
          }),
        ],
      );
      await denops.cmd("$");
      await helper.echo(denops, "");
    },
  };
};
