import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !key) {
  console.error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — copy .env.example to .env and fill in your project values."
  );
}

export const supabase = createClient(url ?? "", key ?? "");

export type BenchmarkRow = {
  id: number;
  run_at: string;
  run_label: string | null;
  benchmark_suite: string;
  benchmark_name: string;
  score: number;
  matched_keywords: string[] | null;
  expected_keywords: string[] | null;
};

export type ImprovementRow = {
  id: number;
  created_at: string;
  run_label: string | null;
  agent_type: string;
  description: string | null;
  file_changed: string | null;
  benchmark_delta: number | null;
};
