// The findings: one entry per research question and follow-up. Every number is looked up in site.json.
import { useState } from "react";
import { AGENTS, CELL, COLOR, NAME, PRIMARY, RUNG, RUNGS, VS_ORACLE, agentRow, ci, clickRow, fmt, gap, int, pct, sgn, type Site } from "./data";
import { Bars, ChartCard, GapBars, Legend, LineChart, type BarGroup } from "@/components/Charts";
import { Card, DL, Notice, StatStrip, Tabs } from "@/components/common";
import { Pill, VerdictPill, verdictShort } from "@/components/Pill";

export type Finding = {
  id: string; kicker: string; title: string; question: string; explo?: boolean;
  headline: (s: Site) => { value: string; unit: string; verdict: React.ReactNode };
  Detail: (p: { site: Site }) => React.ReactElement;
};

const N0 = CELL[0], K0 = CELL[1];
const Shows = ({ items }: { items: React.ReactNode[] }) => (
  <Card title="What it shows"><ul className="list-disc space-y-1.5 pl-5 text-[13px] text-muted marker:text-line-hover">{items.map((x, i) => <li key={i}>{x}</li>)}</ul></Card>
);
const NotShow = ({ children }: { children: React.ReactNode }) => <Notice tone="warning" title="What it does not show">{children}</Notice>;

function AgentTable({ site, sec, n, k, cond = "matched" }: { site: Site; sec: "rq2" | "rq3" | "phase6b"; n: number; k: number; cond?: string }) {
  const rows = AGENTS.map((a) => agentRow(site, sec, a, n, k, cond)).filter(Boolean);
  return (
    <div className="card overflow-hidden">
      <div className="card-head"><h2 className="card-title">Average per test viewer</h2><span className="count">N = {n}, k = {k}</span></div>
      <div className="overflow-auto">
        <table className="tbl w-full text-[13px]">
          <thead className="bg-surface-alt"><tr className="border-b border-line">
            {["Recommender", "Watch time", "Videos watched", "Session steps", "Watched quality"].map((h, i) => <th key={h} className={`whitespace-nowrap px-3 py-2.5 text-[12px] font-medium text-faint first:pl-4 ${i ? "text-right" : "text-left"}`}>{h}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r!.agent} className="hover:bg-hover-row">
                <td className="h-10 px-3 pl-4"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: COLOR[r!.agent as keyof typeof COLOR] }} />{NAME[r!.agent as keyof typeof NAME]}</span></td>
                <td className="px-3 text-right tabular-nums">{fmt(r!.mean_total_reward)}</td>
                <td className="px-3 text-right tabular-nums">{fmt(r!.mean_clicks, 1)}</td>
                <td className="px-3 text-right tabular-nums">{fmt(r!.mean_length, 1)}</td>
                <td className="px-3 text-right tabular-nums">{fmt(r!.mean_clicked_quality, 3)}</td>
              </tr>))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ RQ1 */
