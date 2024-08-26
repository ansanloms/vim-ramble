import dir from "./deps/dir/mod.ts";
import { as, assert, is } from "./deps/@core/unknownutil/mod.ts";
import * as path from "./deps/@std/path/mod.ts";
import * as fs from "./deps/@std/fs/mod.ts";

type ConfigOpenAI = {
  apiKey: string;
};

type ConfigGoogleGenerativeAI = {
  apiKey: string;
};

export type Config = {
  OpenAI?: ConfigOpenAI;
  GoogleGenerativeAI?: ConfigGoogleGenerativeAI;
};

const isConfigOpenAI = is.ObjectOf({
  apiKey: is.String,
});

const isConfigGoogleGenerativeAI = is.ObjectOf({
  apiKey: is.String,
});

const isConfig = is.ObjectOf({
  OpenAI: as.Optional(isConfigOpenAI),
  GoogleGenerativeAI: as.Optional(isConfigGoogleGenerativeAI),
});

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

const getConfig = (): Config => {
  const configPath = getConfigPath();

  if (!fs.existsSync(configPath)) {
    Deno.mkdirSync(path.dirname(configPath), { recursive: true });
    Deno.writeTextFileSync(
      configPath,
      JSON.stringify({ openai: { apiKey: "" } }, undefined, 2),
    );
  }

  const config = JSON.parse(Deno.readTextFileSync(configPath));
  assert(config, isConfig);

  return config;
};

export { getConfig as config, getConfigPath as path };
