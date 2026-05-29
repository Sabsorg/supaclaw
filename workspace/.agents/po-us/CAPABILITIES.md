# Po-us Capabilities

This file is maintained by the developer agent loop. Last format: 2026-05-28.

## Current Capability Profile

### Core Reasoning
- Multi-step logical deduction: **strong**
- Mathematical computation (via bash tool): **strong**
- Code generation and debugging: **strong**
- Creative writing: **moderate**

### Tool Use
- Web search (Brave/Exa): **enabled**
- File read/write/edit: **enabled**
- Shell execution (just-bash sandbox): **enabled**
- Memory search (hybrid FTS+semantic): **enabled**
- Skill installation: **enabled**
- Sub-agent spawning (`spawn_agent`): **enabled**
- Benchmark evaluation (`evaluate_po_us`): **enabled**

### Extended Context
- Session history: last 100 messages (configurable)
- Memory search: unlimited via pgvector + FTS hybrid
- File context: any workspace file via `read_file`

### Self-Improvement
- Developer loop frequency: every 6 hours
- Benchmark suite: reasoning, coding, tool_use
- Improvement tracking: `po_us_benchmarks` table
- Change history: `po_us_improvements` table

## Benchmark Scores (updated by developer loop)

| Suite | Last Score | Baseline | Delta |
|---|---|---|---|
| Reasoning | — | — | — |
| Coding | — | — | — |
| Tool Use | — | — | — |

*Scores are 0.0–1.0 (keyword match rate). Updated automatically.*

## Known Gaps (updated by developer loop)
- Initial run: no gaps recorded yet.

## How to Improve Po-us
1. Add benchmarks under `.agents/po-us/benchmarks/`
2. Trigger a manual developer loop run via POST to `/functions/v1/po-us-developer`
3. Check `po_us_benchmarks` table for results
4. Edit this file or SOUL.md to address identified gaps