const RQ1: Finding = {
  id: "rq1", kicker: "RQ1", title: "Planning beats click-chasing", question: "Does SlateQ keep viewers watching longer than a recommender that chases the next click?",
  headline: (s) => { const g = gap(s, "rq2", PRIMARY, N0, K0)!; return { value: sgn(g.mean_diff), unit: `watch time per session, N = ${N0}, k = ${K0}`, verdict: <VerdictPill v={g.verdict} a="SlateQ" /> }; },
  Detail: ({ site }) => {
    const g = gap(site, "rq2", PRIMARY, N0, K0)!, go = gap(site, "rq2", VS_ORACLE, N0, K0)!, gl = gap(site, "rq2", "learned-myopic - oracle-myopic", N0, K0)!;
    return <>
      <StatStrip items={[
        { label: "SlateQ − learned myopic", value: sgn(g.mean_diff), tone: "accent", sub: ci(g) },
        { label: "Relative to the myopic baseline", value: pct(g.relative_to_b) },
        { label: "SlateQ − oracle myopic", value: sgn(go.mean_diff), sub: verdictShort(go.verdict) },
        { label: "Learned − oracle myopic", value: sgn(gl.mean_diff), sub: verdictShort(gl.verdict) },
      ]} />
      <ChartCard title="Difference in watch time per session" subtitle="Bars are means over 5 seeds; whiskers are 95% confidence intervals">
        <GapBars rows={[
          { label: "SlateQ vs learned myopic", sub: "the fair comparison", mean: g.mean_diff, lo: g.ci95_low, hi: g.ci95_high, color: COLOR.slateq },
          { label: "SlateQ vs oracle myopic", sub: "vs the perfect click-chaser", mean: go.mean_diff, lo: go.ci95_low, hi: go.ci95_high, color: COLOR.slateq },
          { label: "Learned vs oracle myopic", sub: "is the click-chaser well trained?", mean: gl.mean_diff, lo: gl.ci95_low, hi: gl.ci95_high, color: COLOR.learned_myopic },
        ]} />
      </ChartCard>
      <AgentTable site={site} sec="rq2" n={N0} k={K0} />
      <Shows items={[
        <>SlateQ is clearly ahead of the learned click-chaser ({ci(g)}, all 5 seeds agree) and of the perfect click-chaser ({sgn(go.mean_diff)}).</>,
        <>The learned and perfect click-chasers are {gl.verdict === "no clear difference" ? "not clearly different" : "different"} ({sgn(gl.mean_diff)}), so the gap is about planning, not a weak baseline.</>,
        <>How: SlateQ's watched videos have higher hidden quality, which gives time back, so sessions last a little longer.</>,
      ]} />
      <NotShow>The gain is small in relative terms and says nothing about real users or any real platform. This comparison repeats the SlateQ paper's own setting on purpose: it is a replication with stricter statistics.</NotShow>
    </>;
  },
};

/* ------------------------------------------------------------------ RQ2 */
function RQ2Detail({ site }: { site: Site }) {
  const gs = site.rq2.gaps;
  const ks = [...new Set(gs.map((r) => r.slate_size))].sort((a, b) => a - b);
  const [k, setK] = useState(K0);
  const ns = [...new Set(gs.filter((r) => r.slate_size === k).map((r) => r.num_candidates))].sort((a, b) => a - b);
  const [n, setN] = useState(80);
  const nn = ns.includes(n) ? n : ns[ns.length - 1];
  const p = gap(site, "rq2", PRIMARY, nn, k)!, o = gap(site, "rq2", VS_ORACLE, nn, k)!;
  const grid = gs.filter((r) => r.comparison === PRIMARY && !r.control);
  const groups: BarGroup[] = ns.map((x) => {
    const a = gap(site, "rq2", PRIMARY, x, k)!, b = gap(site, "rq2", VS_ORACLE, x, k)!;
    return { label: `N = ${x}`, key: String(x), sub: a.control ? "control" : undefined, bars: [
      { name: "vs learned myopic", value: a.mean_diff, lo: a.ci95_low, hi: a.ci95_high, color: COLOR.slateq },
      { name: "vs oracle myopic", value: b.mean_diff, lo: b.ci95_low, hi: b.ci95_high, color: COLOR.learned_myopic }] };
  });
  return <>
    <div className="flex flex-wrap items-center gap-3">
      <Tabs ariaLabel="Videos shown" active={String(k)} onChange={(v) => setK(Number(v))} items={ks.map((x) => ({ key: String(x), label: `k = ${x} shown` }))} />
      <Tabs ariaLabel="Candidates" active={String(nn)} onChange={(v) => setN(Number(v))} items={ns.map((x) => ({ key: String(x), label: `N = ${x}` }))} />
    </div>
    <StatStrip items={[
      { label: `SlateQ − learned myopic, N = ${nn}, k = ${k}`, value: sgn(p.mean_diff), tone: "accent", sub: ci(p) },
      { label: "Verdict", value: <span className="text-[15px]"><VerdictPill v={p.verdict} a="SlateQ" /></span>, sub: p.control ? "control: every candidate is shown" : undefined },
      { label: "SlateQ − oracle myopic", value: sgn(o.mean_diff), sub: verdictShort(o.verdict) },
      { label: "Settings where SlateQ is clearly higher", value: `${grid.filter((r) => r.verdict === "A higher").length} of ${grid.length}`, sub: "excluding the k = N control" },
    ]} />
    <ChartCard title={`SlateQ advantage by number of candidates, k = ${k}`} subtitle="Click a group to select it. Whiskers are 95% confidence intervals."
      footer={<Legend items={[{ label: "vs learned myopic (the fair comparison)", color: COLOR.slateq }, { label: "vs oracle myopic (the cleaner measure of planning)", color: COLOR.learned_myopic }]} />}>
      <Bars groups={groups} height={260} onPick={(x) => setN(Number(x))} active={String(nn)} />
    </ChartCard>
    <AgentTable site={site} sec="rq2" n={nn} k={k} />
    <Shows items={[
      "SlateQ is clearly ahead of the learned click-chaser in every setting with a real choice, and the gap grows steeply with N.",
      "At a fixed N, showing more videos at once (bigger k) makes the gap smaller.",
      "When every candidate is shown (k = N) there is nothing to choose and the gap is not clearly different from zero, as it must be.",
      "Two things happen at large N: SlateQ improves against the perfect click-chaser, and the learned click-chaser falls behind the perfect one. The comparison against the oracle is the cleaner measure of planning.",
    ]} />
    <NotShow>It does not show the trend beyond N = 80. "Catalog size" here means fresh candidates drawn every step (RecSim has no fixed catalogue), and the training budget was set once at N = 10.</NotShow>
  </>;
}
const RQ2: Finding = {
  id: "rq2", kicker: "RQ2 · new", title: "More choice, bigger gap", question: "How does the advantage change with more candidates (N) and more videos shown (k)?",
  headline: (s) => { const g = gap(s, "rq2", PRIMARY, 80, 3)!; const grid = s.rq2.gaps.filter((r) => r.comparison === PRIMARY && !r.control);
    return { value: sgn(g.mean_diff), unit: "watch time per session, N = 80, k = 3", verdict: <Pill tone={grid.every((r) => r.verdict === "A higher") ? "success" : "neutral"}>Clear in {grid.filter((r) => r.verdict === "A higher").length} of {grid.length} settings</Pill> }; },
  Detail: RQ2Detail,
};

