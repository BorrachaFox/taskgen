import type { Config } from "./config.js";
import type { GeneratedTask } from "./ai.js";

const LINEAR_API = "https://api.linear.app/graphql";

interface LinearTeam {
  id: string;
  name: string;
  key: string;
}

interface LinearIssue {
  id: string;
  identifier: string;
  url: string;
  title: string;
}

async function linearQuery(query: string, variables: Record<string, unknown>, apiKey: string) {
  const response = await fetch(LINEAR_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) throw new Error(`Linear API error: ${response.statusText}`);
  const data = await response.json();
  if ((data as any).errors) throw new Error((data as any).errors[0].message);
  return (data as any).data;
}

export async function getTeams(apiKey: string): Promise<LinearTeam[]> {
  const data = await linearQuery(
    `query { teams { nodes { id name key } } }`,
    {},
    apiKey
  );
  return data.teams.nodes;
}

export async function createIssue(
  task: GeneratedTask,
  priority: number,
  config: Config
): Promise<LinearIssue> {
  const PRIORITY_MAP: Record<string, number> = {
    urgent: 1,
    high: 2,
    medium: 3,
    low: 4,
  };

  const data = await linearQuery(
    `mutation CreateIssue($title: String!, $description: String!, $teamId: String!, $priority: Int) {
      issueCreate(input: { title: $title, description: $description, teamId: $teamId, priority: $priority }) {
        success
        issue { id identifier url title }
      }
    }`,
    {
      title: task.title,
      description: task.description,
      teamId: config.linearTeamId!,
      priority,
    },
    config.linearApiKey!
  );

  return data.issueCreate.issue;
}
