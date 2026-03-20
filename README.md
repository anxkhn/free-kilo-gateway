# Kilo Gateway Free Models for OpenCode

[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Add free Kilo Gateway models to OpenCode configuration** — Run a single command to patch your global OpenCode config with the latest free models from Kilo Gateway at no cost.

## What You Get

- **100% Free Models** — Z.AI GLM 5, Giga Potato, CoreThink, and more
- **Auto-Updating** — Run anytime to get the latest free models
- **Zero Configuration** — Automatically updates your global OpenCode config
- **Large Context Windows** — Models with up to 256K context
- **Vision Support** — Select models with multimodal capabilities

---

## Installation

### For Humans

**Option A: Let an LLM do it**

Paste this into any LLM agent (Claude Code, OpenCode, Cursor, etc.):

```
Clone https://github.com/anxkhn/free-kilo-gateway.git, run node patch.js to add free Kilo Gateway models to ~/.config/opencode/opencode.json, and follow the usage examples in README.md
```

**Option B: Manual setup**

1. **Clone this repository**

```bash
git clone https://github.com/anxkhn/free-kilo-gateway.git
cd free-kilo-gateway
```

2. **Patch your OpenCode config**

```bash
node patch.js
```

This will:
- Fetch latest free models from Kilo Gateway API
- Update `~/.config/opencode/opencode.json` with Kilo Gateway provider
- Add all available free models
- Automatically test each model and remove any that don't work
- Preserve all your existing configuration

### Health Checks

The patcher automatically tests each model after adding it to ensure it works:

- **Validation**: Each model is tested with a simple query ("what is 2+2")
- **Automatic Removal**: Models that fail validation (no response, wrong answer, or errors) are removed from the config
- **Login Handling**: Models requiring authentication you don't have will be caught and removed

**Skip health checks** if needed:

```bash
SKIP_HEALTHCHECK=1 node patch.js
```

---

## Usage

After patching, use free models with OpenCode. Run `node patch.js` first to see available models:

```bash
# Use any free model
opencode run "your prompt" --model=kilogateway/z-ai-glm-5-free

# Check available models
cat ~/.config/opencode/opencode.json | grep -A 50 "kilogateway"
```

---

## Available Free Models

| Model | Context | Output | Features |
|-------|---------|--------|----------|
| **Kilo Auto Free** | 204K | 131K | Text only |
| **Xiaomi: MiMo-V2-Pro (free)** | 1048K | 131K | Vision support |
| **NVIDIA: Nemotron 3 Super (free)** | 262K | 262K | Text only |
| **Giga Potato Thinking (free)** | 256K | 32K | Vision support |
| **Arcee AI: Trinity Large Preview (free)** | 131K | - | Text only |
| **Free Models Router** | 200K | - | Vision support |
| **StepFun: Step 3.5 Flash (free)** | 256K | 256K | Text only |
| **CoreThink (free)** | 78K | 8K | Text only |
| **Giga Potato (free)** | 256K | 32K | Vision support |
| **MiniMax: MiniMax M2.5 (free)** | 204K | 131K | Text only |
| **Xiaomi: MiMo-V2-Omni (free)** | 262K | 65K | Vision support |
| **xAI: Grok Code Fast 1 Optimized (experimental, free)** | 256K | 10K | Text only |
| **Deprecated Kilo Auto Free** | 204K | 131K | Text only |
*Last updated: March 20, 2026*
---

## Updating Models

Models may change over time. To get the latest free models:

```bash
cd free-kilo-gateway
node patch.js
```

Run this command anytime to refresh your free model list.

---

## Configuration

This patcher updates your **global** OpenCode config at:
`~/.config/opencode/opencode.json`

This means the free models will be available in **all** your projects.

### Manual Configuration

If you prefer to configure manually, run `node patch.js` and copy the generated provider configuration from `~/.config/opencode/opencode.json`.

The Kilo Gateway provider will be added with all available free models automatically.

---

## Troubleshooting

### "Config file not found"

The patcher will create a new config file for you automatically.

### Models don't appear in OpenCode

Check that your `~/.config/opencode/opencode.json` was updated:

```bash
cat ~/.config/opencode/opencode.json | grep kilogateway
```

You should see the kilogateway provider configuration.

### Can't see all free models

Some models may be temporarily unavailable. Run `node patch.js` again to get the latest list.

### Health check failures

If a model fails health checks, it is automatically removed. This is expected behavior for models that:
- Require authentication you don't have
- Are temporarily unavailable
- Have pricing changes that make them non-free

Check the console output during patching to see which models were tested and removed.

### Skip health checks

If you want to disable model validation:

```bash
SKIP_HEALTHCHECK=1 node patch.js
```

This will add all free models without testing them first.

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Related Projects

- [OpenCode](https://opencode.ai) — The AI-powered CLI
- [Kilo Gateway](https://kilo.ai) — AI model gateway with free tier
- [opencode-antigravity-auth](https://github.com/NoeFabris/opencode-antigravity-auth) — Google Antigravity OAuth plugin