/* ------------------------------------------------------------------ RQ3 */
const RQ3: Finding = {
  id: "rq3", kicker: "RQ3", title: "When viewers behave differently", question: "SlateQ assumes how viewers choose. What if they choose differently?",
  headline: (s) => { const g = gap(s, "rq3", PRIMARY, N0, K0, "severe_cascade")!; return { value: sgn(g.mean_diff), unit: "gap under the most different behaviour", verdict: <VerdictPill v={g.verdict} a="SlateQ" /> }; },
  Detail: ({ site }) => {
    const rows = RUNGS.map((c) => gap(site, "rq3", PRIMARY, N0, K0, c)!);
    const rm = agentRow(site, "rq3", "random", N0, K0, "matched"), rs = agentRow(site, "rq3", "random", N0, K0, "severe_cascade");
    return <>
      <StatStrip items={rows.map((r, i) => ({ label: RUNG[RUNGS[i]], value: sgn(r.mean_diff), tone: i === 0 ? "accent" as const : undefined, sub: verdictShort(r.verdict) }))} />
      <ChartCard title="SlateQ − learned myopic, by how far viewers depart from the assumed behaviour" subtitle={`N = ${N0}, k = ${K0}; whiskers are 95% confidence intervals`}>
        <GapBars rows={rows.map((r, i) => ({ label: RUNG[RUNGS[i]], sub: verdictShort(r.verdict), mean: r.mean_diff, lo: r.ci95_low, hi: r.ci95_high, color: i < 3 ? COLOR.slateq : COLOR.random }))} />
      </ChartCard>
      <Shows items={[
        ...rows.map((r, i) => <><b className="font-medium text-ink">{RUNG[RUNGS[i]]}:</b> {sgn(r.mean_diff)} ({ci(r)}), {verdictShort(r.verdict)}.</>),
        <>Under the severe cascade every recommender earns less (random: {fmt(rs?.mean_total_reward)} vs {fmt(rm?.mean_total_reward)} when viewers behave as assumed).</>,
      ]} />
      <NotShow>Only one cascade setting was run, so it does not show which part of the cascade removes the advantage. It does not mean the SlateQ paper was wrong: the paper's cascade is different and milder (see E4).</NotShow>
    </>;
  },
};

