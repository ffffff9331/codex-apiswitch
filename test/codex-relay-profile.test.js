const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const bin = path.join(__dirname, "..", "bin", "codex-relay-profile.js");

describe("codex-relay-profile", () => {
  it("writes a managed profile without committing the key to config.toml", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "codex-relay-profile-"));
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
    assert.doesNotMatch(config, /sk-test/);
    assert.equal(fs.readFileSync(path.join(dir, "vayne_api_key"), "utf8"), "sk-test\n");
  });

  it("removes only the managed profile block", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "codex-relay-profile-"));
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
});
