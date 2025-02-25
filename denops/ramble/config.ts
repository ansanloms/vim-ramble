import dir from "./deps/dir/mod.ts";
import * as path from "./deps/@std/path/mod.ts";
import * as fs from "./deps/@std/fs/mod.ts";
import { FromSchema } from "./deps/json-schema-to-ts/mod.ts";
import { betterAjvErrors } from "./deps/@apideck/better-ajv-errors/mod.ts";
import Ajv from "./deps/ajv/mod.ts";

import schema from "./schemas/config.json" with { type: "json" };

export type Config = FromSchema<typeof schema>;

const ajv = new Ajv();

function assertConfig(x: unknown): asserts x is Config {
  const _schema = Object.assign({}, schema);
  delete _schema["$schema"];
  delete _schema["$id"];

  const validate = ajv.compile(_schema);
  const valid = validate(x);
  if (!valid) {
    const betterErrors = betterAjvErrors({
      schema: _schema,
      data: x,
      errors: validate.errors,
    });
    throw new Error(
      "Invalid format: " + JSON.stringify(betterErrors, null, 2),
    );
  }
}

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
  assertConfig(config);

  return config;
};

export { getConfig as config, getConfigPath as path };