/* ------------------------------------------------------------------ E1 */
const E1A = "E1: SlateQ - learned-myopic, both lr 1e-3", E1B = "E1: SlateQ - learned-myopic, both lr 2.5e-4";
const E1: Finding = {
  id: "e1", kicker: "E1", explo: true, title: "Same learning speed", question: "Is the win only because the two agents used different learning rates?",
  headline: (s) => { const all = [10, 80].flatMap((n) => [gap(s, "phase6b", E1A, n, 3)!, gap(s, "phase6b", E1B, n, 3)!]);
    return { value: `${all.filter((r) => r.verdict === "A higher").length} of ${all.length}`, unit: "matched-learning-rate gaps that are clearly positive", verdict: <Pill tone={all.every((r) => r.verdict === "A higher") ? "success" : "neutral"}>Clear: SlateQ higher in {all.filter((r) => r.verdict === "A higher").length} of {all.length}</Pill> }; },
  Detail: ({ site }) => {
    const rows = [10, 80].flatMap((n) => {
      const a = gap(site, "phase6b", E1A, n, 3)!, b = gap(site, "phase6b", E1B, n, 3)!, m = gap(site, "rq2", PRIMARY, n, 3)!;
      return [
        { label: `N = ${n}: both lr 1e-3`, sub: verdictShort(a.verdict), mean: a.mean_diff, lo: a.ci95_low, hi: a.ci95_high, color: COLOR.slateq },
        { label: `N = ${n}: both lr 2.5e-4`, sub: verdictShort(b.verdict), mean: b.mean_diff, lo: b.ci95_low, hi: b.ci95_high, color: COLOR.slateq },
        { label: `N = ${n}: own tuned rates (RQ2)`, sub: "main result, for reference", mean: m.mean_diff, lo: m.ci95_low, hi: m.ci95_high, color: COLOR.random },
      ];
    });
    const lo = gap(site, "phase6b", "E1: learned-myopic (lr 1e-3) - oracle-myopic", 80, 3)!;
    return <>
      <ChartCard title="SlateQ − learned myopic with matched learning rates" subtitle="k = 3; whiskers are 95% confidence intervals"><GapBars rows={rows} /></ChartCard>
      <Shows items={[
        "With both agents at the same learning rate, SlateQ is still clearly ahead at N = 10 and N = 80, at both learning rates.",
        <>The learned click-chaser at the faster rate is still behind the oracle at N = 80 ({sgn(lo.mean_diff)}, {verdictShort(lo.verdict)}), so the learning rate does not explain its shortfall.</>,
      ]} />
      <NotShow>The size of the gap at N = 80 still depends on the learning rate; only its direction is robust.</NotShow>
    </>;
  },
};

