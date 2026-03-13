import type { Config } from "./config.js";
export interface GeneratedTask {
    title: string;
    description: string;
}
export interface TaskInput {
    what: string;
    changes: string;
    impact: string;
    priority: string;
    type: string;
    template?: string;
}
export declare function generateTask(input: TaskInput, config: Config): Promise<GeneratedTask>;
export declare function fetchAvailableModels(provider: string, apiKey: string): Promise<{
    id: string;
    name: string;
}[]>;
//# sourceMappingURL=ai.d.ts.map