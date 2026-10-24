/**
 * Throwaway prototype for the zoomed-out (1917–present) context chart.
 *
 * Reads the draft era estimates in `estimates.csv` and the zoomed-out events
 * in `events.json`, folds in the post-Oct 7 2023 daily datasets, and writes a
 * self-contained `prototype.html` (also copied to
 * `site/static/prototypes/historical-context/`) with two stacked panels sharing an x-axis:
 * killed per year by region, and the cumulative central estimate with a
 * low–high band.
 *
 * Era totals are spread evenly across the days of each era, so multi-year
 * eras (the 1936–39 revolt, the first intifada) come out flatter than they
 * really were. That's a known distortion of the draft data, not the chart.
 *
 *   bun docs/historical-context/prototype-chart.ts
 */
import fs from "fs";
import path from "path";
import gazaDaily from "../../casualties_daily.min.json";
import westBankDaily from "../../west_bank_daily.min.json";
import lebanonDaily from "../../lebanon_casualties_daily.min.json";

type Region = "palestine" | "opt" | "gaza" | "west_bank" | "lebanon";
type Estimate = { low: number; central: number; high: number };

const regions: Array<{ key: Region; label: string; light: string; dark: string }> = [
  { key: "palestine", label: "Mandate Palestine / 1948 lines", light: "#2a78d6", dark: "#3987e5" },
  { key: "opt", label: "Occupied territory (Gaza/WB not split)", light: "#eb6834", dark: "#d95926" },
  { key: "gaza", label: "Gaza", light: "#1baf7a", dark: "#199e70" },
  { key: "west_bank", label: "West Bank", light: "#eda100", dark: "#c98500" },
  { key: "lebanon", label: "Lebanon", light: "#e87ba4", dark: "#d55181" },
];

// Periods where killings are known to have happened but no usable figure
// exists yet. Drawn as hatched bands so the absence reads as a gap, not zero.
const gaps = [
  { start: "1940-01-01", end: "1947-11-29", label: "1940–47: militia killings unquantified" },
  { start: "1957-03-08", end: "1967-06-10", label: "1957–67: border killings and the 1967 war unquantified" },
  { start: "1968-01-01", end: "1978-03-13", label: "1968–78: raids on Lebanon unquantified" },
  { start: "1982-09-19", end: "2000-05-24", label: "1982–2000: occupation of south Lebanon only partly quantified" },
];

const FIRST_YEAR = 1917;
const LAST_YEAR = new Date().getUTCFullYear();
const DAY = 86_400_000;

const dir = __dirname;

const parseCsv = (text: string) => {
  const rows: string[][] = [];
  for (const line of text.trim().split("\n")) {
    const cells: string[] = [];
    let cell = "";
    let quoted = false;
    for (const ch of line) {
      if (ch === '"') quoted = !quoted;
      else if (ch === "," && !quoted) {
        cells.push(cell);
        cell = "";
      } else cell += ch;
    }
    cells.push(cell);
    rows.push(cells);
  }
  const [header, ...body] = rows;
  return body.map((cells) => Object.fromEntries(header.map((h, i) => [h, cells[i] ?? ""])));
};

const years = Array.from({ length: LAST_YEAR - FIRST_YEAR + 1 }, (_, i) => FIRST_YEAR + i);
const byYear = new Map<number, Record<Region, Estimate>>(
  years.map((y) => [
    y,
    Object.fromEntries(regions.map((r) => [r.key, { low: 0, central: 0, high: 0 }])) as Record<
      Region,
      Estimate
    >,
  ]),
);

const addSpread = (start: string, end: string, region: Region, est: Estimate) => {
  const from = Date.parse(start);
  const to = Date.parse(end) + DAY;
  const days = (to - from) / DAY;
  for (let y = new Date(from).getUTCFullYear(); y <= new Date(to - 1).getUTCFullYear(); y++) {
    const overlap =
      (Math.min(to, Date.UTC(y + 1, 0, 1)) - Math.max(from, Date.UTC(y, 0, 1))) / DAY / days;
    const bucket = byYear.get(y)?.[region];
    if (!bucket) continue;
    bucket.low += est.low * overlap;
    bucket.central += est.central * overlap;
    bucket.high += est.high * overlap;
  }
};

for (const row of parseCsv(fs.readFileSync(path.join(dir, "estimates.csv"), "utf8"))) {
  addSpread(row.start, row.end, row.region as Region, {
    low: Number(row.killed_low),
    central: Number(row.killed_central),
    high: Number(row.killed_high),
  });
}