/* ------------------------------------------------------------------ E2 */
const GAM = ["0", "0.5", "0.9", "0.95", "0.99"];
const e2 = (s: Site, g: string, n: number) => g === "0" ? gap(s, "phase6b", "E1: learned-myopic (lr 1e-3) - oracle-myopic", n, 3) : gap(s, "phase6b", `E2: gamma ${g} - oracle-myopic`, n, 3);
const E2: Finding = {
  id: "e2", kicker: "E2", explo: true, title: "How far to look ahead", question: "SlateQ with different planning horizons (γ), compared with the perfect click-chaser.",
  headline: (s) => { const g = e2(s, "0.95", 80)!; return { value: sgn(g.mean_diff), unit: "γ = 0.95 vs oracle myopic, N = 80", verdict: <VerdictPill v={g.verdict} a="γ 0.95" /> }; },
  Detail: ({ site }) => <>
    <ChartCard title="Watch time vs the perfect click-chaser, by planning horizon γ" subtitle="All at learning rate 1e-3; γ = 0 means no planning. Whiskers are 95% confidence intervals."
      footer={<Legend items={[{ label: "N = 80, k = 3", color: COLOR.slateq }, { label: "N = 10, k = 3", color: COLOR.learned_myopic }]} />}>
      <LineChart xs={GAM.map((g) => `γ ${g}`)} series={[80, 10].map((n) => ({ name: `N = ${n}`, color: n === 80 ? COLOR.slateq : COLOR.learned_myopic,
        pts: GAM.map((g) => { const r = e2(site, g, n); return r ? { y: r.mean_diff, lo: r.ci95_low, hi: r.ci95_high } : null; }) }))} height={260} />
    </ChartCard>
    <div className="card overflow-hidden"><div className="overflow-auto"><table className="tbl w-full text-[13px]">
      <thead className="bg-surface-alt"><tr className="border-b border-line"><th className="px-3 py-2.5 pl-4 text-left text-[12px] font-medium text-faint">Setting</th>{GAM.map((g) => <th key={g} className="px-3 py-2.5 text-right text-[12px] font-medium text-faint">γ {g}</th>)}</tr></thead>
      <tbody className="divide-y divide-line">{[10, 80].map((n) => <tr key={n} className="hover:bg-hover-row"><td className="h-10 px-3 pl-4">N = {n}, k = 3</td>{GAM.map((g) => { const r = e2(site, g, n); return <td key={g} className="px-3 text-right tabular-nums" title={r ? verdictShort(r.verdict) : ""}>{r ? sgn(r.mean_diff) : "-"}</td>; })}</tr>)}</tbody>
    </table></div></div>
    <Shows items={["Every γ above 0 is clearly ahead of the perfect click-chaser in both settings.", "The gain rises with γ and levels off between 0.95 and 0.99."]} />
    <NotShow>No "best γ" is claimed: only these five values were run and no curve is fitted.</NotShow>
  </>,
};

/* ------------------------------------------------------------------ E3 */
const E3C = ["E3: SlateQ - learned-myopic, both 600K steps", "E3: SlateQ (600K) - oracle-myopic", "E3: learned-myopic (600K) - oracle-myopic", "E3: learned-myopic 600K - 300K", "E3: SlateQ 600K - 300K"];
const E3L = ["SlateQ vs learned myopic, 600K steps", "SlateQ (600K) vs oracle myopic", "Learned myopic (600K) vs oracle", "Learned myopic: 600K vs 300K", "SlateQ: 600K vs 300K"];
const E3: Finding = {
  id: "e3", kicker: "E3", explo: true, title: "Twice the training", question: "Was the click-chaser just under-trained with 80 candidates?",
  headline: (s) => { const g = gap(s, "phase6b", E3C[2], 80, 3)!; return { value: sgn(g.mean_diff), unit: "learned vs oracle myopic after 600K steps", verdict: <VerdictPill v={g.verdict} a="learned" /> }; },
  Detail: ({ site }) => {
    const before = gap(site, "rq2", "learned-myopic - oracle-myopic", 80, 3)!, after = gap(site, "phase6b", E3C[2], 80, 3)!;
    return <>
      <StatStrip items={[
        { label: "Learned − oracle, 300K steps", value: sgn(before.mean_diff), sub: verdictShort(before.verdict) },
        { label: "Learned − oracle, 600K steps", value: sgn(after.mean_diff), sub: verdictShort(after.verdict), tone: "accent" },
        { label: "SlateQ − oracle, 600K steps", value: sgn(gap(site, "phase6b", E3C[1], 80, 3)!.mean_diff), sub: verdictShort(gap(site, "phase6b", E3C[1], 80, 3)!.verdict) },
      ]} />
      <ChartCard title="Comparisons at N = 80, k = 3" subtitle="Whiskers are 95% confidence intervals">
        <GapBars rows={E3C.map((c, i) => { const r = gap(site, "phase6b", c, 80, 3)!; return { label: E3L[i], sub: verdictShort(r.verdict), mean: r.mean_diff, lo: r.ci95_low, hi: r.ci95_high, color: i < 2 ? COLOR.slateq : i < 4 ? COLOR.learned_myopic : COLOR.random }; })} />
      </ChartCard>
      <Shows items={["With twice the training the learned click-chaser moves closer to the perfect one; by the rule fixed in advance this is consistent with under-training.", "SlateQ barely changes with more training and stays clearly ahead of both click-chasers, so the main RQ2 result holds."]} />
      <NotShow>Two training budgets only. Most seeds still put the learned click-chaser behind, so under-training may not be the whole story.</NotShow>
    </>;
  },
};

