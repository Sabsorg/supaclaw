type Props = {
  label: string;
  value: string;
  sub?: string;
  accent?: "green" | "yellow" | "red" | "purple" | "blue" | "dim";
};

const accentClass: Record<string, string> = {
  green: "text-green-400",
  yellow: "text-amber-400",
  red: "text-red-400",
  purple: "text-violet-400",
  blue: "text-blue-400",
  dim: "text-zinc-500",
};

export function StatCard({ label, value, sub, accent = "dim" }: Props) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5 hover:border-zinc-700 transition-colors">
      <p className="text-[11px] uppercase tracking-widest text-zinc-600 font-semibold mb-2.5">
        {label}
      </p>
      <p className={`text-[30px] font-bold tracking-tight tabular-nums leading-none ${accentClass[accent]}`}>
        {value}
      </p>
      {sub && <p className="text-[11px] text-zinc-600 mt-1.5">{sub}</p>}
    </div>
  );
}
