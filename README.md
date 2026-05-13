# codex-switch

Small local web UI and CLI for adding OpenAI Responses-compatible relay API profiles to Codex.

It edits `~/.codex/config.toml` and stores the API key outside the config file in a local `chmod 600` key file.
It also writes a profile-scoped Codex model catalog at `~/.codex/codex-switch/<profile>_models.json`. Codex CLI can read this catalog; Codex Desktop may still hide custom provider models in its built-in model picker.

## Install

```bash
npm install -g codex-switch
```

Or run from a checkout:

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
- Send one small Codex test request through the selected profile

The main web flow only asks for name, base URL, API key, and model. You can load models from the relay or type a model manually.

For an existing profile, click `Edit` in the profile list, change the fields, then click `Save`. Saving with the same name updates that profile. If the local key file already exists, you can leave API key blank to keep using the saved key.

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
