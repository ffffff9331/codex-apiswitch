#!/usr/bin/env node

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const readline = require("node:readline");

const START = "# >>> codex-relay-profile";
const END = "# <<< codex-relay-profile";

function usage() {
  return `
codex-relay-profile

Configure a Codex custom provider profile for an OpenAI Responses-compatible relay API.

Usage:
  codex-relay-profile setup --name <profile> --base-url <url> --model <model>
  codex-relay-profile setup --name vayne --base-url https://api.example.com/v1 --model gpt-5.5
  codex-relay-profile remove --name <profile>

Options:
  --codex-home <dir>       Defaults to ~/.codex
  --key-file <path>        Defaults to ~/.codex/<profile>_api_key
  --key-env <env-name>     Use an environment variable instead of a local key file
  --force                  Overwrite an existing key file without prompting

Security:
  API keys are not written to config.toml. By default, the profile reads a local
  chmod 600 key file through a command-backed auth provider.
`.trim();
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const args = { command };

  for (let i = 0; i < rest.length; i += 1) {
    const item = rest[i];
    if (!item.startsWith("--")) {
      throw new Error(`Unexpected argument: ${item}`);
    }

    const key = item.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    if (key === "force") {
      args.force = true;
      continue;
    }

    const value = rest[i + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for ${item}`);
    }
    args[key] = value;
    i += 1;
  }

  return args;
}

function expandHome(input) {
  if (!input) return input;
  if (input === "~") return os.homedir();
  if (input.startsWith("~/")) return path.join(os.homedir(), input.slice(2));
  return input;
}

function validateName(name) {
  if (!/^[A-Za-z0-9_-]+$/.test(name || "")) {
    throw new Error("Profile name may only contain letters, numbers, underscores, and hyphens.");
  }
}

function tomlString(value) {
  return JSON.stringify(value);
}

function providerId(name) {
  return name.replace(/-/g, "_");
}

function managedBlock(name, options) {
  const id = providerId(name);
  const lines = [
    `${START}:${name}`,
    `[profiles.${name}]`,
    `model_provider = ${tomlString(id)}`,
    `model = ${tomlString(options.model)}`,
    `model_reasoning_effort = ${tomlString(options.reasoningEffort || "medium")}`,
    "",
    `[model_providers.${id}]`,
    `name = ${tomlString(options.displayName || name)}`,
    `base_url = ${tomlString(options.baseUrl)}`,
    `wire_api = "responses"`,
  ];

  if (options.keyEnv) {
    lines.push(`env_key = ${tomlString(options.keyEnv)}`);
  } else {
    lines.push(`auth.command = "cat"`);
    lines.push(`auth.args = [${tomlString(options.keyFile)}]`);
  }

  lines.push(`${END}:${name}`);
  return `${lines.join("\n")}\n`;
}

function removeManagedBlock(config, name) {
  const pattern = new RegExp(
    `\\n?${escapeRegExp(START)}:${escapeRegExp(name)}\\n[\\s\\S]*?${escapeRegExp(END)}:${escapeRegExp(name)}\\n?`,
    "g",
  );
  return config.replace(pattern, "\n").replace(/\n{3,}/g, "\n\n");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function readSecret(prompt) {
  if (!process.stdin.isTTY) {
    return fs.readFileSync(0, "utf8").trim();
  }

  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });

    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function setup(args) {
  validateName(args.name);
  if (!args.baseUrl) throw new Error("--base-url is required.");
  if (!args.model) throw new Error("--model is required.");

  const codexHome = expandHome(args.codexHome || "~/.codex");
  const configPath = path.join(codexHome, "config.toml");
  const keyFile = expandHome(args.keyFile || path.join(codexHome, `${args.name}_api_key`));

  fs.mkdirSync(codexHome, { recursive: true, mode: 0o700 });
  let config = fs.existsSync(configPath) ? fs.readFileSync(configPath, "utf8") : "";
  config = removeManagedBlock(config, args.name);

  if (!args.keyEnv) {
    if (!fs.existsSync(keyFile) || args.force) {
      const secret = await readSecret("API key: ");
      if (!secret) throw new Error("API key cannot be empty.");
      fs.writeFileSync(keyFile, `${secret}\n`, { mode: 0o600 });
      fs.chmodSync(keyFile, 0o600);
    }
  }

  const block = managedBlock(args.name, {
    baseUrl: args.baseUrl,
    model: args.model,
    keyFile,
    keyEnv: args.keyEnv,
  });

  const nextConfig = `${config.trimEnd()}\n\n${block}`;
  fs.writeFileSync(configPath, nextConfig, { mode: 0o600 });

  console.log(`Configured Codex profile: ${args.name}`);
  console.log(`Run: codex --profile ${args.name}`);
}

function remove(args) {
  validateName(args.name);
  const codexHome = expandHome(args.codexHome || "~/.codex");
  const configPath = path.join(codexHome, "config.toml");
  if (!fs.existsSync(configPath)) return;

  const config = fs.readFileSync(configPath, "utf8");
  fs.writeFileSync(configPath, removeManagedBlock(config, args.name), { mode: 0o600 });
  console.log(`Removed managed Codex profile block: ${args.name}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.command || args.command === "help" || args.command === "--help") {
    console.log(usage());
    return;
  }

  if (args.command === "setup") {
    await setup(args);
    return;
  }

  if (args.command === "remove") {
    remove(args);
    return;
  }

  throw new Error(`Unknown command: ${args.command}`);
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  console.error("");
  console.error(usage());
  process.exit(1);
});