// Post-Oct 7 2023: per-year increments of the cumulative daily series.
const addCumulative = (rows: Array<{ date: string; cum: number }>, region: Region) => {
  let prev = 0;
  for (const { date, cum } of rows) {
    const bucket = byYear.get(Number(date.slice(0, 4)))?.[region];
    if (bucket && cum > prev) {
      const delta = cum - prev;
      bucket.low += delta;
      bucket.central += delta;
      bucket.high += delta;
      prev = cum;
    }
  }
};
addCumulative(
  gazaDaily.map((r) => ({ date: r.report_date, cum: r.ext_killed_cum })),
  "gaza",
);
addCumulative(
  westBankDaily.map((r) => ({
    date: r.report_date,
    cum: (r as { verified?: { killed_cum?: number } }).verified?.killed_cum ?? r.killed_cum,
  })),
  "west_bank",
);
addCumulative(
  (lebanonDaily as Array<{ report_date: string; killed_cum: number }>).map((r) => ({
    date: r.report_date,
    cum: r.killed_cum,
  })),
  "lebanon",
);

type Event = { date: string; title: string; detail: string; tier: number };
const events = (
  JSON.parse(fs.readFileSync(path.join(dir, "events.json"), "utf8")) as Event[]
).filter((e) => e.tier === 1);

// ---- layout ---------------------------------------------------------------
const W = 1100;
const M = { left: 64, right: 24 };
const barsTop = 70;
const barsH = 300;
const cumTop = barsTop + barsH + 70;
const cumH = 200;
const H = cumTop + cumH + 40;
const plotW = W - M.left - M.right;

const x = (t: number) =>
  M.left + ((t - Date.UTC(FIRST_YEAR, 0, 1)) / (Date.UTC(LAST_YEAR + 1, 0, 1) - Date.UTC(FIRST_YEAR, 0, 1))) * plotW;
const xYear = (y: number) => x(Date.UTC(y, 0, 1));
const barW = xYear(FIRST_YEAR + 1) - xYear(FIRST_YEAR);

const totals = years.map((y) => {
  const r = byYear.get(y)!;
  return regions.reduce((s, { key }) => s + r[key].central, 0);
});
const niceMax = (v: number, step: number) => Math.ceil(v / step) * step;
const barMax = niceMax(Math.max(...totals), 5000);
const yBar = (v: number) => barsTop + barsH - (v / barMax) * barsH;

let cum = { low: 0, central: 0, high: 0 };
const cumSeries = years.map((y) => {
  const r = byYear.get(y)!;
  for (const { key } of regions) {
    cum = {
      low: cum.low + r[key].low,
      central: cum.central + r[key].central,
      high: cum.high + r[key].high,
    };
  }
  return { year: y, ...cum };
});
const cumMax = niceMax(cumSeries[cumSeries.length - 1].high, 20000);
const yCum = (v: number) => cumTop + cumH - (v / cumMax) * cumH;

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

const svg: string[] = [];
svg.push(`<svg viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t">`);
svg.push(`<title id="t">Palestinians and Lebanese killed by year, ${FIRST_YEAR}–${LAST_YEAR}</title>`);
svg.push(
  `<defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" class="hatch-line"/></pattern></defs>`,
);

// gap bands span both panels
for (const g of gaps) {
  const x0 = x(Date.parse(g.start));
  const x1 = x(Date.parse(g.end));
  svg.push(
    `<rect class="gap" x="${x0}" y="${barsTop}" width="${x1 - x0}" height="${cumTop + cumH - barsTop}" fill="url(#hatch)" data-tip="${esc(g.label)}"/>`,
  );
}

// grid + axes
for (let v = 0; v <= barMax; v += barMax / 4) {
  svg.push(`<line class="grid" x1="${M.left}" x2="${W - M.right}" y1="${yBar(v)}" y2="${yBar(v)}"/>`);
  svg.push(`<text class="axis" x="${M.left - 8}" y="${yBar(v) + 4}" text-anchor="end">${fmt(v)}</text>`);
}
for (let v = 0; v <= cumMax; v += cumMax / 4) {
  svg.push(`<line class="grid" x1="${M.left}" x2="${W - M.right}" y1="${yCum(v)}" y2="${yCum(v)}"/>`);
  svg.push(`<text class="axis" x="${M.left - 8}" y="${yCum(v) + 4}" text-anchor="end">${fmt(v)}</text>`);
}
for (let y = 1920; y <= LAST_YEAR; y += 10) {
  svg.push(`<text class="axis" x="${xYear(y)}" y="${cumTop + cumH + 20}" text-anchor="middle">${y}</text>`);
}
svg.push(`<text class="panel" x="${M.left}" y="${barsTop - 34}">Killed per year (central estimate)</text>`);
svg.push(`<text class="panel" x="${M.left}" y="${cumTop - 14}">Cumulative killed since ${FIRST_YEAR} (shaded: low–high range)</text>`);

