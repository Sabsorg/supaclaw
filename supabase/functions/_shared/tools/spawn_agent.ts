import { generateText, jsonSchema, tool } from "ai";
import { buildSystemPrompt } from "../context.ts";
import { logger } from "../logger.ts";
import { isLLMProvider, LLMProvider, resolveProviderModel } from "../providers.ts";

const MAX_STEPS = 15;
const DEFAULT_STEPS = 5;

type SpawnAgentArgs = {
  prompt: string;
  provider?: string;
  system_context?: string;
  max_steps?: number;
};

export const spawnAgentTool = tool({
  description: [
    "Spawn a focused isolated sub-agent to work on a specific task and return its output.",
    "Use this to get a second independent opinion, parallelize analysis, or delegate specialized reasoning.",
    "The sub-agent uses pure reasoning — no session history, no tool access.",
    "Keep prompts specific and treat the returned text as the sub-agent's complete response.",
    "Example uses: fact-checking your answer, generating an alternative approach, analyzing a document excerpt.",
  ].join("\n"),
  inputSchema: jsonSchema<SpawnAgentArgs>({
    type: "object",
    properties: {
      prompt: {
        type: "string",
        description: "The focused task or question for the sub-agent to address.",
      },
      provider: {
        type: "string",
        description:
          "LLM provider to use (openai|anthropic|google|bedrock|po-us). Default: po-us.",
      },
      system_context: {
        type: "string",
        description:
          "Optional extra context injected before the sub-agent's system prompt.",
      },
      max_steps: {
        type: "number",
        description: `Max reasoning steps (default ${DEFAULT_STEPS}, max ${MAX_STEPS}).`,
      },
    },
    required: ["prompt"],
    additionalProperties: false,
  }),
  execute: async (args: SpawnAgentArgs) => {
    try {
      const rawProvider = (args.provider ?? "po-us").trim();
      if (!isLLMProvider(rawProvider)) {
        return {
          error: "invalid_provider",
          message: `Unknown provider: ${rawProvider}. Use one of: openai, anthropic, google, bedrock, po-us.`,
        };
      }
      const selectedProvider = rawProvider as LLMProvider;
      const isPoUs = selectedProvider === "po-us";

      const model = resolveProviderModel(selectedProvider);
      const baseSystemPrompt = await buildSystemPrompt(
        isPoUs
          ? { overlayPath: ".agents/po-us", agentName: "Po-us" }
          : undefined,
      ).catch(
        () =>
          "You are a focused reasoning agent. Complete the task accurately and concisely.",
      );

      const systemContent = [
        args.system_context?.trim() ?? "",
        baseSystemPrompt,
        "You are operating as a focused sub-agent. Provide your complete response in one message.",
      ]
        .filter(Boolean)
        .join("\n\n");

      const steps = Math.min(
        typeof args.max_steps === "number" && args.max_steps > 0
          ? Math.floor(args.max_steps)
          : DEFAULT_STEPS,
        MAX_STEPS,
      );

      const result = await generateText({
        model,
        messages: [
          { role: "system", content: systemContent },
          { role: "user", content: args.prompt },
        ],
        maxSteps: steps,
      });

      logger.debug("tool.spawn_agent.done", {
        provider: selectedProvider,
        textLength: result.text.length,
        finishReason: result.finishReason,
      });

      return {
        text: result.text,
        finish_reason: result.finishReason,
        provider: selectedProvider,
      };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      logger.warn("tool.spawn_agent.failed", { message });
      return { error: "spawn_agent_failed", message };
    }
  },
});
