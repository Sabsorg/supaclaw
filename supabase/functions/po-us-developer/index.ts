import { runAgent } from "../_shared/agent.ts";
import {
  jsonResponse,
  mustGetEnv,
  textResponse,
  timingSafeEqual,
} from "../_shared/helpers.ts";
import { logger } from "../_shared/logger.ts";

const DEVELOPER_CHANNEL = "api" as const;
const FALLBACK_TEXT = "(no output)";

function isAuthorized(req: Request): boolean {
  const expected = mustGetEnv("WORKER_SECRET");
  const actual = req.headers.get("x-worker-secret") ?? "";
  return timingSafeEqual(expected, actual);
}

async function runDeveloperStage(params: {
  stageName: string;
  prompt: string;
  runId: string;
}): Promise<string> {
  const { stageName, prompt, runId } = params;
  const channelChatId = `po-us-developer-${runId}-${stageName}`;
  const startedAt = Date.now();

  logger.info("po_us_developer.stage.start", { stageName, runId });

  try {
    const result = await runAgent({
      channel: DEVELOPER_CHANNEL,
      channelChatId,
      userMessage: {
        content: prompt,
        role: "system",
        channelUpdateId: `dev:${runId}:${stageName}`,
      },
      includeSessionHistory: false,
      provider: "po-us",
    });

    const text = ((await result.text) ?? "").trim() || FALLBACK_TEXT;
    logger.info("po_us_developer.stage.done", {
      stageName,
      runId,
      textLength: text.length,
      ms: Date.now() - startedAt,
    });
    return text;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logger.error("po_us_developer.stage.failed", { stageName, runId, error: msg });
    return `[${stageName} failed: ${msg}]`;
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return textResponse("method not allowed", { status: 405 });
  }
  if (!isAuthorized(req)) {
    return textResponse("forbidden", { status: 403 });
  }

  const runId = crypto.randomUUID();
  const startedAt = Date.now();
  logger.info("po_us_developer.run.start", { runId });

  try {
    // Stage 1: Evaluator — benchmark current po-us performance
    const evalOutput = await runDeveloperStage({
      stageName: "evaluator",
      runId,
      prompt: [
        "You are the Po-us Evaluator Agent.",
        "",
        "Your job: measure the current performance of Po-us using the benchmark suite.",
        "",
        "Steps:",
        "1. Call evaluate_po_us with run_label='pre-improvement' to run all benchmarks.",
        "2. Report the overall score, per-suite scores, and any benchmarks scoring below 0.6.",
        "3. Identify the top 3 weakest benchmarks by name.",
        "",
        "Be concise. Return structured results the Gap Analyzer can act on.",
      ].join("\n"),
    });

    // Stage 2: Gap Analyzer — diagnose weaknesses
    const gapOutput = await runDeveloperStage({
      stageName: "gap_analyzer",
      runId,
      prompt: [
        "You are the Po-us Gap Analyzer.",
        "",
        "Evaluation results from the Evaluator Agent:",
        evalOutput,
        "",
        "Your job: diagnose the capability gaps and recommend targeted improvements.",
        "",
        "Provide:",
        "1. Top 3 gaps with root-cause analysis (what's missing from SOUL.md, CAPABILITIES.md, or identity files)",
        "2. Specific, actionable improvement for each gap (e.g., 'add X to SOUL.md section Y')",
        "3. Priority order (highest impact first)",
        "",
        "Be specific — the Improvement Agent will use your output directly.",
      ].join("\n"),
    });

    // Stage 3: Improvement Agent — apply changes
    const improveOutput = await runDeveloperStage({
      stageName: "improvement_agent",
      runId,
      prompt: [
        "You are the Po-us Improvement Agent.",
        "",
        "Gap analysis from the Gap Analyzer:",
        gapOutput,
        "",
        "Your job: apply targeted improvements to Po-us identity and capability files.",
        "",
        "Steps:",
        "1. Read .agents/po-us/SOUL.md using read_file",
        "2. Read .agents/po-us/CAPABILITIES.md using read_file",
        "3. Apply the improvements recommended by the Gap Analyzer using edit_file",
        "4. If improvements touch CAPABILITIES.md, update the 'Known Gaps' section",
        "5. Document each change: file changed, section modified, what was added/updated",
        "",
        "Make minimal, targeted edits. Do not rewrite entire files unless necessary.",
        "Return a summary of all changes made (or attempted).",
      ].join("\n"),
    });

    // Stage 4: Validator — confirm improvements
    const validateOutput = await runDeveloperStage({
      stageName: "validator",
      runId,
      prompt: [
        "You are the Po-us Validator.",
        "",
        "Changes applied by the Improvement Agent:",
        improveOutput,
        "",
        "Your job: confirm the improvements were applied and measure impact.",
        "",
        "Steps:",
        "1. Read the modified files to confirm changes were applied correctly",
        "2. Call evaluate_po_us with run_label='post-improvement' for the suites that were targeted",
        "3. Compare the new scores to the pre-improvement scores:",
        `   Pre-improvement evaluation: ${evalOutput.slice(0, 500)}`,
        "4. Summarize:",
        "   - What improved (delta per benchmark)",
        "   - What to address in the next developer loop run",
        "   - Overall assessment: did this cycle improve Po-us?",
      ].join("\n"),
    });

    const durationMs = Date.now() - startedAt;
    logger.info("po_us_developer.run.done", { runId, durationMs });

    return jsonResponse({
      run_id: runId,
      duration_ms: durationMs,
      stages: {
        evaluation: evalOutput,
        gap_analysis: gapOutput,
        improvements: improveOutput,
        validation: validateOutput,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logger.error("po_us_developer.run.error", { runId, error: msg });
    return jsonResponse({ error: msg, run_id: runId }, { status: 500 });
  }
});