// stacked bars, 1px surface gap between segments
years.forEach((y) => {
  const r = byYear.get(y)!;
  let base = 0;
  const tipLines = [`<b>${y}</b>`];
  for (const { key, label } of regions) {
    const v = r[key].central;
    if (v < 0.5) continue;
    const y0 = yBar(base);
    const y1 = yBar(base + v);
    svg.push(
      `<rect class="s-${key}" x="${xYear(y) + 0.5}" y="${y1 + 0.5}" width="${Math.max(barW - 1, 1)}" height="${Math.max(y0 - y1 - 1, 0.5)}"/>`,
    );
    tipLines.push(`${label}: ${fmt(v)}${r[key].high > r[key].central + 0.5 ? ` (up to ${fmt(r[key].high)})` : ""}`);
    base += v;
  }
  if (base > 0) {
    svg.push(
      `<rect class="hit" x="${xYear(y)}" y="${barsTop}" width="${barW}" height="${barsH}" data-tip="${esc(tipLines.join("<br>"))}"/>`,
    );
  }
});
svg.push(`<line class="baseline" x1="${M.left}" x2="${W - M.right}" y1="${yBar(0)}" y2="${yBar(0)}"/>`);

// cumulative band + line (step at year end)
const pt = (c: (typeof cumSeries)[number], k: "low" | "central" | "high") =>
  `${xYear(c.year + 1)},${yCum(c[k])}`;
svg.push(
  `<polygon class="band" points="${[
    ...cumSeries.map((c) => pt(c, "high")),
    ...[...cumSeries].reverse().map((c) => pt(c, "low")),
  ].join(" ")}"/>`,
);
svg.push(`<polyline class="cum" points="${cumSeries.map((c) => pt(c, "central")).join(" ")}"/>`);
for (const c of cumSeries) {
  svg.push(
    `<rect class="hit" x="${xYear(c.year)}" y="${cumTop}" width="${barW}" height="${cumH}" data-tip="${esc(
      `<b>By end of ${c.year}</b><br>${fmt(c.central)} (range ${fmt(c.low)}–${fmt(c.high)})`,
    )}"/>`,
  );
}
svg.push(`<line class="baseline" x1="${M.left}" x2="${W - M.right}" y1="${yCum(0)}" y2="${yCum(0)}"/>`);

// tier-1 events as markers above the bars
events.forEach((e, i) => {
  const ex = x(Date.parse(e.date));
  const ey = barsTop - 12 - (i % 2) * 10;
  svg.push(`<line class="event-stem" x1="${ex}" x2="${ex}" y1="${ey}" y2="${yBar(0)}"/>`);
  svg.push(
    `<circle class="event" cx="${ex}" cy="${ey}" r="4" data-tip="${esc(
      `<b>${e.date.slice(0, 4)} · ${e.title}</b><br>${e.detail}`,
    )}"/>`,
  );
});
svg.push(`</svg>`);

const legend = regions
  .map((r) => `<span class="key"><i class="s-${r.key}"></i>${r.label}</span>`)
  .join("") + `<span class="key"><i class="gap-key"></i>No usable figure yet</span>`;

const tableRows = years
  .filter((_, i) => totals[i] > 0)
  .map((y) => {
    const r = byYear.get(y)!;
    return `<tr><td>${y}</td>${regions.map(({ key }) => `<td>${fmt(r[key].central)}</td>`).join("")}</tr>`;
  })
  .join("");

const cssVars = (mode: "light" | "dark") =>
  regions.map((r) => `--s-${r.key}: ${r[mode]};`).join(" ");

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Zoomed-out context chart — prototype</title>
<style>
.viz-root { color-scheme: light; --surface: #fcfcfb; --ink: #0b0b0b; --ink-2: #52514e; --grid: #e4e3df; ${cssVars("light")}
  background: var(--surface); color: var(--ink); font: 14px/1.4 system-ui, sans-serif; padding: 24px; max-width: ${W}px; margin: auto; }
