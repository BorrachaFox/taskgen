import { input, select, confirm } from "@inquirer/prompts";
import chalk from "chalk";
import { loadConfig, saveConfig } from "./config.js";
import { getTeams } from "./linear.js";

export async function runSetup() {
  console.log(chalk.bold.cyan("\n⚙️  taskgen setup\n"));

  const config = loadConfig();

  // AI Provider
  const aiProvider = await select({
    message: "Which AI provider do you want to use?",
    choices: [
      { name: "Anthropic (Claude)", value: "anthropic" },
      { name: "OpenAI (GPT-4o)", value: "openai" },
      { name: "Google (Gemini 2.0 Flash)", value: "gemini" },
    ],
    default: config.aiProvider ?? "anthropic",
  });

  const providerLabel: Record<string, string> = {
    anthropic: "Anthropic",
    openai: "OpenAI",
    gemini: "Google AI (Gemini)",
  };

  const aiApiKey = await input({
    message: `Enter your ${providerLabel[aiProvider]} API key:`,
    default: config.aiApiKey,
    validate: (v) => v.trim().length > 0 || "API key is required",
  });

  // Linear
  const useLinear = await confirm({
    message: "Do you want to connect Linear?",
    default: !!config.linearApiKey,
  });

  let linearApiKey: string | undefined;
  let linearTeamId: string | undefined;

  if (useLinear) {
    linearApiKey = await input({
      message: "Enter your Linear API key (from linear.app/settings/api):",
      default: config.linearApiKey,
      validate: (v) => v.trim().length > 0 || "API key is required",
    });

    console.log(chalk.dim("  Fetching your Linear teams..."));

    try {
      const teams = await getTeams(linearApiKey);

      if (teams.length === 0) {
        console.log(chalk.yellow("  No teams found. Check your API key."));
      } else {
        linearTeamId = await select({
          message: "Which team should tasks be added to?",
          choices: teams.map((t) => ({
            name: `${t.name} (${t.key})`,
            value: t.id,
          })),
          default: config.linearTeamId,
        });
      }
    } catch (err: any) {
      console.log(chalk.red(`  Could not connect to Linear: ${err.message}`));
      const retry = await confirm({ message: "Save config anyway?", default: false });
      if (!retry) return;
    }
  }

  saveConfig({
    aiProvider: aiProvider as "anthropic" | "openai" | "gemini",
    aiApiKey: aiApiKey.trim(),
    ...(useLinear && linearApiKey ? { linearApiKey: linearApiKey.trim(), linearTeamId } : {}),
  });

  console.log(chalk.green("\n✅ Config saved to ~/.taskgen/config.json\n"));
}
