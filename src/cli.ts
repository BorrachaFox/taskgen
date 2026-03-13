#!/usr/bin/env node

import chalk from "chalk";
import { runSetup } from "./setup.js";
import { runCreateTask } from "./create-task.js";

const command = process.argv[2];

const HELP = `
${chalk.bold.cyan("taskgen")} — AI-powered task creator for Linear

${chalk.bold("Usage:")}
  taskgen setup          Configure AI and Linear API keys
  taskgen create-task    Generate and create a new task
  taskgen help           Show this help

${chalk.bold("First time?")}
  Run ${chalk.cyan("taskgen setup")} to get started.
`;

async function main() {
  switch (command) {
    case "setup":
      await runSetup();
      break;

    case "create-task":
      await runCreateTask();
      break;

    case "help":
    case "--help":
    case "-h":
    case undefined:
      console.log(HELP);
      break;

    default:
      console.log(chalk.red(`Unknown command: ${command}`));
      console.log(HELP);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(chalk.red("Unexpected error:"), err.message);
  process.exit(1);
});