/* ------------------------------------------------------------------ E4 */
const E4: Finding = {
  id: "e4", kicker: "E4", explo: true, title: "The paper's own cascade", question: "The SlateQ paper used a milder top-down viewer model. Does the win come back?",
  headline: (s) => { const g = gap(s, "phase6b", "E4: SlateQ - learned-myopic", N0, K0, "paper_cascade")!; return { value: sgn(g.mean_diff), unit: "SlateQ vs learned myopic, paper's cascade", verdict: <VerdictPill v={g.verdict} a="SlateQ" /> }; },
  Detail: ({ site }) => {
    const sev = gap(site, "rq3", PRIMARY, N0, K0, "severe_cascade")!;
    const pl = gap(site, "phase6b", "E4: SlateQ - learned-myopic", N0, K0, "paper_cascade")!, po = gap(site, "phase6b", "E4: SlateQ - oracle-myopic", N0, K0, "paper_cascade")!;
    const rnd = (c: string, sec: "rq3" | "phase6b") => agentRow(site, sec, "random", N0, K0, c)?.mean_total_reward;
    return <>
      <ChartCard title="SlateQ advantage under two cascade viewer models" subtitle={`N = ${N0}, k = ${K0}; whiskers are 95% confidence intervals`}>
        <GapBars rows={[
          { label: "RecSim's cascade (RQ3)", sub: verdictShort(sev.verdict), mean: sev.mean_diff, lo: sev.ci95_low, hi: sev.ci95_high, color: COLOR.random },
          { label: "Paper's cascade: vs learned myopic", sub: verdictShort(pl.verdict), mean: pl.mean_diff, lo: pl.ci95_low, hi: pl.ci95_high, color: COLOR.slateq },
          { label: "Paper's cascade: vs oracle myopic", sub: verdictShort(po.verdict), mean: po.mean_diff, lo: po.ci95_low, hi: po.ci95_high, color: COLOR.slateq },
        ]} />
      </ChartCard>
      <Card title="Why the two cascades differ">
        <DL items={[["Viewers as assumed", <>Random recommender watch time {fmt(rnd("matched", "rq3"))}</>], ["Paper's cascade", <>Random recommender watch time {fmt(rnd("paper_cascade", "phase6b"))}</>], ["RecSim's cascade", <>Random recommender watch time {fmt(rnd("severe_cascade", "rq3"))}</>]]} />
        <p className="mt-3 text-[13px] text-muted">RecSim's cascade makes clicks rare; the paper's keeps them common, so quality can still extend sessions.</p>
      </Card>
      <NotShow>Two cascades are two data points, and this is our implementation of the paper's description, not a numerical replication. It does not show SlateQ is robust to any wrong viewer model.</NotShow>
    </>;
  },
};

