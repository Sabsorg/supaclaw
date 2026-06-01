import { useEffect, useState, useCallback } from "react";
import { supabase, type BenchmarkRow, type ImprovementRow } from "./lib/supabase";
import { StatCard } from "./components/StatCard";
import { ScoreHistoryChart } from "./components/ScoreHistoryChart";
import { SuiteChart } from "./components/SuiteChart";
import { BenchmarkTable } from "./components/BenchmarkTable";
import { ImprovementLog } from "./components/ImprovementLog";

function suiteLabel(s: string) {
  return s === "tool_use" ? "Tool Use" : s.charAt(0).toUpperCase() + s.slice(1);
}
function rel(ts: string) {
  const d = (Date.now() - new Date(ts).getTime()) / 1000;
  if (d < 60) return `${Math.round(d)}s ago`;
  if (d < 3600) return `${Math.round(d / 60)}m ago`;
  if (d < 86400) return `${Math.round(d / 3600)}h ago`;
  return `${Math.round(d / 86400)}d ago`;
}

type ScoreAccent = "green" | "yellow" | "red" | "dim";
function scoreAccent(v: number): ScoreAccent {
  if (v >= 0.8) return "green";
  if (v >= 0.6) return "yellow";
  if (v > 0) return "red";
  return "dim";
}

export default function App() {
  const [benchmarks, setBenchmarks] = useState<BenchmarkRow[]>([]);
  const [improvements, setImprovements] = useState<ImprovementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    const [bRes, iRes] = await Promise.all([
      supabase
        .from("po_us_benchmarks")
        .select("id,run_at,run_label,benchmark_suite,benchmark_name,score,matched_keywords,expected_keywords")
        .order("run_at", { ascending: false })
        .limit(300),
      supabase
        .from("po_us_improvements")
        .select("id,created_at,run_label,agent_type,description,file_changed,benchmark_delta")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    if (bRes.error) {
      setError(bRes.error.message);
    } else {
      setBenchmarks((bRes.data ?? []) as BenchmarkRow[]);
      setImprovements((iRes.data ?? []) as ImprovementRow[]);
      setError(null);
    }
    setLastFetch(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 30_000);
    return () => clearInterval(id);
  }, [fetchData]);

  // ── Derive KPIs ──────────────────────────────────────────────────────────
  const latestBatch = (() => {
    if (!benchmarks.length) return [];
    const t = new Date(benchmarks[0].run_at).getTime();
    return benchmarks.filter((r) => t - new Date(r.run_at).getTime() < 5 * 60 * 1000);
  })();

  const overall =
    latestBatch.length
      ? latestBatch.reduce((s, r) => s + r.score, 0) / latestBatch.length
      : 0;

  const bySuite: Record<string, number[]> = {};
  for (const r of latestBatch) (bySuite[r.benchmark_suite] ??= []).push(r.score);
  const suiteAvg = Object.entries(bySuite)
    .map(([s, scores]) => ({ s, avg: scores.reduce((a, b) => a + b, 0) / scores.length }))
    .sort((a, b) => b.avg - a.avg);

  const distinctRuns = new Set(
    benchmarks.map((r) => r.run_label ?? r.run_at.slice(0, 16))
  ).size;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 border-b border-zinc-900 bg-gradient-to-r from-[#120d24] to-[#0e0e18] backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-lg flex-shrink-0">
            ⚡
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-zinc-100 tracking-tight leading-none">
              Po-us Dashboard
            </h1>
            <p className="text-[11px] text-zinc-600 mt-0.5">
              Benchmark performance &amp; self-improvement tracking
            </p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {lastFetch && (
              <span className="text-[11px] text-zinc-700 hidden sm:block">
                {rel(lastFetch.toISOString())}
              </span>
            )}
            <button
              onClick={fetchData}
              className="text-[12px] text-zinc-600 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-700 px-3 py-1.5 rounded-lg transition-colors bg-zinc-900/50"
            >
              ↻ Refresh
            </button>
            <span className="w-2 h-2 rounded-full bg-green-500 pulse-dot" title="Live" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-7 space-y-6">
        {/* ── Error banner ──────────────────────────────────────────────── */}
        {error && (
          <div className="bg-red-950/60 border border-red-900 rounded-xl px-4 py-3 text-sm text-red-400">
            <strong>Connection error:</strong> {error}
            <span className="block text-[11px] text-red-600 mt-1">
              Check that VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.
            </span>
          </div>
        )}

        {/* ── Skeleton / loading ─────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-surface border border-border rounded-xl p-5 animate-pulse h-24" />
            ))}
          </div>
        ) : (
          <>
            {/* ── Stat Cards ──────────────────────────────────────────── */}
            <section>
              <p className="text-[11px] uppercase tracking-widest text-zinc-700 font-semibold mb-3">
                Overview
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                  label="Overall Score"
                  value={benchmarks.length ? `${Math.round(overall * 100)}%` : "—"}
                  sub={benchmarks.length ? `Last run ${rel(benchmarks[0].run_at)}` : "No runs yet"}
                  accent={benchmarks.length ? scoreAccent(overall) : "dim"}
                />
                <StatCard
                  label="Total Benchmarks"
                  value={benchmarks.length ? String(benchmarks.length) : "—"}
                  sub={`from ${distinctRuns} distinct run${distinctRuns !== 1 ? "s" : ""}`}
                  accent="blue"
                />
                <StatCard
                  label="Best Suite"
                  value={suiteAvg.length ? suiteLabel(suiteAvg[0].s) : "—"}
                  sub={
                    suiteAvg.length > 1
                      ? `${Math.round(suiteAvg[0].avg * 100)}% · worst: ${suiteLabel(suiteAvg.at(-1)!.s)} ${Math.round(suiteAvg.at(-1)!.avg * 100)}%`
                      : suiteAvg.length === 1
                      ? `${Math.round(suiteAvg[0].avg * 100)}%`
                      : "—"
                  }
                  accent="purple"
                />
                <StatCard
                  label="Improvements"
                  value={String(improvements.length)}
                  sub={improvements.length ? `last ${rel(improvements[0].created_at)}` : "no loops run yet"}
                  accent={improvements.length ? "yellow" : "dim"}
                />
              </div>
            </section>

            {/* ── Charts ──────────────────────────────────────────────── */}
            <section className="grid grid-cols-1 lg:grid-cols-5 gap-3">
              <div className="lg:col-span-3 bg-surface border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold text-zinc-400">Score History</p>
                  <p className="text-[11px] text-zinc-700">last 20 runs</p>
                </div>
                <div className="h-52">
                  <ScoreHistoryChart benchmarks={benchmarks} />
                </div>
              </div>
              <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold text-zinc-400">Scores by Suite</p>
                  <p className="text-[11px] text-zinc-700">latest run</p>
                </div>
                <div className="h-52">
                  <SuiteChart benchmarks={benchmarks} />
                </div>
              </div>
            </section>

            {/* ── Benchmark Table ─────────────────────────────────────── */}
            <section className="bg-surface border border-border rounded-xl p-5">
              <p className="text-[11px] uppercase tracking-widest text-zinc-700 font-semibold mb-4">
                Recent Benchmarks
              </p>
              <BenchmarkTable benchmarks={benchmarks} />
            </section>

            {/* ── Improvement Log ─────────────────────────────────────── */}
            <section>
              <p className="text-[11px] uppercase tracking-widest text-zinc-700 font-semibold mb-3">
                Improvement Log
              </p>
              <ImprovementLog improvements={improvements} />
            </section>
          </>
        )}
      </main>
    </div>
  );
}
