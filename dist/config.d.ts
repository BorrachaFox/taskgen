export interface Config {
    linearApiKey?: string;
    linearTeamId?: string;
    aiProvider?: "anthropic" | "openai" | "gemini";
    aiApiKey?: string;
    aiModel?: string;
}
export declare function loadConfig(): Config;
export declare function saveConfig(config: Config): void;
//# sourceMappingURL=config.d.ts.map