#!/usr/bin/env node
// Visual analytics report for mridulmerges.ca, pulled from Workers Analytics Engine.
// Usage:
//   CF_ACCOUNT_ID=… CF_API_TOKEN=… node scripts/report.mjs [days=28] [out=stats/report.html]
//   node scripts/report.mjs --demo            (sample data, for previewing the layout)
// The token needs Account Analytics: Read. Output is one self-contained HTML file.
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const args = process.argv.slice(2);
const demo = args.includes("--demo");
const pos = args.filter((a) => !a.startsWith("--"));
const DAYS = Math.max(1, Math.min(90, parseInt(pos.find((a) => /^\d+$/.test(a)) || "28", 10)));
const OUT = pos.find((a) => !/^\d+$/.test(a)) || "stats/report.html";
const DATASET = "mridulmerges_clicks";

const SOURCE_NAMES = {
  tiktok: "TikTok", ig: "Instagram", yt: "YouTube", li: "LinkedIn", gh: "GitHub",
  "www.tiktok.com": "TikTok", "l.instagram.com": "Instagram", "www.instagram.com": "Instagram",
  "www.youtube.com": "YouTube", "m.youtube.com": "YouTube", "www.linkedin.com": "LinkedIn",
  "lnkd.in": "LinkedIn", "github.com": "GitHub", "www.google.com": "Google", direct: "Direct",
};
const LINK_NAMES = {
  tiktok: "TikTok", instagram: "Instagram", youtube: "YouTube", linkedin: "LinkedIn",
  gusset: "Gusset", switchboard: "Switchboard",
};

