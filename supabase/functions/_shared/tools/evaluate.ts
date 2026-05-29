import { generateText, jsonSchema, tool } from "ai";
import { buildSystemPrompt } from "../context.ts";
import { logger } from "../logger.ts";
import { resolveProviderModel } from "../providers.ts";
import { createServiceClient } from "../supabase.ts";
import { decodeUtf8, downloadFile, listWorkspaceObjects } from "../storage.ts";

const BENCHMARKS_PATH = ".agents/po-us/benchmarks";
const EVAL_TIMEOUT_MS = 30_000;

type BenchmarkDef = {
  name: string;
  prompt: string;
  expected_keywords: string[];
  scoring: "keyword_match";
};

type EvaluateArgs = {
  suite?: string;
  run_label?: string;
};

function scoreResponse(response: string, keywords: string[]): {
  score: number;
  matched: string[];
} {
  if (keywords.length === 0) return { score: 1.0, matched: [] };
  const lower = response.toLowerCase();
  const matched = keywords.filter((kw) => lower.includes(kw.toLowerCase()));
  return {
    score: matched.length / keywords.length,
    matched,
  };
}

async function loadBenchmarks(suite?: string): Promise<
  Array<{ suite: string; benchmarks: BenchmarkDef[] }>
> {
  const { objects } = await listWorkspaceObjects(BENCHMARKS_PATH);
  const jsonFiles = objects.filter((o) =>
    o.name.endsWith(".json") &&
    (suite ? o.name === `${suite}.json` : true)
  );

  const parsed = await Promise.all(
    jsonFiles.map(async (obj) => {
      const path = `${BENCHMARKS_PATH}/${obj.name}`;
      const file = await downloadFile(path, { optional: true });
      if (!file) return null;
      try {
        const raw = JSON.parse(decodeUtf8(file));
        if (Array.isArray(raw)) {
          return { suite: obj.name.replace(/\.json$/, ""), benchmarks: raw as BenchmarkDef[] };
        }
      } catch (e) {
        logger.warn("tool.evaluate.parse_failed", { path, error: String(e) });
      }
      return null;
    }),
  );
  return parsed.filter((r): r is { suite: string; benchmarks: BenchmarkDef[] } => r !== null);
}

export const evaluatePoUsTool = tool({
  description: [
    "Run the po-us benchmark suite to measure current capabilities.",
    "Benchmarks are stored in .agents/po-us/benchmarks/ and scored by keyword matching.",
    "Results are persisted to the po_us_benchmarks table for tracking over time.",
    "Use this during the developer loop to measure performance before and after improvements.",
    "Optionally filter to a specific suite: reasoning, coding, or tool_use.",
  ].join("\n"),
  inputSchema: jsonSchema<EvaluateArgs>({
    type: "object",
    properties: {
      suite: {
        type: "string",
        description:
          "Optional benchmark suite name to run (e.g. 'reasoning', 'coding', 'tool_use'). Omit to run all.",
      },
      run_label: {
        type: "string",
        description: "Optional label for this evaluation run (e.g. 'before-improvement', 'baseline').",
      },
    },
    additionalProperties: false,
  }),
  execute: async (args: EvaluateArgs) => {
    const supabase = createServiceClient();
    const runLabel = args.run_label?.trim() || null;
    const startedAt = Date.now();

    try {
      const suites = await loadBenchmarks(args.suite?.trim() || undefined);

      if (suites.length === 0) {
        return {
          error: "no_benchmarks_found",
          message: args.suite
            ? `No benchmark suite named '${args.suite}' found at ${BENCHMARKS_PATH}.`
            : `No benchmark files found at ${BENCHMARKS_PATH}.`,
        };
      }

      const model = resolveProviderModel("po-us");
      // Load once so all parallel benchmark calls use the same overlay
      const systemPrompt = await buildSystemPrompt({
        overlayPath: ".agents/po-us",
        agentName: "Po-us",
      }).catch(
        () => "You are Po-us. Answer the following question directly and concisely.",
      );

      async function runBenchmark(suite: string, benchmark: BenchmarkDef) {
        let responseText = "";
        try {
          const result = await generateText({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: benchmark.prompt },
            ],
            maxSteps: 3,
            abortSignal: AbortSignal.timeout(EVAL_TIMEOUT_MS),
          });
          responseText = result.text;
        } catch (e) {
          logger.warn("tool.evaluate.benchmark_failed", {
            suite,
            name: benchmark.name,
            error: String(e),
          });
        }
        const { score, matched } = scoreResponse(responseText, benchmark.expected_keywords);
        return {
          suite,
          name: benchmark.name,
          score,
          matched,
          responseText,
          expectedKeywords: benchmark.expected_keywords,
        };
      }

      // Run all benchmarks in parallel across suites
      const allBenchmarkTasks = suites.flatMap(({ suite, benchmarks }) =>
        benchmarks.map((b) => runBenchmark(suite, b))
      );
      const results = await Promise.all(allBenchmarkTasks);

      // Batch-insert all results in one round-trip
      if (results.length > 0) {
        const { error: insertErr } = await supabase
          .from("po_us_benchmarks")
          .insert(
            results.map(({ suite, name, score, matched, responseText, expectedKeywords }) => ({
              run_label: runLabel,
              benchmark_suite: suite,
              benchmark_name: name,
              score,
              response_text: responseText.slice(0, 2000),
              matched_keywords: matched,
              expected_keywords: expectedKeywords,
            })) as Record<string, unknown>[],
          );
        if (insertErr) {
          logger.warn("tool.evaluate.insert_failed", { error: insertErr.message });
        }
      }

      // Aggregate scores by suite
      const bySuite: Record<string, { total: number; count: number }> = {};
      for (const { suite, score } of results) {
        if (!bySuite[suite]) bySuite[suite] = { total: 0, count: 0 };
        bySuite[suite].total += score;
        bySuite[suite].count += 1;
      }

      const suiteScores = Object.fromEntries(
        Object.entries(bySuite).map(([suite, { total, count }]) => [
          suite,
          Math.round((total / count) * 1000) / 1000,
        ]),
      );

      const overallScore = results.length > 0
        ? Math.round(
          (results.reduce((sum, r) => sum + r.score, 0) / results.length) * 1000,
        ) / 1000
        : 0;

      logger.debug("tool.evaluate.done", {
        benchmarkCount: results.length,
        overallScore,
        durationMs: Date.now() - startedAt,
      });

      return {
        run_label: runLabel,
        overall_score: overallScore,
        suite_scores: suiteScores,
        benchmark_count: results.length,
        results: results.map(({ suite, name, score, matched }) => ({
          suite,
          name,
          score,
          matched_keywords: matched,
        })),
      };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      logger.warn("tool.evaluate.failed", { message });
      return { error: "evaluate_failed", message };
    }
  },
});