/* ------------------------------------------------------------------ E5 */
function E5Detail({ site }: { site: Site }) {
  const g = site.phase6b.clicks_watch_gaps;
  const conds = [...new Map(g.map((r) => [`${r.condition}|${r.num_candidates}|${r.slate_size}`, r])).entries()];
  const [key, setKey] = useState("matched|80|3");
  const [cond, n, k] = key.split("|");
  const rows = AGENTS.map((a) => ({ a, r: clickRow(site, a, Number(n), Number(k), cond) })).filter((x) => x.r);
  const metric = (m: "click_rate" | "clicks_per_session" | "watch_per_session"): BarGroup[] => [{ label: "", bars: rows.map(({ a, r }) => ({ name: NAME[a], value: r![m], lo: r![`${m}_ci95_low`] as number, hi: r![`${m}_ci95_high`] as number, color: COLOR[a] })) }];
  const pats = new Map<string, number>();
  for (const r of g) pats.set(`${r.comparison}|${r.pattern}`, (pats.get(`${r.comparison}|${r.pattern}`) ?? 0) + 1);
  return <>
    <div className="flex flex-wrap items-center gap-2">
      <label className="text-[12px] font-medium text-muted" htmlFor="e5-set">Setting</label>
      <select id="e5-set" className="input w-auto pr-8" value={key} onChange={(e) => setKey(e.target.value)}>
        {conds.map(([kk, r]) => <option key={kk} value={kk}>{r.condition === "matched" ? `N = ${r.num_candidates}, k = ${r.slate_size}${r.control ? " (control)" : ""}` : RUNG[r.condition] ?? r.condition}</option>)}
      </select>
      <div className="ml-auto"><Legend items={AGENTS.map((a) => ({ label: NAME[a], color: COLOR[a] }))} /></div>
    </div>
    <div className="grid gap-4 lg:grid-cols-3">
      <ChartCard title="Click rate" subtitle="Clicks per recommendation"><Bars groups={metric("click_rate")} digits={3} signed={false} height={200} /></ChartCard>
      <ChartCard title="Videos watched per session"><Bars groups={metric("clicks_per_session")} digits={1} signed={false} height={200} /></ChartCard>
      <ChartCard title="Watch time per session"><Bars groups={metric("watch_per_session")} digits={1} signed={false} height={200} /></ChartCard>
    </div>
    <div className="card overflow-hidden">
      <div className="card-head"><h2 className="card-title">Pattern across all settings</h2><span className="count">{conds.length} settings per comparison</span></div>
      <div className="overflow-auto"><table className="tbl w-full text-[13px]">
        <thead className="bg-surface-alt"><tr className="border-b border-line">{["Comparison", "Pattern", "Settings"].map((h, i) => <th key={h} className={`px-3 py-2.5 text-[12px] font-medium text-faint first:pl-4 ${i === 2 ? "text-right" : "text-left"}`}>{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-line">{[...pats.entries()].sort((a, b) => b[1] - a[1]).map(([kk, c]) => { const [cmp, p] = kk.split("|"); return <tr key={kk} className="hover:bg-hover-row"><td className="h-10 px-3 pl-4 whitespace-nowrap">{cmp.replace(" - ", " vs ")}</td><td className="px-3">{p}</td><td className="px-3 text-right tabular-nums">{c}</td></tr>; })}</tbody>
      </table></div>
    </div>
    <Shows items={["The click-chasers and SlateQ get the same click rate per recommendation in almost every setting.", "The cost of chasing clicks shows up as shorter sessions: fewer videos watched and less watch time in total, not fewer clicks per recommendation.", "The motivating idea \"more clicks, less watch time\" appeared only rarely; it is reported as it came out."]} />
    <NotShow>Nothing about real platforms. In this simulator every video has the same length, so watch time per click can hardly differ by design.</NotShow>
  </>;
}
const E5: Finding = {
  id: "e5", kicker: "E5", explo: true, title: "Clicks vs watch time", question: "Does the click-chaser get more clicks but less watch time?",
  headline: (s) => { const o = clickRow(s, "oracle_myopic", 80, 3, "matched"), q = clickRow(s, "slateq", 80, 3, "matched");
    const g = s.phase6b.clicks_watch_gaps.filter((r) => r.comparison === "oracle-myopic - SlateQ");
    return { value: `${fmt(o?.clicks_per_session, 1)} vs ${fmt(q?.clicks_per_session, 1)}`, unit: "videos per session: oracle myopic vs SlateQ, N = 80",
      verdict: <Pill tone="neutral">Same click rate in {g.filter((r) => r.click_rate_verdict === "no clear difference").length} of {g.length} settings</Pill> }; },
  Detail: E5Detail,
};

export const MAIN = [RQ1, RQ2, RQ3];
export const FOLLOW = [E1, E2, E3, E4, E5];
export const FINDINGS = [...MAIN, ...FOLLOW];
export const runsSummary = (s: Site) => `${int(Object.values(s.runs).reduce((a, r) => a + r.ok, 0))} runs`;
