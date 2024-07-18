import type { Entrypoint } from "./deps/@denops/std/mod.ts";
import * as helper from "./deps/@denops/std/helper/mod.ts";
import { bufadd, bufload } from "./deps/@denops/std/function/mod.ts";
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
        messages = [
          { role: "system", message: "system message is here..." },
          {
            role: "user",
            message: "first question is here...",
          },
        ];
      }
      assert(messages, is.ArrayOf(chat.isChatMessage));

      const bufnr = await bufadd(denops, "");
      await bufload(denops, bufnr);

      await denops.cmd("vsplit | wincmd l | vertical resize 80");
      await denops.cmd(`buffer ${bufnr}`);
      await denops.cmd("setlocal filetype=ramble-chat");

      await denops.call(
        "appendbufline",
        bufnr,
        0,
        chat.toStringList({ llm, messages, meta }),
      );

      return bufnr;
    },

    /**
     * チャットする。
     */
    chat: async (bufnr) => {
      assert(bufnr, is.Number);
      await bufload(denops, bufnr);

      await helper.echo(denops, "loading...");

      await denops.call("appendbufline", bufnr, "$", ["", ""]);

      const bufline = await denops.call("getbufline", bufnr, 0, "$");
      assert(bufline, is.ArrayOf(is.String));

      const chatContent = chat.parse(bufline.join("\n"));
      const lastLine = bufline.length;

      const winids = await denops.call("win_findbuf", bufnr);
      assert(winids, is.ArrayOf(is.Number));

      await chat.chat(chatContent, config.config(), async (_, currentChunk) => {
        await Promise.all(
          winids.map(async (winid) => {
            await denops.call("win_execute", winid, `silent ${lastLine},$d`);
          }),
        );

        await denops.call("appendbufline", bufnr, "$", [
          ...chat.messageToStringList({
            role: "assistant",
            message: currentChunk?.content.toString() || "",
          }),
          "",
          "",
        ]);

        await Promise.all(
          winids.map(async (winid) => {
            await denops.call("win_execute", winid, "$");
          }),
        );
        if (winids.length > 0) {
          await denops.redraw();
        }
      });

      await denops.call("appendbufline", bufnr, "$", [
        ...chat.messageToStringList({
          role: "user",
          message: "",
        }),
      ]);
      await Promise.all(
        winids.map(async (winid) => {
          await denops.call("win_execute", winid, "$");
        }),
      );

      await helper.echo(denops, "");
    },
  };
};
