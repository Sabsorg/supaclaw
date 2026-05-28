-- Po-us: benchmark tracking and improvement history tables

set search_path = public, extensions;

-- Stores results of each benchmark evaluation run
create table if not exists po_us_benchmarks (
  id bigint generated always as identity primary key,
  run_at timestamptz not null default now(),
  run_label text,
  benchmark_suite text not null,
  benchmark_name text not null,
  score numeric(5,4) not null check (score >= 0 and score <= 1),
  baseline_score numeric(5,4) check (baseline_score >= 0 and baseline_score <= 1),
  improvement_delta numeric(6,4) generated always as (
    case when baseline_score is not null then score - baseline_score else null end
  ) stored,
  response_text text,
  matched_keywords text[],
  expected_keywords text[],
  details jsonb not null default '{}'::jsonb
);

alter table po_us_benchmarks enable row level security;

create index if not exists po_us_benchmarks_run_at_idx on po_us_benchmarks (run_at desc);
create index if not exists po_us_benchmarks_suite_idx on po_us_benchmarks (benchmark_suite);

-- Audit trail of what the developer agents changed
create table if not exists po_us_improvements (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  run_label text,
  agent_type text not null,
  description text,
  file_changed text,
  before_content text,
  after_content text,
  benchmark_delta numeric(6,4),
  details jsonb not null default '{}'::jsonb
);

alter table po_us_improvements enable row level security;

create index if not exists po_us_improvements_created_at_idx on po_us_improvements (created_at desc);

-- Lock down to service_role only
revoke execute on all functions in schema public from public;
grant select, insert, update, delete on po_us_benchmarks to service_role;
grant select, insert, update, delete on po_us_improvements to service_role;
grant usage, select on sequence po_us_benchmarks_id_seq to service_role;
grant usage, select on sequence po_us_improvements_id_seq to service_role;
