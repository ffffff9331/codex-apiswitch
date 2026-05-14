# codex-switch

Small local web UI and CLI for adding OpenAI Responses-compatible relay API profiles to Codex.

It edits `~/.codex/config.toml` and stores the API key outside the config file in a local `chmod 600` key file.
It also writes a profile-scoped Codex model catalog at `~/.codex/codex-switch/<profile>_models.json`. Codex CLI can read this catalog; Codex Desktop may still hide custom provider models in its built-in model picker.

## Install

This project is currently distributed from GitHub, not from the npm registry.

Install directly from GitHub:

```bash
npm install -g github:ffffff9331/codex-switch
```

Then start the web UI:

```bash
codex-switch web
```

If you cloned the repository, you can run it without installing globally:

```bash
node bin/codex-switch.js web
```

For local development, you can link the checkout as a global command:

```bash
git clone https://github.com/ffffff9331/codex-switch.git
cd codex-switch
npm install -g .
codex-switch web
```

The package name `codex-switch` may exist on the public npm registry, but this project is not published there yet. Use the GitHub install command above to install this version.

Check the CLI help:

```bash
node bin/codex-switch.js --help
```

## Web UI

Start the local web app:

```bash
codex-switch web
```

Or from a checkout:

```bash
node bin/codex-switch.js web
```

It opens the local page automatically. The default URL is:

```text
http://127.0.0.1:8787
```

Use `--no-open` if you only want to start the server.

The page lets you:

- Save a Codex relay profile
- Load model IDs from the relay `/models` endpoint
- Switch a saved profile to another relay model from the loaded model menu
- Publish relay models to Codex's profile-scoped model catalog
- Store the API key in a local key file instead of `config.toml`
- Remove a managed profile
- Switch between ChatGPT account login and any managed relay profile
- Optionally migrate local chat history and restart Codex after switching
- Send one small Codex test request through the selected profile

The main web flow only asks for name, base URL, API key, and model. You can load models from the relay or type a model manually.

For an existing profile, click `Edit` in the profile list, change the fields, then click `Save`. Saving with the same name updates that profile. If the local key file already exists, you can leave API key blank to keep using the saved key.

When switching in the web UI:

- Leave `Also migrate chat history and restart Codex` unchecked to only change the active API connection.
- Check it to migrate local Codex chat history to the selected provider and restart the macOS Codex app so history is reloaded.

## Usage

```bash
codex-switch setup \
  --name vayne \
  --base-url https://api.vayne.cc.cd/v1 \
  --model gpt-5.5
```

Then start Codex with:

```bash
codex --profile vayne
```

Change the model for an existing managed profile:

```bash
codex-switch model --name vayne --model gpt-5.4
```

List managed profiles and the current default:

```bash
codex-switch list
```

Experimental: force the latest Codex Desktop thread record to a relay model:

```bash
codex-switch thread-model --provider vayne --model claude-opus-4-7
```

This backs up `~/.codex/state_5.sqlite` before editing it. Quit Codex Desktop before using this command, then reopen the app.

Set a profile as the default:

```bash
codex-switch default --name vayne
```

Switch back to the ChatGPT account login:

```bash
codex-switch account
```

When switching between account login and a relay profile, codex-switch also moves local Codex thread records to the selected provider so history remains visible across modes. It backs up `~/.codex/state_5.sqlite` before changing the thread database.

On macOS, you can also restart the Codex app after switching:

```bash
codex-switch default --name vayne --restart-codex
codex-switch account --restart-codex
```

If you only want to change the active provider and leave thread history untouched:

```bash
codex-switch default --name vayne --no-migrate-history
codex-switch account --no-migrate-history
```

After using `Use Relay` or `Use Account` in the web UI, you can start Codex with:

```bash
codex
```

## Environment Variable Mode

If you prefer an environment variable instead of a key file:

```bash
export VAYNE_API_KEY="sk-..."

codex-switch setup \
  --name vayne \
  --base-url https://api.vayne.cc.cd/v1 \
  --model gpt-5.5 \
  --key-env VAYNE_API_KEY
```

## Remove

```bash
codex-switch remove --name vayne
```

Remove the profile and delete its local key file:

```bash
codex-switch remove --name vayne --delete-key
```

## Compatibility

Codex custom providers currently use the OpenAI Responses API wire protocol. Your relay must support `/v1/responses`, streaming, and the model/tool behavior Codex needs.

Relays that only support `/v1/chat/completions` are not enough.

---

# codex-switch 中文说明

`codex-switch` 是一个本地 Web UI 和命令行工具，用来给 Codex 添加兼容 OpenAI Responses API 的中转站配置。

