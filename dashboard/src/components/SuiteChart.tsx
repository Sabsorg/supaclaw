import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from "chart.js";
import type { BenchmarkRow } from "../lib/supabase";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const SUITE_COLORS: Record<string, string> = {
  reasoning: "rgba(96,165,250,0.85)",
  coding: "rgba(52,211,153,0.85)",
  tool_use: "rgba(192,132,252,0.85)",
};

type Props = { benchmarks: BenchmarkRow[] };

export function SuiteChart({ benchmarks }: Props) {
  if (!benchmarks.length) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-700 text-sm">
        No data yet
      </div>
    );
  }

  // Latest batch = past 5-minute window from most recent row
  const latestTime = new Date(benchmarks[0].run_at).getTime();
  const batch = benchmarks.filter(
    (r) => latestTime - new Date(r.run_at).getTime() < 5 * 60 * 1000
  );

  const bySuite: Record<string, number[]> = {};
  for (const r of batch) {
    (bySuite[r.benchmark_suite] ??= []).push(r.score);
  }

  const labels = Object.keys(bySuite).map((s) =>
    s === "tool_use" ? "Tool Use" : s.charAt(0).toUpperCase() + s.slice(1)
  );
  const values = Object.keys(bySuite).map(
    (s) => +((bySuite[s].reduce((a, b) => a + b, 0) / bySuite[s].length) * 100).toFixed(1)
  );
  const colors = Object.keys(bySuite).map(
    (s) => SUITE_COLORS[s] ?? "rgba(251,191,36,0.85)"
  );

  return (
    <Bar
      data={{
        labels,
        datasets: [{ data: values, backgroundColor: colors, borderRadius: 6, borderSkipped: false }],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#1a1a2e",
            borderColor: "#3d2060",
            borderWidth: 1,
            titleColor: "#ccc",
            bodyColor: "#888",
            callbacks: { label: (c) => ` ${c.parsed.y}%` },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: "#555", font: { size: 12 } },
          },
          y: {
            grid: { color: "#1a1a1a" },
            ticks: { color: "#444", font: { size: 10 }, callback: (v) => `${v}%` },
            min: 0,
            max: 100,
          },
        },
      }}
    />
  );
}
