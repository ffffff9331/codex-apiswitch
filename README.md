# codex-relay-profile

Small CLI for adding OpenAI Responses-compatible relay API profiles to Codex.

It edits `~/.codex/config.toml` and stores the API key outside the config file in a local `chmod 600` key file.

## Install

```bash
npm install -g codex-relay-profile
```

Or run from a checkout:

```bash
node bin/codex-relay-profile.js --help
```

## Usage

```bash
codex-relay-profile setup \
  --name vayne \
  --base-url https://api.vayne.cc.cd/v1 \
  --model gpt-5.5
```

Then start Codex with:

```bash
codex --profile vayne
```

## Environment Variable Mode

If you prefer an environment variable instead of a key file:

```bash
export VAYNE_API_KEY="sk-..."

codex-relay-profile setup \
  --name vayne \
  --base-url https://api.vayne.cc.cd/v1 \
  --model gpt-5.5 \
  --key-env VAYNE_API_KEY
```

## Remove

```bash
codex-relay-profile remove --name vayne
```

## Compatibility

Codex custom providers currently use the OpenAI Responses API wire protocol. Your relay must support `/v1/responses`, streaming, and the model/tool behavior Codex needs.

Relays that only support `/v1/chat/completions` are not enough.
