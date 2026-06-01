import type { ImprovementRow } from "../lib/supabase";

const ICONS: Record<string, string> = {
  evaluator: "📊",
  gap_analyzer: "🔍",
  improvement_agent: "✏️",
  validator: "✅",
};

function rel(ts: string) {
  const d = (Date.now() - new Date(ts).getTime()) / 1000;
  if (d < 60) return `${Math.round(d)}s ago`;
  if (d < 3600) return `${Math.round(d / 60)}m ago`;
  if (d < 86400) return `${Math.round(d / 3600)}h ago`;
  return `${Math.round(d / 86400)}d ago`;
}

type Props = { improvements: ImprovementRow[] };

export function ImprovementLog({ improvements }: Props) {
  if (!improvements.length) {
    return (
      <div className="text-center py-12 text-zinc-700">
        <p className="text-3xl mb-3">🔧</p>
        <p className="font-medium text-zinc-600 mb-1">No improvements recorded</p>
        <p className="text-sm">Improvements are logged when the developer loop runs.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {improvements.slice(0, 20).map((imp) => {
        const icon = ICONS[imp.agent_type] ?? "🔧";
        const delta = imp.benchmark_delta;
        return (
          <div
            key={imp.id}
            className="flex items-start gap-3 bg-surface border border-border rounded-xl px-4 py-3"
          >
            <div className="w-7 h-7 rounded-lg bg-violet-950/50 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-300 leading-snug">
                {imp.description ?? imp.agent_type}
              </p>
              <p className="text-[11px] text-zinc-600 mt-1">
                {rel(imp.created_at)}
                {imp.file_changed && (
                  <> · <code className="text-zinc-700 text-[10px]">{imp.file_changed}</code></>
                )}
                {imp.run_label && <> · {imp.run_label}</>}
              </p>
            </div>
            {delta != null && (
              <span
                className={`text-sm font-bold flex-shrink-0 ${
                  delta >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {delta >= 0 ? "+" : ""}
                {(delta * 100).toFixed(1)}%
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