async function sql(query) {
  const { CF_ACCOUNT_ID, CF_API_TOKEN } = process.env;
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN) throw new Error("Set CF_ACCOUNT_ID and CF_API_TOKEN (or use --demo).");
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/analytics_engine/sql`, {
    method: "POST",
    headers: { Authorization: `Bearer ${CF_API_TOKEN}` },
    body: `${query} FORMAT JSON`,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`SQL API ${res.status}: ${text.slice(0, 300)}`);
  return JSON.parse(text).data.map((r) => ({ ...r, n: Number(r.n) }));
}

const WHERE = (ev) =>
  `FROM ${DATASET} WHERE blob1 = '${ev}' AND blob7 = 'human' AND timestamp > NOW() - INTERVAL '${DAYS}' DAY`;

async function load() {
  if (demo) return demoData();
  const [daily, sources, links, countries, devices] = await Promise.all([
    sql(`SELECT toDate(timestamp) AS day, blob1 AS ev, SUM(_sample_interval) AS n FROM ${DATASET} WHERE blob1 IN ('view','click') AND blob7 = 'human' AND timestamp > NOW() - INTERVAL '${DAYS}' DAY GROUP BY day, ev ORDER BY day`),
    sql(`SELECT if(blob6 != '', blob6, if(blob4 != '', blob4, 'direct')) AS k, SUM(_sample_interval) AS n ${WHERE("view")} GROUP BY k ORDER BY n DESC LIMIT 12`),
    sql(`SELECT blob2 AS k, SUM(_sample_interval) AS n ${WHERE("click")} GROUP BY k ORDER BY n DESC`),
    sql(`SELECT if(blob3 != '', blob3, '??') AS k, SUM(_sample_interval) AS n ${WHERE("view")} GROUP BY k ORDER BY n DESC LIMIT 8`),
    sql(`SELECT blob5 AS k, SUM(_sample_interval) AS n ${WHERE("view")} GROUP BY k ORDER BY n DESC`),
  ]);
  return { daily, sources, links, countries, devices };
}

function demoData() {
  const daily = [];
  const today = new Date();
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(today - i * 864e5).toISOString().slice(0, 10);
    const v = Math.round(20 + 30 * Math.sin(i / 3) ** 2 + (DAYS - i) * 1.5);
    daily.push({ day: d, ev: "view", n: v }, { day: d, ev: "click", n: Math.round(v * 0.42) });
  }
  return {
    daily,
    sources: [{ k: "tiktok", n: 412 }, { k: "ig", n: 268 }, { k: "www.linkedin.com", n: 151 }, { k: "yt", n: 97 }, { k: "direct", n: 64 }, { k: "gh", n: 12 }],
    links: [{ k: "gusset", n: 188 }, { k: "tiktok", n: 96 }, { k: "linkedin", n: 71 }, { k: "switchboard", n: 54 }, { k: "youtube", n: 33 }, { k: "instagram", n: 21 }],
    countries: [{ k: "CA", n: 540 }, { k: "US", n: 241 }, { k: "IN", n: 118 }, { k: "GB", n: 40 }, { k: "MX", n: 18 }],
    devices: [{ k: "mobile", n: 801 }, { k: "desktop", n: 203 }],
  };
}

// Fold raw source keys (ig, l.instagram.com, …) into one label each.
function fold(rows, names) {
  const m = new Map();
  for (const r of rows) {
    const label = names[r.k] || r.k;
    m.set(label, (m.get(label) || 0) + r.n);
  }
  return [...m].map(([k, n]) => ({ k, n })).sort((a, b) => b.n - a.n);
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const fmt = (n) => n.toLocaleString("en-CA");
const regionName = (() => {
  try { const d = new Intl.DisplayNames(["en"], { type: "region" }); return (c) => (c === "??" ? "Unknown" : d.of(c) || c); }
  catch { return (c) => c; }
})();

function bars(rows, { unit, total }) {
  if (!rows.length) return `<p class="empty">No data yet.</p>`;
  const max = Math.max(...rows.map((r) => r.n));
  return `<ol class="bars">${rows
    .map((r) => {
      const pct = total ? Math.round((r.n / total) * 100) : 0;
      return `<li title="${esc(r.k)}: ${fmt(r.n)} ${unit} (${pct}%)"><span class="lbl">${esc(r.k)}</span><span class="track"><span class="fill" style="width:${Math.max(1.5, (r.n / max) * 100)}%"></span></span><span class="val">${fmt(r.n)}<small>${pct}%</small></span></li>`;
    })
    .join("")}</ol>`;
}

function dailyChart(days) {
  // Two charts sharing one x-axis: visits on top, clicks below. No dual axis.
  const W = 760, H = 120, padL = 36, padB = 18, gap = 2;
  const n = days.length;
  const bw = (W - padL) / n - gap;
  const panel = (key, label) => {
    const max = Math.max(1, ...days.map((d) => d[key]));
    const step = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000].find((v) => v * 2 >= max) || Math.ceil(max / 2);
    const nice = step * 2;
    const y = (v) => H - padB - (v / nice) * (H - padB - 8);
    const grid = [0, nice / 2, nice]
      .map((g) => `<line x1="${padL}" x2="${W}" y1="${y(g)}" y2="${y(g)}" class="grid"/><text x="${padL - 6}" y="${y(g) + 4}" class="tick" text-anchor="end">${fmt(g)}</text>`)
      .join("");
    const marks = days
      .map((d, i) => {
        const x = padL + i * (bw + gap) + gap / 2;
        const h = Math.max(0, H - padB - y(d[key]));
        const r = Math.min(4, bw / 2, h);
        const top = H - padB - h;
        const path = h > 0
          ? `M${x},${H - padB} V${top + r} Q${x},${top} ${x + r},${top} H${x + bw - r} Q${x + bw},${top} ${x + bw},${top + r} V${H - padB} Z`
          : "";
        return `<g class="hit"><rect x="${x - gap / 2}" y="0" width="${bw + gap}" height="${H - padB}" fill="transparent"/>${path ? `<path d="${path}" class="bar ${key}"/>` : ""}<title>${d.day}: ${fmt(d[key])} ${label.toLowerCase()}</title></g>`;
      })
      .join("");
    const every = Math.ceil(n / 7);
    const xt = days
      .map((d, i) => (i % every === 0 || i === n - 1)
        ? `<text x="${padL + i * (bw + gap) + bw / 2}" y="${H - 3}" class="tick" text-anchor="${i === n - 1 ? "end" : i === 0 ? "start" : "middle"}">${new Date(d.day + "T12:00").toLocaleDateString("en-CA", { month: "short", day: "numeric" })}</text>`
        : "")
      .join("");
    return `<figure class="panel"><figcaption>${label} per day</figcaption><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${label} per day, last ${n} days">${grid}${marks}${xt}</svg></figure>`;
  };
  return panel("view", "Visits") + panel("click", "Clicks");
}

