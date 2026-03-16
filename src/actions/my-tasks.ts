import chalk from "chalk";
import ora from "ora";
import { select } from "@inquirer/prompts";
import { loadConfig } from "../config.js";
import { genBranchName, genColoredStatusCircle } from "../utils.js";
import Linear from "../integrations/linear.js";

export async function runGetMyTasks() {
    const config = loadConfig();

    const client = new Linear(config);

    if (!config.linearApiKey) {
        console.log(chalk.red("Linear not configured. Run `taskgen setup` first."));
        process.exit(1);
    }

    const teamsSpinner = ora("Fetching teams...").start();
    let teams;

    try {
        teams = await client.getTeams();
        teamsSpinner.stop();
    } catch (err: any) {
        teamsSpinner.fail(`Could not fetch teams: ${err.message}`);
        process.exit(1);
    }

    let teamId: string | undefined;

    if (teams.length > 1) {
        const choice = await select({
            message: "Filter by team?",
            choices: [
                { name: "All teams", value: "__all__" },
                ...teams.map((t) => ({ name: `${t.name} (${t.key})`, value: t.id })),
            ],
            pageSize: teams.length + 1,
        });
        if (choice !== "__all__") teamId = choice as string;
    } else {
        teamId = teams[0]?.id;
    }

    const statesSpinner = ora("Fetching statuses...").start();
    let states;

    try {
        states = await client.getTeamStates(teamId ?? teams[0].id);
        statesSpinner.stop();
    } catch (err: any) {
        statesSpinner.fail(`Could not fetch statuses: ${err.message}`);
        process.exit(1);
    }

    const selectedState = await select({
        message: "Select status:",
        choices: [
            { name: "All", value: "__all__" },
            ...states.map((s) => ({
                name: `${genColoredStatusCircle(s.color)} ${s.name}`,
                value: s.id,
            })),
        ],
        pageSize: states.length + 1,
    });

    const fetchSpinner = ora("Fetching your tasks...").start();

    let issues;

    try {
        issues = await client.getMyIssues({
            stateIds: selectedState !== "__all__" ? [selectedState] : undefined,
            teamId,
        });
        fetchSpinner.stop();
    } catch (err: any) {
        fetchSpinner.fail(`Could not fetch tasks: ${err.message}`);
        process.exit(1);
    }

    console.log(chalk.bold(`\n📋 My tasks\n`));

    if (issues.length === 0) {
        console.log(chalk.dim("  No tasks found.\n"));
        return;
    }

    for (const issue of issues) {
        const branch = genBranchName(issue.identifier, issue.title);
        const state = states.find((s) => s.id === issue.stateId);
        const circle = state ? genColoredStatusCircle(state.color) : "●";

        console.log(`  ${circle} ${chalk.cyan(issue.identifier)}  ${issue.title}`);
        console.log(`     ${chalk.dim(branch)}`);
        console.log();
    }
}