它会修改 `~/.codex/config.toml`，但不会把 API Key 写进配置文件。默认情况下，API Key 会保存到本地 `chmod 600` 权限的密钥文件里。

它还会为每个配置写入 Codex 模型目录：

```text
~/.codex/codex-switch/<profile>_models.json
```

Codex CLI 可以读取这个模型目录；Codex Desktop 的内置模型选择器可能仍然不会显示自定义 provider 的模型。

## 安装

目前这个项目从 GitHub 安装，还没有发布到 npm registry。

推荐安装方式：

```bash
npm install -g github:ffffff9331/codex-switch
```

启动本地 Web 页面：

```bash
codex-switch web
```

默认地址：

```text
http://127.0.0.1:8787
```

如果你是 clone 了仓库，也可以直接运行：

```bash
node bin/codex-switch.js web
```

本地开发或自己修改后安装：

```bash
git clone https://github.com/ffffff9331/codex-switch.git
cd codex-switch
npm install -g .
codex-switch web
```

注意：公共 npm 上可能存在同名包，但这个项目目前没有发布到 npm registry。请使用上面的 GitHub 安装命令。

## Web 页面怎么用

Web 页面可以完成这些操作：

- 保存 Codex 中转站配置
- 通过中转站 `/models` 接口读取模型列表
- 从模型列表里选择模型，也可以手动输入模型名
- 把中转模型写入 Codex 的 profile 模型目录
- API Key 保存到本地密钥文件，不写入 `config.toml`
- 删除已管理的配置
- 在 ChatGPT 账号登录和任意中转站配置之间切换
- 可选：切换时迁移本地聊天历史并重启 Codex
- 发送一次小的 Codex 测试请求，确认当前配置能用

新增配置只需要填写：名称、Base URL、API Key、模型。

已有配置可以点 `编辑`，修改后点 `保存`。如果 API Key 文件已经存在，保存时 API Key 可以留空，工具会继续使用已保存的本地密钥。

切换时页面上有一个选项：

```text
同时迁移聊天历史并重启 Codex
不勾选则只修改 API 连接方式。
```

含义是：

- 不勾选：只切换 Codex 当前使用账号登录还是中转站，不迁移历史，不重启 Codex。
- 勾选：先把本地 Codex 历史会话迁移到目标 provider，再重启 macOS Codex App，让历史重新加载。

## 命令行用法

创建一个中转站配置：

```bash
codex-switch setup \
  --name vayne \
  --base-url https://api.vayne.cc.cd/v1 \
  --model gpt-5.5
```

用这个配置启动 Codex：

```bash
codex --profile vayne
```

修改已有配置的模型：

```bash
codex-switch model --name vayne --model gpt-5.4
```

查看当前配置：

```bash
codex-switch list
```

切换到某个中转站作为默认 Codex 配置：

```bash
codex-switch default --name vayne
```

切回 ChatGPT 账号登录：

```bash
codex-switch account
```

默认情况下，在账号登录和中转站之间切换时，`codex-switch` 会迁移本地 Codex 线程记录，让未归档和已归档历史在两种模式下都尽量保持可见。修改前会备份：

```text
~/.codex/state_5.sqlite
```

如果你希望切换后自动重启 macOS Codex App：

```bash
codex-switch default --name vayne --restart-codex
codex-switch account --restart-codex
```

如果你只想改 API 连接方式，不迁移聊天历史：

```bash
codex-switch default --name vayne --no-migrate-history
codex-switch account --no-migrate-history
```

实验功能：修改最近一个 Codex Desktop 线程记录的模型：

```bash
codex-switch thread-model --provider vayne --model claude-opus-4-7
```

这个命令会先备份 `~/.codex/state_5.sqlite`。建议先退出 Codex Desktop，再执行。

## 环境变量模式

如果你不想保存本地 key 文件，也可以使用环境变量：

```bash
export VAYNE_API_KEY="sk-..."

codex-switch setup \
  --name vayne \
  --base-url https://api.vayne.cc.cd/v1 \
  --model gpt-5.5 \
  --key-env VAYNE_API_KEY
```

## 删除配置

只删除配置：

```bash
codex-switch remove --name vayne
```

删除配置并删除本地 key 文件：

```bash
codex-switch remove --name vayne --delete-key
```

## 兼容性

Codex 自定义 provider 使用 OpenAI Responses API 协议。你的中转站需要支持：

- `/v1/responses`
- streaming
- Codex 所需的模型和工具调用行为

只支持 `/v1/chat/completions` 的中转站不够。