@media (prefers-color-scheme: dark) { .viz-root { color-scheme: dark; --surface: #1a1a19; --ink: #fff; --ink-2: #c3c2b7; --grid: #34332f; ${cssVars("dark")} } }
body { margin: 0; background: #fcfcfb; } @media (prefers-color-scheme: dark) { body { background: #1a1a19; } }
h1 { font-size: 20px; margin: 0 0 4px; } p.note { color: var(--ink-2); margin: 0 0 12px; max-width: 70ch; }
svg { width: 100%; height: auto; display: block; overflow: visible; }
.grid { stroke: var(--grid); stroke-width: 1; } .baseline { stroke: var(--ink-2); stroke-width: 1; }
.axis { fill: var(--ink-2); font-size: 11px; } .panel { fill: var(--ink); font-size: 13px; font-weight: 600; }
${regions.map((r) => `.s-${r.key} { fill: var(--s-${r.key}); background: var(--s-${r.key}); }`).join("\n")}
.band { fill: var(--ink-2); opacity: .18; } .cum { fill: none; stroke: var(--ink); stroke-width: 2; }
.hatch-line { stroke: var(--ink-2); stroke-width: 1; opacity: .35; } .gap { cursor: help; }
.hit { fill: transparent; } .hit:hover { fill: var(--ink); opacity: .06; }
.event { fill: var(--surface); stroke: var(--ink); stroke-width: 2; cursor: help; } .event-stem { stroke: var(--ink-2); stroke-width: 1; stroke-dasharray: 2 3; opacity: .5; }
.legend { display: flex; flex-wrap: wrap; gap: 6px 16px; margin: 8px 0 4px; color: var(--ink-2); font-size: 12px; }
.key i { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 6px; vertical-align: -1px; }
.gap-key { background: repeating-linear-gradient(45deg, var(--ink-2) 0 1px, transparent 1px 4px); opacity: .6; }
#tip { position: fixed; pointer-events: none; background: var(--surface); color: var(--ink); border: 1px solid var(--grid); border-radius: 6px; padding: 8px 10px; font-size: 12px; max-width: 320px; box-shadow: 0 4px 16px rgb(0 0 0 / .15); display: none; }
table { border-collapse: collapse; font-size: 12px; font-variant-numeric: tabular-nums; } td, th { padding: 2px 10px; text-align: right; border-bottom: 1px solid var(--grid); }
</style></head>
<body><div class="viz-root">
<h1>Prototype: ${FIRST_YEAR}–${LAST_YEAR} in context</h1>
<p class="note">Draft data from docs/historical-context/estimates.csv. Era totals are spread evenly across their dates, and hatched spans are periods with no usable figure, not zero deaths. This is for deciding scope, not for publishing.</p>
<div class="legend">${legend}</div>
${svg.join("\n")}
<details><summary>Table view</summary><table><thead><tr><th>Year</th>${regions.map((r) => `<th>${r.label}</th>`).join("")}</tr></thead><tbody>${tableRows}</tbody></table></details>
<div id="tip"></div>
</div>
<script>
const tip = document.getElementById("tip");
document.querySelectorAll("[data-tip]").forEach((el) => {
  el.addEventListener("mousemove", (e) => { tip.innerHTML = el.dataset.tip; tip.style.display = "block";
    tip.style.left = Math.min(e.clientX + 14, innerWidth - 340) + "px"; tip.style.top = e.clientY + 14 + "px"; });
  el.addEventListener("mouseleave", () => { tip.style.display = "none"; });
});
</script></body></html>`;

fs.writeFileSync(path.join(dir, "prototype.html"), html);
// Also publish under the site's static dir so branch previews serve it at
// /prototypes/historical-context/.
const publishDir = path.join(dir, "../../site/static/prototypes/historical-context");
fs.mkdirSync(publishDir, { recursive: true });
fs.writeFileSync(path.join(publishDir, "index.html"), html);
console.log(
  `wrote prototype.html — cumulative central ${fmt(cumSeries[cumSeries.length - 1].central)} (range ${fmt(
    cumSeries[cumSeries.length - 1].low,
  )}–${fmt(cumSeries[cumSeries.length - 1].high)})`,
);
const pre = cumSeries.find((c) => c.year === 2022)!;
console.log(`by end of 2022: ${fmt(pre.central)} (range ${fmt(pre.low)}–${fmt(pre.high)})`);
