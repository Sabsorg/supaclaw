import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from "chart.js";
import type { BenchmarkRow } from "../lib/supabase";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

type Props = { benchmarks: BenchmarkRow[] };

export function ScoreHistoryChart({ benchmarks }: Props) {
  if (!benchmarks.length) return <EmptyState />;

  // Group into run buckets (5-minute windows keyed by label or timestamp)
  const groups = new Map<string, { time: string; scores: number[] }>();
  for (const r of benchmarks) {
    const key = r.run_label ?? r.run_at.slice(0, 16);
    if (!groups.has(key)) groups.set(key, { time: r.run_at, scores: [] });
    groups.get(key)!.scores.push(r.score);
  }
  const runs = [...groups.entries()]
    .map(([lbl, g]) => ({
      lbl: lbl.length > 20 ? lbl.slice(0, 20) + "…" : lbl,
      avg: g.scores.reduce((a, b) => a + b, 0) / g.scores.length,
    }))
    .slice(0, 20)
    .reverse();

  return (
    <Line
      data={{
        labels: runs.map((r) => r.lbl),
        datasets: [
          {
            label: "Score",
            data: runs.map((r) => +((r.avg * 100).toFixed(1))),
            borderColor: "#7c3aed",
            backgroundColor: "rgba(124,58,237,0.12)",
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: "#7c3aed",
            fill: true,
            tension: 0.35,
          },
        ],
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
            grid: { color: "#1a1a1a" },
            ticks: { color: "#444", font: { size: 10 }, maxRotation: 30 },
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

function EmptyState() {
  return (
    <div className="flex items-center justify-center h-full text-zinc-700 text-sm">
      No runs yet
    </div>
  );
}
