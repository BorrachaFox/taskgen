import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

export interface Config {
    linearApiKey?: string;
    linearTeamId?: string;
    aiProvider?: "anthropic" | "openai" | "gemini";
    aiApiKey?: string;
    aiModel?: string;
}

const CONFIG_DIR = join(homedir(), ".taskgen");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

export function loadConfig(): Config {
    if (!existsSync(CONFIG_FILE)) return {};
    try {
        return JSON.parse(readFileSync(CONFIG_FILE, "utf-8"));
    } catch {
        return {};
    }
}

export function saveConfig(config: Config): void {
    if (!existsSync(CONFIG_DIR)) {
        mkdirSync(CONFIG_DIR, { recursive: true });
    }
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}
