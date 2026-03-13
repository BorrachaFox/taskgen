import type { Config } from "./config.js";

export interface GeneratedTask {
  title: string;
  description: string;
}

interface TaskInput {
  context: string;
  priority: string;
  type: string;
}

const SYSTEM_PROMPT = `You are a task management assistant. Given a description of work to be done, 
generate a clear, concise task title and a detailed description formatted in markdown.

Respond ONLY with valid JSON in this exact format:
{
  "title": "Short, action-oriented title (max 60 chars)",
  "description": "Detailed markdown description with context, acceptance criteria, and any relevant notes"
}`;

export async function generateTask(input: TaskInput, config: Config): Promise<GeneratedTask> {
  const prompt = `Create a task for the following:
Context: ${input.context}
Type: ${input.type}
Priority: ${input.priority}`;

  if (config.aiProvider === "openai") {
    return generateWithOpenAI(prompt, config.aiApiKey!);
  }
  if (config.aiProvider === "anthropic") {
    return generateWithAnthropic(prompt, config.aiApiKey!);
  }
  return generateWithGemini(prompt, config.aiApiKey!);
}

async function generateWithAnthropic(prompt: string, apiKey: string): Promise<GeneratedTask> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Anthropic API error: ${(err as any).error?.message ?? response.statusText}`);
  }

  const data = await response.json();
  const text = (data as any).content[0].text;
  return JSON.parse(text);
}

async function generateWithOpenAI(prompt: string, apiKey: string): Promise<GeneratedTask> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
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

async function generateWithGemini(prompt: string, apiKey: string): Promise<GeneratedTask> {
  const model = "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    }),
  });

  if (!response.ok) {
  const err = await response.json().catch(() => ({}));
  const message = (err as any).error?.message ?? response.statusText;
  if (response.status === 429) {
    throw new Error(`Gemini rate limit exceeded. Try again in a few seconds or check your plan at https://ai.dev/rate-limit\n  Detail: ${message}`);
  }
  throw new Error(`Gemini API error (${response.status}): ${message}`);
}

  const data = await response.json();
  const text = (data as any).candidates[0].content.parts[0].text;
  return JSON.parse(text);
}
