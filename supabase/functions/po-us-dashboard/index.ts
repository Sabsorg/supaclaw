import { createServiceClient } from "../_shared/supabase.ts";
import { mustGetEnv, timingSafeEqual, textResponse } from "../_shared/helpers.ts";

type BenchmarkRow = {
  id: number;
  run_at: string;
  run_label: string | null;
  benchmark_suite: string;
  benchmark_name: string;
  score: number;
  matched_keywords: string[] | null;
  expected_keywords: string[] | null;
};

type ImprovementRow = {
  id: number;
  created_at: string;
  run_label: string | null;
  agent_type: string;
  description: string | null;
  file_changed: string | null;
  benchmark_delta: number | null;
};

function isAuthorized(req: Request): boolean {
  const secret = Deno.env.get("WORKER_SECRET");
  if (!secret) return true; // no secret configured = open in dev
  const actual = req.headers.get("x-worker-secret") ??
    new URL(req.url).searchParams.get("secret") ?? "";
  return timingSafeEqual(secret, actual);
}

Deno.serve(async (req) => {
  if (!isAuthorized(req)) {
    return textResponse("forbidden", { status: 403 });
  }

  const supabase = createServiceClient();

  const [{ data: benchmarks }, { data: improvements }] = await Promise.all([
    supabase
      .from("po_us_benchmarks")
      .select(
        "id,run_at,run_label,benchmark_suite,benchmark_name,score,matched_keywords,expected_keywords",
      )
      .order("run_at", { ascending: false })
      .limit(300),
    supabase
      .from("po_us_improvements")
      .select("id,created_at,run_label,agent_type,description,file_changed,benchmark_delta")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const safeData = JSON.stringify({
    benchmarks: (benchmarks ?? []) as BenchmarkRow[],
    improvements: (improvements ?? []) as ImprovementRow[],
  }).replace(/<\/script>/gi, "<\\/script>");

  return new Response(renderPage(safeData), {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
});

function renderPage(data: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Po-us Dashboard</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"><\/script>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0a0a0a;color:#e0e0e0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;min-height:100vh}

/* ── Header ── */
.hdr{background:linear-gradient(135deg,#120d24 0%,#0e0e18 100%);border-bottom:1px solid #1f1f2e;padding:20px 32px;display:flex;align-items:center;gap:14px;position:sticky;top:0;z-index:10;backdrop-filter:blur(10px)}
.hdr-logo{width:38px;height:38px;background:linear-gradient(135deg,#7c3aed,#4338ca);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
.hdr-title{font-size:18px;font-weight:700;color:#f0f0f0;letter-spacing:-0.02em}
.hdr-sub{font-size:12px;color:#666;margin-top:1px}
.hdr-right{margin-left:auto;display:flex;align-items:center;gap:12px}
.pulse{width:8px;height:8px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 0 rgba(34,197,94,.4);animation:pulse 2s infinite}
@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(34,197,94,.4)}70%{box-shadow:0 0 0 8px rgba(34,197,94,0)}100%{box-shadow:0 0 0 0 rgba(34,197,94,0)}}
.refresh-btn{background:#1e1e2e;border:1px solid #2d2d3e;color:#888;font-size:12px;padding:6px 12px;border-radius:6px;cursor:pointer;transition:all .15s}
.refresh-btn:hover{background:#2d2d3e;color:#ccc}

/* ── Layout ── */
.page{padding:28px 32px;max-width:1280px;margin:0 auto}
.section-title{font-size:11px;font-weight:600;color:#444;text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px}

/* ── Stat Cards ── */
.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}
.card{background:#111;border:1px solid #1e1e1e;border-radius:12px;padding:18px 20px;transition:border-color .15s}
.card:hover{border-color:#2d2d2d}
.card-lbl{font-size:11px;color:#555;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px}
.card-val{font-size:30px;font-weight:700;letter-spacing:-0.03em;font-variant-numeric:tabular-nums}
.card-sub{font-size:11px;color:#444;margin-top:6px}
.c-green{color:#22c55e}.c-yellow{color:#f59e0b}.c-red{color:#ef4444}.c-purple{color:#a78bfa}.c-blue{color:#60a5fa}.c-dim{color:#555}

/* ── Charts ── */
.charts{display:grid;grid-template-columns:1.8fr 1fr;gap:12px;margin-bottom:24px}
.chart-card{background:#111;border:1px solid #1e1e1e;border-radius:12px;padding:20px}
.chart-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
.chart-title{font-size:13px;font-weight:600;color:#ccc}
.chart-hint{font-size:11px;color:#444}
.chart-wrap{position:relative;height:200px}

/* ── Suite pills ── */
.suite-pills{display:flex;gap:6px;margin-bottom:18px;flex-wrap:wrap}
.pill{padding:4px 12px;border-radius:20px;font-size:11px;font-weight:600;cursor:pointer;border:1px solid transparent;transition:all .15s;background:#1a1a1a;color:#555;border-color:#222}
.pill.active{background:#1e1030;color:#a78bfa;border-color:#3d2060}
.pill:hover{border-color:#333;color:#888}

/* ── Table ── */
.tbl-card{background:#111;border:1px solid #1e1e1e;border-radius:12px;overflow:hidden;margin-bottom:24px}
.tbl-hdr{padding:16px 20px 0;display:flex;align-items:center;justify-content:space-between}
.tbl-wrap{overflow-x:auto}
table{width:100%;border-collapse:collapse;font-size:12px}
thead th{padding:10px 16px;text-align:left;font-size:10px;font-weight:600;color:#444;text-transform:uppercase;letter-spacing:.07em;border-bottom:1px solid #1a1a1a;background:#0d0d0d;white-space:nowrap}
tbody td{padding:10px 16px;border-bottom:1px solid #151515;color:#bbb;white-space:nowrap}
tbody tr:last-child td{border-bottom:none}
tbody tr:hover td{background:#141414}
.score-cell{display:flex;align-items:center;gap:8px}
.score-bar-bg{flex:1;height:3px;background:#1a1a1a;border-radius:2px;max-width:60px}
.score-bar-fill{height:3px;border-radius:2px;transition:width .3s}
.badge{display:inline-flex;align-items:center;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;letter-spacing:.03em}
.bg-suite-reasoning{background:#0c1a2e;color:#60a5fa}
.bg-suite-coding{background:#0c1a1a;color:#34d399}
.bg-suite-tool_use{background:#1a0c1a;color:#c084fc}
.bg-suite-other{background:#1a1a0c;color:#fbbf24}

/* ── Improvements ── */
.improvements{display:grid;gap:8px}
.imp-row{background:#111;border:1px solid #1e1e1e;border-radius:10px;padding:14px 16px;display:flex;align-items:flex-start;gap:12px}
.imp-icon{width:28px;height:28px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;background:#1a1020}
.imp-body{flex:1;min-width:0}
.imp-title{font-size:12px;font-weight:600;color:#ccc;margin-bottom:3px}
.imp-meta{font-size:11px;color:#444}
.imp-delta{font-size:12px;font-weight:700;margin-left:auto;flex-shrink:0}

/* ── Empty state ── */
.empty{text-align:center;padding:56px 0;color:#333}
.empty-icon{font-size:32px;margin-bottom:12px}
.empty h3{font-size:14px;font-weight:600;color:#444;margin-bottom:6px}
.empty p{font-size:12px;color:#333}
@media(max-width:900px){.cards{grid-template-columns:repeat(2,1fr)}.charts{grid-template-columns:1fr}}
@media(max-width:600px){.cards{grid-template-columns:1fr}.page{padding:16px}}
</style>
</head>
<body>
<div class="hdr">
  <div class="hdr-logo">⚡</div>
  <div>
    <div class="hdr-title">Po-us Dashboard</div>
    <div class="hdr-sub">Benchmark performance &amp; self-improvement tracking</div>
  </div>
  <div class="hdr-right">
    <button class="refresh-btn" onclick="location.reload()">↻ Refresh</button>
    <div class="pulse" title="Live data"></div>
  </div>
</div>

<div class="page">
  <div class="section-title">Overview</div>
  <div class="cards">
    <div class="card">
      <div class="card-lbl">Overall Score</div>
      <div class="card-val" id="kOverall">—</div>
      <div class="card-sub" id="kOverallSub">No runs yet</div>
    </div>
    <div class="card">
      <div class="card-lbl">Total Benchmarks</div>
      <div class="card-val c-blue" id="kTotal">—</div>
      <div class="card-sub" id="kTotalSub">across all runs</div>
    </div>
    <div class="card">
      <div class="card-lbl">Best Suite</div>
      <div class="card-val c-purple" id="kBest">—</div>
      <div class="card-sub" id="kBestSub">—</div>
    </div>
    <div class="card">
      <div class="card-lbl">Improvements</div>
      <div class="card-val c-yellow" id="kImprove">—</div>
      <div class="card-sub" id="kImproveSub">developer loop cycles</div>
    </div>
  </div>

  <div class="charts">
    <div class="chart-card">
      <div class="chart-hdr">
        <span class="chart-title">Score History</span>
        <span class="chart-hint" id="histHint"></span>
      </div>
      <div class="chart-wrap"><canvas id="histChart"></canvas></div>
    </div>
    <div class="chart-card">
      <div class="chart-hdr">
        <span class="chart-title">Scores by Suite</span>
        <span class="chart-hint">latest run</span>
      </div>
      <div class="chart-wrap"><canvas id="suiteChart"></canvas></div>
    </div>
  </div>

  <div class="tbl-card">
    <div class="tbl-hdr">
      <div class="section-title" style="margin-bottom:0">Recent Benchmarks</div>
      <div class="suite-pills" id="pills"></div>
    </div>
    <div class="tbl-wrap">
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Suite</th>
            <th>Benchmark</th>
            <th>Score</th>
            <th>Label</th>
            <th>Matched</th>
          </tr>
        </thead>
        <tbody id="tblBody"></tbody>
      </table>
      <div id="tblEmpty" class="empty" style="display:none">
        <div class="empty-icon">📊</div>
        <h3>No benchmarks yet</h3>
        <p>Run the developer loop or call evaluate_po_us to populate data.</p>
      </div>
    </div>
  </div>

  <div class="section-title">Improvement Log</div>
  <div id="improvements"></div>
  <div id="improvementsEmpty" class="empty" style="display:none">
    <div class="empty-icon">🔧</div>
    <h3>No improvements recorded</h3>
    <p>Improvements are logged when the developer loop runs.</p>
  </div>
</div>

<script>
const RAW = ${data};

const SUITE_COLORS = {
  reasoning: { line: '#60a5fa', bar: 'rgba(96,165,250,0.8)' },
  coding:    { line: '#34d399', bar: 'rgba(52,211,153,0.8)' },
  tool_use:  { line: '#c084fc', bar: 'rgba(192,132,252,0.8)' },
};
function suiteColor(s) { return (SUITE_COLORS[s] || { line:'#f59e0b', bar:'rgba(251,191,36,0.8)' }); }

function scoreClass(v) {
  if (v >= 0.8) return 'c-green';
  if (v >= 0.6) return 'c-yellow';
  return 'c-red';
}
function scoreBarColor(v) {
  if (v >= 0.8) return '#22c55e';
  if (v >= 0.6) return '#f59e0b';
  return '#ef4444';
}
function fmt(v) { return (v * 100).toFixed(0) + '%'; }
function rel(ts) {
  const d = (Date.now() - new Date(ts)) / 1000;
  if (d < 60) return Math.round(d) + 's ago';
  if (d < 3600) return Math.round(d/60) + 'm ago';
  if (d < 86400) return Math.round(d/3600) + 'h ago';
  return Math.round(d/86400) + 'd ago';
}
function suiteLabel(s) {
  return s === 'tool_use' ? 'Tool Use' : s.charAt(0).toUpperCase() + s.slice(1);
}

// ── Compute stats ──
const B = RAW.benchmarks;
const I = RAW.improvements;

// KPIs
if (B.length) {
  // Overall from the most-recent run group (same run_label or same minute)
  const latestTime = new Date(B[0].run_at);
  const cutoff = new Date(latestTime - 5 * 60 * 1000); // 5-min window = "one run"
  const latestBatch = B.filter(r => new Date(r.run_at) >= cutoff);
  const overall = latestBatch.reduce((s,r) => s + r.score, 0) / latestBatch.length;

  const oEl = document.getElementById('kOverall');
  oEl.textContent = fmt(overall);
  oEl.className = 'card-val ' + scoreClass(overall);
  document.getElementById('kOverallSub').textContent = 'Last run ' + rel(B[0].run_at);

  document.getElementById('kTotal').textContent = B.length;
  document.getElementById('kTotalSub').textContent =
    'from ' + new Set(B.map(r => r.run_label || r.run_at.slice(0,16))).size + ' distinct runs';

  // Best suite (latest batch)
  const byLatestSuite = {};
  latestBatch.forEach(r => {
    if (!byLatestSuite[r.benchmark_suite]) byLatestSuite[r.benchmark_suite] = [];
    byLatestSuite[r.benchmark_suite].push(r.score);
  });
  const suiteAvg = Object.entries(byLatestSuite).map(([s,scores]) =>
    ({ suite: s, avg: scores.reduce((a,b)=>a+b,0)/scores.length }));
  suiteAvg.sort((a,b) => b.avg - a.avg);
  if (suiteAvg.length) {
    document.getElementById('kBest').textContent = suiteLabel(suiteAvg[0].suite);
    document.getElementById('kBestSub').textContent =
      fmt(suiteAvg[0].avg) + (suiteAvg.length > 1 ? ' · worst: ' + suiteLabel(suiteAvg.at(-1).suite) + ' ' + fmt(suiteAvg.at(-1).avg) : '');
  }
}

document.getElementById('kImprove').textContent = I.length;
document.getElementById('kImproveSub').textContent = I.length
  ? 'last ' + rel(I[0].created_at)
  : 'no loops run yet';

// ── Score History Chart ──
(function() {
  if (!B.length) return;

  // Group by run_label + minute bucket
  const groups = {};
  B.forEach(r => {
    const key = r.run_label || r.run_at.slice(0, 16);
    if (!groups[key]) groups[key] = { time: r.run_at, scores: [] };
    groups[key].scores.push(r.score);
  });
  const runs = Object.entries(groups)
    .map(([lbl, g]) => ({
      lbl,
      time: g.time,
      avg: g.scores.reduce((a,b)=>a+b,0) / g.scores.length,
    }))
    .sort((a,b) => new Date(a.time) - new Date(b.time))
    .slice(-20);

  document.getElementById('histHint').textContent = 'last ' + runs.length + ' runs';

  const ctx = document.getElementById('histChart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: runs.map(r => r.lbl.length > 18 ? r.lbl.slice(0,18)+'…' : r.lbl),
      datasets: [{
        label: 'Overall Score',
        data: runs.map(r => +(r.avg * 100).toFixed(1)),
        borderColor: '#7c3aed',
        backgroundColor: 'rgba(124,58,237,0.1)',
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#7c3aed',
        fill: true,
        tension: 0.3,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: {
        backgroundColor: '#1a1a2e', borderColor: '#3d2060', borderWidth: 1,
        titleColor: '#ccc', bodyColor: '#888',
        callbacks: { label: ctx => ' ' + ctx.parsed.y + '%' },
      }},
      scales: {
        x: { grid: { color: '#1a1a1a' }, ticks: { color: '#444', font: { size: 10 }, maxRotation: 30 }},
        y: { grid: { color: '#1a1a1a' }, ticks: { color: '#444', font: { size: 10 },
          callback: v => v + '%' }, min: 0, max: 100 },
      },
    },
  });
})();

// ── Suite Breakdown Chart ──
(function() {
  if (!B.length) return;

  // Latest scores per suite
  const latestTime = new Date(B[0].run_at);
  const cutoff = new Date(latestTime - 5 * 60 * 1000);
  const latestBatch = B.filter(r => new Date(r.run_at) >= cutoff);
  const bySuite = {};
  latestBatch.forEach(r => {
    if (!bySuite[r.benchmark_suite]) bySuite[r.benchmark_suite] = [];
    bySuite[r.benchmark_suite].push(r.score);
  });
  const labels = Object.keys(bySuite);
  const values = labels.map(s => +(bySuite[s].reduce((a,b)=>a+b,0)/bySuite[s].length*100).toFixed(1));
  const colors = labels.map(s => suiteColor(s).bar);

  const ctx = document.getElementById('suiteChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels.map(suiteLabel),
      datasets: [{ data: values, backgroundColor: colors, borderRadius: 6, borderSkipped: false }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: {
        backgroundColor: '#1a1a2e', borderColor: '#3d2060', borderWidth: 1,
        titleColor: '#ccc', bodyColor: '#888',
        callbacks: { label: ctx => ' ' + ctx.parsed.y + '%' },
      }},
      scales: {
        x: { grid: { display: false }, ticks: { color: '#555', font: { size: 11 }}},
        y: { grid: { color: '#1a1a1a' }, ticks: { color: '#444', font: { size: 10 },
          callback: v => v + '%' }, min: 0, max: 100 },
      },
    },
  });
})();

// ── Table with suite filter ──
(function() {
  const suites = [...new Set(B.map(r => r.benchmark_suite))].sort();
  let activeSuite = 'all';

  // Build pills
  const pillsEl = document.getElementById('pills');
  [{ id:'all', label:'All' }, ...suites.map(s => ({ id:s, label: suiteLabel(s) }))].forEach(s => {
    const p = document.createElement('button');
    p.className = 'pill' + (s.id === 'all' ? ' active' : '');
    p.textContent = s.label;
    p.onclick = () => {
      activeSuite = s.id;
      document.querySelectorAll('.pill').forEach(el => el.classList.remove('active'));
      p.classList.add('active');
      renderTable();
    };
    pillsEl.appendChild(p);
  });

  function renderTable() {
    const rows = activeSuite === 'all' ? B : B.filter(r => r.benchmark_suite === activeSuite);
    const body = document.getElementById('tblBody');
    const empty = document.getElementById('tblEmpty');
    if (!rows.length) {
      body.innerHTML = '';
      empty.style.display = 'block';
      return;
    }
    empty.style.display = 'none';
    body.innerHTML = rows.slice(0, 50).map(r => {
      const pct = Math.round(r.score * 100);
      const suiteCls = 'bg-suite-' + (r.benchmark_suite || 'other');
      const matched = (r.matched_keywords||[]).length;
      const total = (r.expected_keywords||[]).length;
      return \`<tr>
        <td style="color:#555">\${rel(r.run_at)}</td>
        <td><span class="badge \${suiteCls}">\${suiteLabel(r.benchmark_suite)}</span></td>
        <td style="color:#ddd;max-width:220px;overflow:hidden;text-overflow:ellipsis">\${r.benchmark_name}</td>
        <td>
          <div class="score-cell">
            <span style="font-variant-numeric:tabular-nums;font-weight:600;color:\${scoreBarColor(r.score)};width:34px">\${pct}%</span>
            <div class="score-bar-bg"><div class="score-bar-fill" style="width:\${pct}%;background:\${scoreBarColor(r.score)}"></div></div>
          </div>
        </td>
        <td style="color:#555;font-size:11px">\${r.run_label || '—'}</td>
        <td style="color:#444;font-size:11px">\${total ? matched+'/'+total : '—'}</td>
      </tr>\`;
    }).join('');
  }

  if (!B.length) {
    document.getElementById('tblEmpty').style.display = 'block';
  } else {
    renderTable();
  }
})();

// ── Improvements Log ──
(function() {
  const el = document.getElementById('improvements');
  const emptyEl = document.getElementById('improvementsEmpty');
  if (!I.length) {
    el.style.display = 'none';
    emptyEl.style.display = 'block';
    return;
  }
  const icons = { evaluator:'📊', gap_analyzer:'🔍', improvement_agent:'✏️', validator:'✅' };
  el.className = 'improvements';
  el.innerHTML = I.slice(0,20).map(imp => {
    const icon = icons[imp.agent_type] || '🔧';
    const delta = imp.benchmark_delta != null
      ? \`<span class="imp-delta \${imp.benchmark_delta >= 0 ? 'c-green' : 'c-red'}">\${imp.benchmark_delta >= 0 ? '+' : ''}\${(imp.benchmark_delta * 100).toFixed(1)}%</span>\`
      : '';
    return \`<div class="imp-row">
      <div class="imp-icon">\${icon}</div>
      <div class="imp-body">
        <div class="imp-title">\${imp.description || imp.agent_type}</div>
        <div class="imp-meta">
          \${rel(imp.created_at)}
          \${imp.file_changed ? '&nbsp;·&nbsp;<code style="color:#555;font-size:10px">' + imp.file_changed + '</code>' : ''}
          \${imp.run_label ? '&nbsp;·&nbsp;' + imp.run_label : ''}
        </div>
      </div>
      \${delta}
    </div>\`;
  }).join('');
})();
<\/script>
</body>
</html>`;
}
