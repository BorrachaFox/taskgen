# taskgen

AI-powered CLI to create tasks without leaving your terminal.

Describe what you want to do → AI writes the title and description → issue created automatically.

---

## Install
```bash
npm install -g taskgen
```

## Usage
```bash
taskgen setup        # configure your keys (run once)
taskgen create-task  # create a new task
```

---

## AI Providers

| Provider | Get your key |
|---|---|
| Anthropic (Claude) | console.anthropic.com |
| OpenAI (GPT-4o) | platform.openai.com |
| Google (Gemini) | aistudio.google.com |

## Task Managers

| Service | Notes |
|---|---|
| Linear | Full support — creates issues, assigns members, sets status and priority |
| Without integration | Prints the generated title and description directly in the terminal |

---

## Requirements

- Node.js 18+
- API key from one of the supported AI providers
- Linear account (optional)