function render(d) {
  const byDay = new Map();
  const today = new Date();
  for (let i = DAYS - 1; i >= 0; i--) byDay.set(new Date(today - i * 864e5).toISOString().slice(0, 10), { view: 0, click: 0 });
  for (const r of d.daily) {
    const key = String(r.day).slice(0, 10);
    if (byDay.has(key)) byDay.get(key)[r.ev] = r.n;
  }
  const days = [...byDay].map(([day, v]) => ({ day, ...v }));
  const visits = days.reduce((s, x) => s + x.view, 0);
  const clicks = days.reduce((s, x) => s + x.click, 0);
  const half = Math.floor(days.length / 2);
  const prev = days.slice(0, half).reduce((s, x) => s + x.view, 0);
  const cur = days.slice(half).reduce((s, x) => s + x.view, 0);
  const trend = prev ? Math.round(((cur - prev) / prev) * 100) : null;
  const sources = fold(d.sources, SOURCE_NAMES);
  const links = fold(d.links, LINK_NAMES);
  const countries = d.countries.map((r) => ({ k: regionName(r.k), n: r.n }));
  const devices = d.devices.map((r) => ({ k: r.k === "mobile" ? "Phone" : "Desktop", n: r.n }));
  const mobile = devices.find((x) => x.k === "Phone")?.n || 0;
  const topSource = sources[0]?.k || "—";
  const topLink = links[0]?.k || "—";
  const generated = new Date().toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Moncton" });

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Site analytics</title>
<style>
:root{--paper:#f3f0e8;--card:#faf8f3;--ink:#141414;--ink2:#45423c;--ink3:#5f5b53;--rule:#d9d4c7;--sig:#e8501a;--sig2:#141414;--track:#ebe6da;color-scheme:light}
@media (prefers-color-scheme:dark){:root{--paper:#121110;--card:#1b1a18;--ink:#f1ede4;--ink2:#c9c3b6;--ink3:#9a9488;--rule:#34312c;--sig:#f0662f;--sig2:#d9d4c7;--track:#2a2825;color-scheme:dark}}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:15px/1.5 "IBM Plex Sans",system-ui,sans-serif}
.wrap{max-width:860px;margin:0 auto;padding:28px 16px 48px}
header{display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap;border-bottom:2px solid var(--ink);padding-bottom:10px}
h1{font:800 clamp(26px,5vw,40px)/1 "Archivo",system-ui,sans-serif;letter-spacing:-.02em;margin:0}
.meta{font:500 12px/1.4 "IBM Plex Mono",ui-monospace,monospace;color:var(--ink3);text-transform:uppercase;letter-spacing:.06em}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:0;margin:22px 0;border:1px solid var(--rule);background:var(--card)}
.kpi{padding:16px;border-right:1px solid var(--rule)}.kpi:last-child{border-right:0}
.kpi b{display:block;font:800 clamp(24px,4vw,34px)/1.05 "Archivo",system-ui,sans-serif;letter-spacing:-.02em}
.kpi span{font:500 11px/1.3 "IBM Plex Mono",ui-monospace,monospace;color:var(--ink3);text-transform:uppercase;letter-spacing:.06em}
.kpi em{font-style:normal;color:var(--ink2);font-size:13px;display:block;margin-top:4px}
h2{font:500 12px/1 "IBM Plex Mono",ui-monospace,monospace;text-transform:uppercase;letter-spacing:.08em;color:var(--ink3);margin:30px 0 10px;display:flex;gap:10px;align-items:center}
h2::after{content:"";flex:1;height:1px;background:var(--rule)}
.panel{margin:0 0 10px;background:var(--card);border:1px solid var(--rule);padding:12px 12px 6px}
.panel figcaption{font-weight:600;font-size:13px;margin-bottom:4px}
svg{width:100%;height:auto;display:block}.grid{stroke:var(--rule);stroke-width:1}.tick{fill:var(--ink3);font:10px "IBM Plex Mono",ui-monospace,monospace}
.bar.view{fill:var(--sig)}.bar.click{fill:var(--sig2)}.hit:hover .bar{opacity:.75}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:10px 28px}
.bars{list-style:none;margin:0;padding:0}.bars li{display:grid;grid-template-columns:96px 1fr 74px;align-items:center;gap:10px;padding:6px 0;border-bottom:1px dashed var(--rule)}
.lbl{font-weight:600;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.track{height:10px;background:var(--track);border-radius:0 4px 4px 0}.fill{display:block;height:100%;background:var(--sig);border-radius:0 4px 4px 0}
.links .fill{background:var(--sig2)}
.val{text-align:right;font:500 13px "IBM Plex Mono",ui-monospace,monospace}.val small{display:block;color:var(--ink3);font-size:11px}
.empty{color:var(--ink3)}
footer{margin-top:34px;font:500 11px/1.5 "IBM Plex Mono",ui-monospace,monospace;color:var(--ink3);border-top:1px solid var(--rule);padding-top:10px}
@media (max-width:640px){.kpis{grid-template-columns:1fr 1fr}.kpi:nth-child(2){border-right:0}.kpi:nth-child(-n+2){border-bottom:1px solid var(--rule)}.cols{grid-template-columns:1fr}}
</style></head><body><div class="wrap">
<header><h1>mridulmerges.ca</h1><div class="meta">Last ${DAYS} days · ${esc(generated)} AT${demo ? " · SAMPLE DATA" : ""}</div></header>
<section class="kpis" aria-label="Headline numbers">
<div class="kpi"><span>Visits</span><b>${fmt(visits)}</b><em>${trend === null ? "first period" : `${trend >= 0 ? "▲" : "▼"} ${Math.abs(trend)}% vs prior ${DAYS - half}d`}</em></div>
<div class="kpi"><span>Link clicks</span><b>${fmt(clicks)}</b><em>${visits ? Math.round((clicks / visits) * 100) : 0}% of visits</em></div>
<div class="kpi"><span>Top source</span><b>${esc(topSource)}</b><em>${sources[0] ? `${fmt(sources[0].n)} visits` : "&nbsp;"}</em></div>
<div class="kpi"><span>Top link</span><b>${esc(topLink)}</b><em>${links[0] ? `${fmt(links[0].n)} clicks` : "&nbsp;"}</em></div>
</section>
<h2>Over time</h2>
${dailyChart(days)}
<div class="cols">
<section><h2>Where visits come from</h2>${bars(sources, { unit: "visits", total: visits })}</section>
<section class="links"><h2>What people click</h2>${bars(links, { unit: "clicks", total: clicks })}</section>
<section><h2>Countries</h2>${bars(countries, { unit: "visits", total: visits })}</section>
<section><h2>Devices · ${visits ? Math.round((mobile / visits) * 100) : 0}% phones</h2>${bars(devices, { unit: "visits", total: visits })}</section>
</div>
<footer>Humans only (bots, link previews and crawlers filtered). Sources come from ?src= tags in bio links, else the referrer. Workers Analytics Engine · dataset ${DATASET}.</footer>
</div></body></html>`;
}

const data = await load();
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, render(data));
console.log(`Wrote ${OUT}`);
