import type { Denops } from "./deps/denops_std/mod.ts";
import * as autocmd from "./deps/denops_std/autocmd/mod.ts";
import * as helper from "./deps/denops_std/helper/mod.ts";
import { assertNumber, assertString } from "./deps/unknownutil/mod.ts";
import { assertProvider, configFilePath, getProvider, parse } from "./utils.ts";

export async function main(denops: Denops) {
  const bufload = async (bufnr: number) => {
    if (await denops.call("bufexists", bufnr)) {
      await denops.call("bufload", bufnr);
    } else {
      throw new Error(`Buffer: ${bufnr} does not exists.`);
    }
  };

  const getContent = async (bufnr: number) => {
    await bufload(bufnr);

    const body = (await denops.call("getbufline", bufnr, 0, "$") as string[])
      .join("\n");
    const content = parse(body);

    return content;
  };

  denops.dispatcher = {
    config: async () => {
      return configFilePath;
    },

    open: async (bufnr, providerName) => {
      assertNumber(bufnr);
      assertProvider(providerName);

      await bufload(bufnr);

      const provider = getProvider(providerName);

      await denops.call("deletebufline", bufnr, 1, "$");
      await denops.call(
        "appendbufline",
        bufnr,
        0,
        provider.template(),
      );

      await denops.cmd("$");
    },

    append: async (bufnr, question) => {
      assertNumber(bufnr);
      assertString(question);

      await bufload(bufnr);

      const content = await getContent(bufnr);
      assertProvider(content.meta.provider);

      const provider = getProvider(content.meta.provider);

      await denops.call(
        "appendbufline",
        bufnr,
        "$",
        ["", ...provider.question(question)],
      );

      await denops.cmd("$");
    },

    chat: async (bufnr) => {
      assertNumber(bufnr);

      const content = await getContent(bufnr);
      assertProvider(content.meta.provider);

      await helper.echo(denops, "loading...");

      const provider = getProvider(content.meta.provider);
      const blocks = await provider.chat(content);

      await denops.call(
        "appendbufline",
        bufnr,
        "$",
        blocks.map((block) => provider.format(block)).flat(),
      );

      await denops.cmd("$");
      await helper.echo(denops, "");
    },
  };
}
