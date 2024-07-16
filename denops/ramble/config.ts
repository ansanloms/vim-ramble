import dir from "./deps/dir/mod.ts";
import * as path from "./deps/@std/path/mod.ts";
import * as fs from "./deps/@std/fs/mod.ts";

const getBaseConfigPath = () => {
  const configDirectory = dir("config");
  if (configDirectory) {
    return configDirectory;
  }

  const homeDirectory = dir("home");
  if (homeDirectory) {
    return path.join(homeDirectory, ".config");
  }
};

const getConfigPath = () => {
  const baseConfigDir = getBaseConfigPath();
  if (typeof baseConfigDir === "undefined") {
    throw new Error("Failed to get config.");
  }

  return path.join(baseConfigDir, "ramble/config.json");
};

const getConfig = () => {
  const configPath = getConfigPath();

  if (!(fs.existsSync(configPath))) {
    Deno.mkdirSync(path.dirname(configPath), { recursive: true });
    Deno.writeTextFileSync(
      configPath,
      JSON.stringify({ openai: { apiKey: "" } }, undefined, 2),
    );
  }

  return JSON.parse(Deno.readTextFileSync(configPath)) as {
    openai: { apiKey: string };
  }; // @todo
};

export { getConfig as config, getConfigPath as path };
