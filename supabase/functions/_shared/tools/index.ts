import { readFileTool } from "./read_file.ts";
import { writeFileTool } from "./write_file.ts";
import { listFilesTool } from "./list_files.ts";
import { editFileTool } from "./edit_file.ts";
import { skillsTool } from "./skills.ts";
import { createCronTool } from "./cron.ts";
import { webFetchTool } from "./web_fetch.ts";
import { webSearchTool } from "./web_search.ts";
import { createMemorySearchTool } from "./memory_search.ts";
import { createBashTool } from "./bash.ts";
import { spawnAgentTool } from "./spawn_agent.ts";
import { evaluatePoUsTool } from "./evaluate.ts";

export const tools = {
  read_file: readFileTool,
  write_file: writeFileTool,
  list_files: listFilesTool,
  edit_file: editFileTool,
  skills: skillsTool,
  web_fetch: webFetchTool,
  web_search: webSearchTool,
  spawn_agent: spawnAgentTool,
  evaluate_po_us: evaluatePoUsTool,
} as const;

export function createAllTools(sessionId: string) {
  return {
    ...tools,
    cron: createCronTool(sessionId),
    memory_search: createMemorySearchTool(sessionId),
    bash: createBashTool(sessionId),
  } as const;
}

type Obj = Record<string, unknown>;
const str = (v: unknown) => typeof v === "string" ? v : "";

const displayRegistry: Record<
  string,
  (args: Obj, result: Obj) => string | null
> = {
  bash(args) {
    const script = str(args.script).trim();
    const action = str(args.action) || "exec";
    if (action !== "exec") return action;
    return script.split("\n")[0] ?? script;
  },
  read_file(args) {
    return str(args.path);
  },
  write_file(args) {
    return str(args.path);
  },
  list_files(args) {
    return str(args.path) || ".";
  },
  edit_file(args) {
    return str(args.path);
  },
  skills(args) {
    const action = str(args.action);
    const name = str(args.name);
    return name ? `${action} ${name}` : action;
  },
  cron(args) {
    const action = str(args.action);
    const name = str(args.name);
    const id = args.id;
    if (name) return `${action} ${name}`;
    if (id !== undefined) return `${action} #${id}`;
    return action;
  },
  web_fetch(args) {
    const url = str(args.url);
    try {
      return new URL(url).hostname;
    } catch {
      return url.slice(0, 60);
    }
  },
  web_search(args) {
    return str(args.query);
  },
  memory_search(args) {
    return str(args.query);
  },
  spawn_agent(args) {
    const prompt = str(args.prompt);
    const provider = str(args.provider) || "po-us";
    return `[${provider}] ${prompt.slice(0, 60)}`;
  },
  evaluate_po_us(args) {
    const suite = str(args.suite);
    const label = str(args.run_label);
    return suite ? `suite:${suite}${label ? ` (${label})` : ""}` : `all${label ? ` (${label})` : ""}`;
  },
};

export function toolDisplay(
  toolName: string,
  args: unknown,
  result: unknown,
): string | null {
  const fn = displayRegistry[toolName];
  if (!fn) return null;
  const a = (args && typeof args === "object" ? args : {}) as Obj;
  const r = (result && typeof result === "object" ? result : {}) as Obj;
  return fn(a, r);
}
