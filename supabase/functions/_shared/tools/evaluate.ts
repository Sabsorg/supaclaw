import { generateText, jsonSchema, tool } from "ai";
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

  const results: Array<{ suite: string; benchmarks: BenchmarkDef[] }> = [];
  for (const obj of jsonFiles) {
    const path = `${BENCHMARKS_PATH}/${obj.name}`;
    const file = await downloadFile(path, { optional: true });
    if (!file) continue;
    try {
      const raw = JSON.parse(decodeUtf8(file));
      if (Array.isArray(raw)) {
        const suiteName = obj.name.replace(/\.json$/, "");
        results.push({ suite: suiteName, benchmarks: raw as BenchmarkDef[] });
      }
    } catch (e) {
      logger.warn("tool.evaluate.parse_failed", { path, error: String(e) });
    }
  }
  return results;
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
      const summaries: Array<{
        suite: string;
        name: string;
        score: number;
        matched: string[];
      }> = [];

      for (const { suite, benchmarks } of suites) {
        for (const benchmark of benchmarks) {
          let responseText = "";
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(
              () => controller.abort(),
              EVAL_TIMEOUT_MS,
            );
            try {
              const result = await generateText({
                model,
                messages: [
                  {
                    role: "system",
                    content:
                      "You are Po-us. Answer the following question directly and concisely.",
                  },
                  { role: "user", content: benchmark.prompt },
                ],
                maxSteps: 3,
                abortSignal: controller.signal,
              });
              responseText = result.text;
            } finally {
              clearTimeout(timeoutId);
            }
          } catch (e) {
            logger.warn("tool.evaluate.benchmark_failed", {
              suite,
              name: benchmark.name,
              error: String(e),
            });
            responseText = "";
          }

          const { score, matched } = scoreResponse(
            responseText,
            benchmark.expected_keywords,
          );
          summaries.push({ suite, name: benchmark.name, score, matched });

          // Persist result
          await supabase.from("po_us_benchmarks").insert({
            run_label: runLabel,
            benchmark_suite: suite,
            benchmark_name: benchmark.name,
            score,
            response_text: responseText.slice(0, 2000),
            matched_keywords: matched,
            expected_keywords: benchmark.expected_keywords,
          } as Record<string, unknown>).then(({ error }) => {
            if (error) {
              logger.warn("tool.evaluate.insert_failed", { error: error.message });
            }
          });
        }
      }

      // Aggregate scores by suite
      const bySuite: Record<string, { total: number; count: number }> = {};
      for (const s of summaries) {
        if (!bySuite[s.suite]) bySuite[s.suite] = { total: 0, count: 0 };
        bySuite[s.suite].total += s.score;
        bySuite[s.suite].count += 1;
      }

      const suiteScores = Object.fromEntries(
        Object.entries(bySuite).map(([suite, { total, count }]) => [
          suite,
          Math.round((total / count) * 1000) / 1000,
        ]),
      );

      const overallScore = summaries.length > 0
        ? Math.round(
          (summaries.reduce((sum, s) => sum + s.score, 0) / summaries.length) *
            1000,
        ) / 1000
        : 0;

      logger.debug("tool.evaluate.done", {
        benchmarkCount: summaries.length,
        overallScore,
        durationMs: Date.now() - startedAt,
      });

      return {
        run_label: runLabel,
        overall_score: overallScore,
        suite_scores: suiteScores,
        benchmark_count: summaries.length,
        results: summaries.map((s) => ({
          suite: s.suite,
          name: s.name,
          score: s.score,
          matched_keywords: s.matched,
        })),
      };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      logger.warn("tool.evaluate.failed", { message });
      return { error: "evaluate_failed", message };
    }
  },
});
