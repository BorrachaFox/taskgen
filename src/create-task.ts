import { input, select, confirm } from "@inquirer/prompts";
import chalk from "chalk";
import ora from "ora";
import { loadConfig } from "./config.js";
import { generateTask } from "./ai.js";
import { createIssue } from "./linear.js";

const PRIORITY_MAP: Record<string, number> = {
  urgent: 1,
  high: 2,
  medium: 3,
  low: 4,
};

export async function runCreateTask() {
  console.log(chalk.bold.cyan("\n✨ Create a new task\n"));

  const config = loadConfig();

  if (!config.aiApiKey) {
    console.log(chalk.red("No AI API key configured. Run `taskgen setup` first."));
    process.exit(1);
  }

  // Collect task info
  const context = await input({
    message: "Describe what needs to be done:",
    validate: (v) => v.trim().length > 5 || "Please provide more detail",
  });

  const type = await select({
    message: "Task type:",
    choices: [
      { name: "Feature", value: "feature" },
      { name: "Bug", value: "bug" },
      { name: "Chore / Refactor", value: "chore" },
      { name: "Documentation", value: "docs" },
    ],
  });

  const priority = await select({
    message: "Priority:",
    choices: [
      { name: "🔴 Urgent", value: "urgent" },
      { name: "🟠 High", value: "high" },
      { name: "🟡 Medium", value: "medium" },
      { name: "🟢 Low", value: "low" },
    ],
    default: "medium",
  });

  // Generate with AI
  const spinner = ora("Generating task with AI...").start();
  let task;

  try {
    task = await generateTask({ context, priority, type }, config);
    spinner.succeed("Task generated!");
  } catch (err: any) {
    spinner.fail(`AI error: ${err.message}`);
    process.exit(1);
  }

  // Preview
  console.log(chalk.bold("\n📋 Generated Task:\n"));
  console.log(chalk.bold("Title:   ") + chalk.white(task.title));
  console.log(chalk.bold("Preview: ") + chalk.dim(task.description.slice(0, 120) + "..."));

  // Allow editing title
  const editTitle = await confirm({ message: "Edit the title?", default: false });
  if (editTitle) {
    task.title = await input({
      message: "New title:",
      default: task.title,
    });
  }

  // Push to Linear or just display
  if (config.linearApiKey && config.linearTeamId) {
    const push = await confirm({ message: "Create this issue in Linear?", default: true });

    if (push) {
      const spinner2 = ora("Creating issue in Linear...").start();
      try {
        const issue = await createIssue(task, PRIORITY_MAP[priority], config);
        spinner2.succeed(`Issue created: ${chalk.cyan(issue.identifier)} — ${issue.url}`);
      } catch (err: any) {
        spinner2.fail(`Linear error: ${err.message}`);
      }
    }
  } else {
    console.log(chalk.dim("\n(Linear not configured — run `taskgen setup` to connect)\n"));
    console.log(chalk.bold("\nFull description:\n"));
    console.log(task.description);
  }

  console.log();
}
