import type { Config } from "./config.js";
import {
    DEFAULT_ANTHROPIC_MODEL,
    DEFAULT_GEMINI_MODEL,
    DEFAULT_OPENAI_MODEL,
} from "./constants.js";

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

function buildSystemPrompt(template?: string): string {
    if (template) {
        return `Task creator assistant. Output ONLY JSON: {"title":"<60 chars>","description":"<markdown>"}. Use this template structure: ${template}.`;
    }

    const sections = `## What will be done\n## How it will be done\n## Why it will be done`;

    return `Task creator assistant. Output ONLY JSON: {"title":"<60 chars>","description":"<markdown>"}. Sections: ${sections}.`;
}

export async function generateTask(input: TaskInput, config: Config): Promise<GeneratedTask> {
    const model = config.aiModel;
    const prompt = `what:${input.what}|changes:${input.changes}|impact:${input.impact}|type:${input.type}|priority:${input.priority}`;
    const systemPrompt = buildSystemPrompt(input.template);

    if (config.aiProvider === "openai")
        return generateWithOpenAI(prompt, systemPrompt, config.aiApiKey!, model);
    if (config.aiProvider === "anthropic")
        return generateWithAnthropic(prompt, systemPrompt, config.aiApiKey!, model);
    return generateWithGemini(prompt, systemPrompt, config.aiApiKey!, model);
}

async function generateWithAnthropic(
    prompt: string,
    systemPrompt: string,
    apiKey: string,
    model?: string
): Promise<GeneratedTask> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
            model: model ?? DEFAULT_ANTHROPIC_MODEL,
            max_tokens: 512,
            system: systemPrompt,
            messages: [{ role: "user", content: prompt }],
        }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(
            `Anthropic API error: ${(err as any).error?.message ?? response.statusText}`
        );
    }

    const data = await response.json();
    const text = (data as any).content[0].text;
    return JSON.parse(text);
}

async function generateWithOpenAI(
    prompt: string,
    systemPrompt: string,
    apiKey: string,
    model?: string
): Promise<GeneratedTask> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: model ?? DEFAULT_OPENAI_MODEL,
            response_format: { type: "json_object" },
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt },
            ],
        }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${(err as any).error?.message ?? response.statusText}`);
    }

    const data = await response.json();
    const text = (data as any).choices[0].message.content;
    return JSON.parse(text);
}

async function generateWithGemini(
    prompt: string,
    systemPrompt: string,
    apiKey: string,
    model?: string
): Promise<GeneratedTask> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model ?? DEFAULT_GEMINI_MODEL}:generateContent`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" },
        }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const message = (err as any).error?.message ?? response.statusText;
        if (response.status === 429) {
            throw new Error(
                `Gemini rate limit exceeded. Try again in a few seconds.\n  Detail: ${message}`
            );
        }
        throw new Error(`Gemini API error (${response.status}): ${message}`);
    }

    const data = await response.json();
    const text = (data as any).candidates[0].content.parts[0].text;
    return JSON.parse(text);
}

export async function fetchAvailableModels(
    provider: string,
    apiKey: string
): Promise<{ id: string; name: string }[]> {
    try {
        if (provider === "openai") {
            const res = await fetch("https://api.openai.com/v1/models", {
                headers: { Authorization: `Bearer ${apiKey}` },
            });
            const data = await res.json();

            return (data.data as any[])
                .filter((m) => m.id.startsWith("gpt-"))
                .sort((a, b) => b.id.localeCompare(a.id))
                .map((m) => ({ id: m.id, name: m.id }));
        }

        if (provider === "gemini") {
            const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
            );
            const data = await res.json();
            return (data.models as any[])
                .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
                .map((m) => ({ id: m.name, name: m.displayName ?? m.name }));
        }

        if (provider === "anthropic") {
            return [
                { id: "claude-opus-4-5", name: "Claude Opus 4.5" },
                { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4" },
                { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5" },
            ];
        }
    } catch {
        return [];
    }
    return [];
}
