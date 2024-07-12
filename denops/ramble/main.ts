import type { Entrypoint } from "./deps/@denops/std/mod.ts";
import * as helper from "./deps/@denops/std/helper/mod.ts";
import { assert, is } from "./deps/@core/unknownutil/mod.ts";
import * as config from "./config.ts";
import * as chat from "./chat.ts";

export const main: Entrypoint = (denops) => {
  const bufload = async (bufnr: number) => {
    if (await denops.call("bufexists", bufnr)) {
      await denops.call("bufload", bufnr);
    } else {
      throw new Error(`Buffer: ${bufnr} does not exists.`);
    }
  };

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
      await bufload(bufnr);

      await helper.echo(denops, "loading...");

      const bufline = await denops.call(
        "getbufline",
        bufnr,
        0,
        "$",
      ) as string[];

      await chat.chat(
        chat.parse(bufline.join("\n")),
        config.config().openai.apiKey,
        async (_, currentChunk) => {
          await denops.cmd(`${bufline.length},$d`);
          await denops.call(
            "appendbufline",
            bufnr,
            "$",
            chat.messageToStringList({
              role: "assistant",
              message: currentChunk?.content.toString() || "",
            }),
          );
          await denops.cmd("redraw!");
        },
      );

      await denops.cmd("$");
      await helper.echo(denops, "");
    },
  };
};
