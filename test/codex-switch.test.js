const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const bin = path.join(__dirname, "..", "bin", "codex-switch.js");

describe("codex-switch", () => {
  it("writes a managed profile without committing the key to config.toml", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "codex-switch-"));
    const result = spawnSync(
      process.execPath,
      [
        bin,
        "setup",
        "--codex-home",
        dir,
        "--name",
        "vayne",
        "--base-url",
        "https://api.vayne.cc.cd/v1",
        "--model",
        "gpt-5.5",
      ],
      {
        input: "sk-test\n",
        encoding: "utf8",
      },
    );

    assert.equal(result.status, 0, result.stderr);
    const config = fs.readFileSync(path.join(dir, "config.toml"), "utf8");
    assert.match(config, /\[profiles\.vayne\]/);
    assert.match(config, /base_url = "https:\/\/api\.vayne\.cc\.cd\/v1"/);
    assert.match(config, /auth\.command = "cat"/);
    assert.match(config, /model_catalog_json = ".+vayne_models\.json"/);
    assert.doesNotMatch(config, /sk-test/);
    assert.equal(fs.readFileSync(path.join(dir, "vayne_api_key"), "utf8"), "sk-test\n");
    const catalog = JSON.parse(fs.readFileSync(path.join(dir, "codex-switch", "vayne_models.json"), "utf8"));
    assert.equal(catalog.models[0].slug, "gpt-5.5");
    assert.equal(catalog.models[0].visibility, "list");
  });

  it("removes only the managed profile block", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "codex-switch-"));
    spawnSync(
      process.execPath,
      [
        bin,
        "setup",
        "--codex-home",
        dir,
        "--name",
        "vayne",
        "--base-url",
        "https://api.vayne.cc.cd/v1",
        "--model",
        "gpt-5.5",
      ],
      {
        input: "sk-test\n",
        encoding: "utf8",
      },
    );

    const result = spawnSync(process.execPath, [bin, "remove", "--codex-home", dir, "--name", "vayne"], {
      encoding: "utf8",
    });

    assert.equal(result.status, 0, result.stderr);
    const config = fs.readFileSync(path.join(dir, "config.toml"), "utf8");
    assert.doesNotMatch(config, /\[profiles\.vayne\]/);
  });

  it("can delete the local key file when removing a profile", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "codex-switch-"));
    spawnSync(
      process.execPath,
      [
        bin,
        "setup",
        "--codex-home",
        dir,
        "--name",
        "vayne",
        "--base-url",
        "https://api.vayne.cc.cd/v1",
        "--model",
        "gpt-5.5",
      ],
      { input: "sk-test\n", encoding: "utf8" },
    );

    const result = spawnSync(
      process.execPath,
      [bin, "remove", "--codex-home", dir, "--name", "vayne", "--delete-key"],
      { encoding: "utf8" },
    );

    assert.equal(result.status, 0, result.stderr);
    assert.equal(fs.existsSync(path.join(dir, "vayne_api_key")), false);
  });

  it("can store multiple relay profiles", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "codex-switch-"));
    const first = spawnSync(
      process.execPath,
      [
        bin,
        "setup",
        "--codex-home",
        dir,
        "--name",
        "vayne",
        "--base-url",
        "https://api.vayne.cc.cd/v1",
        "--model",
        "gpt-5.5",
      ],
      { input: "sk-one\n", encoding: "utf8" },
    );
    const second = spawnSync(
      process.execPath,
      [
        bin,
        "setup",
        "--codex-home",
        dir,
        "--name",
        "backup",
        "--base-url",
        "https://relay.example.com/v1",
        "--model",
        "gpt-5.4",
      ],
      { input: "sk-two\n", encoding: "utf8" },
    );

    assert.equal(first.status, 0, first.stderr);
    assert.equal(second.status, 0, second.stderr);
    const config = fs.readFileSync(path.join(dir, "config.toml"), "utf8");
    assert.match(config, /\[profiles\.vayne\]/);
    assert.match(config, /\[profiles\.backup\]/);
    assert.match(config, /base_url = "https:\/\/api\.vayne\.cc\.cd\/v1"/);
    assert.match(config, /base_url = "https:\/\/relay\.example\.com\/v1"/);
    assert.doesNotMatch(config, /sk-one|sk-two/);
  });

  it("updates the model for an existing managed profile without replacing the key", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "codex-switch-"));
    const setup = spawnSync(
      process.execPath,
      [
        bin,
        "setup",
        "--codex-home",
        dir,
        "--name",
        "vayne",
        "--base-url",
        "https://api.vayne.cc.cd/v1",
        "--model",
        "gpt-5.5",
      ],
      { input: "sk-one\n", encoding: "utf8" },
    );
    assert.equal(setup.status, 0, setup.stderr);

    const result = spawnSync(
      process.execPath,
      [
        bin,
        "model",
        "--codex-home",
        dir,
        "--name",
        "vayne",
        "--model",
        "gpt-5.4",
      ],
      { encoding: "utf8" },
    );

    assert.equal(result.status, 0, result.stderr);
    const config = fs.readFileSync(path.join(dir, "config.toml"), "utf8");
    assert.match(config, /model = "gpt-5\.4"/);
    assert.doesNotMatch(config, /model = "gpt-5\.5"/);
    assert.match(config, /base_url = "https:\/\/api\.vayne\.cc\.cd\/v1"/);
    assert.equal(fs.readFileSync(path.join(dir, "vayne_api_key"), "utf8"), "sk-one\n");
    const catalog = JSON.parse(fs.readFileSync(path.join(dir, "codex-switch", "vayne_models.json"), "utf8"));
    assert.deepEqual(
      catalog.models.map((model) => model.slug).sort(),
      ["gpt-5.4", "gpt-5.5"],
    );
  });

  it("sets a default profile using the config key", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "codex-switch-"));
    const setup = spawnSync(
      process.execPath,
      [
        bin,
        "setup",
        "--codex-home",
        dir,
        "--name",
        "vayne",
        "--base-url",
        "https://api.vayne.cc.cd/v1",
        "--model",
        "gpt-5.5",
      ],
      { input: "sk-one\n", encoding: "utf8" },
    );
    assert.equal(setup.status, 0, setup.stderr);

    const configPath = path.join(dir, "config.toml");
    const original = fs.readFileSync(configPath, "utf8");
    fs.writeFileSync(configPath, `profile = "old"\n${original}`);

    const result = spawnSync(
      process.execPath,
      [
        bin,
        "default",
        "--codex-home",
        dir,
        "--name",
        "vayne",
      ],
      { encoding: "utf8" },
    );

    assert.equal(result.status, 0, result.stderr);
    assert.match(fs.readFileSync(configPath, "utf8"), /^profile = "vayne"$/m);
  });

  it("lists account and managed relay profiles", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "codex-switch-"));
    const setup = spawnSync(
      process.execPath,
      [
        bin,
        "setup",
        "--codex-home",
        dir,
        "--name",
        "vayne",
        "--base-url",
        "https://api.vayne.cc.cd/v1",
        "--model",
        "gpt-5.5",
      ],
      { input: "sk-one\n", encoding: "utf8" },
    );
    assert.equal(setup.status, 0, setup.stderr);

    const result = spawnSync(process.execPath, [bin, "list", "--codex-home", dir], {
      encoding: "utf8",
    });

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Current: account/);
    assert.match(result.stdout, / account/);
    assert.match(result.stdout, / vayne/);
    assert.match(result.stdout, /model: gpt-5\.5/);
    assert.match(result.stdout, /base_url: https:\/\/api\.vayne\.cc\.cd\/v1/);
  });

  it("switches back to account login by clearing the profile key", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "codex-switch-"));
    const configPath = path.join(dir, "config.toml");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(configPath, 'profile = "vayne"\nmodel = "gpt-5.5"\n');

    const result = spawnSync(
      process.execPath,
      [bin, "account", "--codex-home", dir],
      { encoding: "utf8" },
    );

    assert.equal(result.status, 0, result.stderr);
    const config = fs.readFileSync(configPath, "utf8");
    assert.doesNotMatch(config, /^profile\s*=/m);
    assert.match(config, /^model = "gpt-5\.5"$/m);
  });

  it("updates the latest desktop thread model in the state database", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "codex-switch-"));
    const dbPath = path.join(dir, "state_5.sqlite");
    spawnSync(
      "sqlite3",
      [
        dbPath,
        [
          "create table threads (id text primary key, archived integer default 0, model text, model_provider text, created_at integer, updated_at integer, created_at_ms integer, updated_at_ms integer);",
          "insert into threads (id, archived, model, model_provider, created_at, updated_at, created_at_ms, updated_at_ms) values ('old-thread', 0, 'gpt-5.5', 'openai', 1, 1, 1000, 1000);",
          "insert into threads (id, archived, model, model_provider, created_at, updated_at, created_at_ms, updated_at_ms) values ('new-thread', 0, 'gpt-5.5', 'openai', 2, 2, 2000, 2000);",
        ].join(" "),
      ],
      { encoding: "utf8" },
    );

    const result = spawnSync(
      process.execPath,
      [
        bin,
        "thread-model",
        "--state-db",
        dbPath,
        "--provider",
        "vayne",
        "--model",
        "claude-opus-4-7",
      ],
      { encoding: "utf8" },
    );

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Updated thread model: new-thread/);
    assert.match(result.stdout, /Backup:/);
    const rows = spawnSync(
      "sqlite3",
      [dbPath, "select id || '|' || model || '|' || model_provider from threads order by id;"],
      { encoding: "utf8" },
    );
    assert.equal(rows.status, 0, rows.stderr);
    assert.match(rows.stdout, /new-thread\|claude-opus-4-7\|vayne/);
    assert.match(rows.stdout, /old-thread\|gpt-5\.5\|openai/);
    assert.equal(fs.readdirSync(dir).filter((name) => name.includes(".bak")).length, 1);
  });

  it("advertises the web UI command", () => {
    const result = spawnSync(process.execPath, [bin, "--help"], {
      encoding: "utf8",
    });

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /codex-switch web/);
    assert.match(result.stdout, /codex-switch list/);
    assert.match(result.stdout, /codex-switch account/);
    assert.match(result.stdout, /--delete-key/);
    assert.match(result.stdout, /--port <port>/);
    assert.match(result.stdout, /codex-switch model --name <profile> --model <model>/);
    assert.match(result.stdout, /codex-switch thread-model --model <model>/);
  });
});
