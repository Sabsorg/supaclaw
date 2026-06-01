import { useState } from "react";
import type { BenchmarkRow } from "../lib/supabase";

const SUITE_BADGE: Record<string, string> = {
  reasoning: "bg-blue-950 text-blue-400",
  coding: "bg-emerald-950 text-emerald-400",
  tool_use: "bg-violet-950 text-violet-400",
};

function scoreColor(v: number) {
  if (v >= 0.8) return "#22c55e";
  if (v >= 0.6) return "#f59e0b";
  return "#ef4444";
}

function rel(ts: string) {
  const d = (Date.now() - new Date(ts).getTime()) / 1000;
  if (d < 60) return `${Math.round(d)}s ago`;
  if (d < 3600) return `${Math.round(d / 60)}m ago`;
  if (d < 86400) return `${Math.round(d / 3600)}h ago`;
  return `${Math.round(d / 86400)}d ago`;
}

function suiteLabel(s: string) {
  return s === "tool_use" ? "Tool Use" : s.charAt(0).toUpperCase() + s.slice(1);
}

type Props = { benchmarks: BenchmarkRow[] };

export function BenchmarkTable({ benchmarks }: Props) {
  const [active, setActive] = useState("all");

  const suites = [...new Set(benchmarks.map((r) => r.benchmark_suite))].sort();
  const rows =
    active === "all" ? benchmarks : benchmarks.filter((r) => r.benchmark_suite === active);

  return (
    <div>
      {/* Suite pills */}
      <div className="flex gap-2 flex-wrap mb-4">
        {["all", ...suites].map((s) => (
          <button
            key={s}
            onClick={() => setActive(s)}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
              active === s
                ? "bg-violet-950 text-violet-400 border-violet-700"
                : "bg-zinc-900 text-zinc-600 border-zinc-800 hover:border-zinc-700 hover:text-zinc-400"
            }`}
          >
            {s === "all" ? "All" : suiteLabel(s)}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-12 text-zinc-700">
          <p className="text-3xl mb-3">📊</p>
          <p className="font-medium text-zinc-600 mb-1">No benchmarks yet</p>
          <p className="text-sm">Run the developer loop to populate data.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                {["Time", "Suite", "Benchmark", "Score", "Label", "Matched"].map((h) => (
                  <th
                    key={h}
                    className="text-left text-[10px] uppercase tracking-widest text-zinc-600 font-semibold px-3 py-2 border-b border-zinc-900 bg-black/30 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 50).map((r) => {
                const pct = Math.round(r.score * 100);
                const color = scoreColor(r.score);
                const matched = r.matched_keywords?.length ?? 0;
                const total = r.expected_keywords?.length ?? 0;
                return (
                  <tr key={r.id} className="border-b border-zinc-900 hover:bg-white/[0.02] transition-colors">
                    <td className="px-3 py-2.5 text-zinc-600 whitespace-nowrap">{rel(r.run_at)}</td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                          SUITE_BADGE[r.benchmark_suite] ?? "bg-amber-950 text-amber-400"
                        }`}
                      >
                        {suiteLabel(r.benchmark_suite)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-zinc-300 max-w-[220px] truncate">
                      {r.benchmark_name}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-9 font-semibold tabular-nums text-right"
                          style={{ color }}
                        >
                          {pct}%
                        </span>
                        <div className="flex-1 h-[3px] bg-zinc-800 rounded-full max-w-[50px]">
                          <div
                            className="h-[3px] rounded-full"
                            style={{ width: `${pct}%`, background: color }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-zinc-600 whitespace-nowrap">
                      {r.run_label ?? "—"}
                    </td>
                    <td className="px-3 py-2.5 text-zinc-600">
                      {total ? `${matched}/${total}` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
