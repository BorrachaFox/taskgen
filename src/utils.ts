import chalk from "chalk";
import { readdirSync, readFileSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

export const TEMPLATES_DIR = join(homedir(), ".taskgen", "templates");

export const loadLocalTemplates = (): { name: string; content: string }[] => {
  if (!existsSync(TEMPLATES_DIR)) return [];
  return readdirSync(TEMPLATES_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => ({
      name: f.replace(".md", ""),
      content: readFileSync(join(TEMPLATES_DIR, f), "utf-8"),
    }));
}

export const genColoredStatusCircle = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return chalk.rgb(r, g, b)("●");
}