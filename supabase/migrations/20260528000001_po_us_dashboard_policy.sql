-- Allow anonymous read access to benchmark data for the dashboard.
-- These tables contain only performance metrics — no PII or secrets.
create policy "anon can read benchmarks"
  on po_us_benchmarks for select
  to anon
  using (true);

create policy "anon can read improvements"
  on po_us_improvements for select
  to anon
  using (true);
