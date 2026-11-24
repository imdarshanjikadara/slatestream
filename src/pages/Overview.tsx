// Overview: headline numbers and the four charts that carry the study.
import { Link } from "react-router-dom";
import { ArrowRight, MonitorPlay } from "lucide-react";
import { AGENTS, CELL, COLOR, NAME, PRIMARY, RUNG, RUNGS, VS_ORACLE, agentRow, gap, int, pct, sgn, useSite } from "@/lib/data";
import { ErrorState, Loading, PageHeader, StatStrip, Tabs } from "@/components/common";
import { Bars, ChartCard, GapBars, Legend, LineChart } from "@/components/Charts";
import { Pill } from "@/components/Pill";
import { useState } from "react";
import { Compass } from "lucide-react";
import { useTour, TOUR } from "@/lib/tour";
import { Term } from "@/components/Help";

const GAM = ["0", "0.5", "0.9", "0.95", "0.99"];

export default function Overview() {
  const site = useSite();
  const [k, setK] = useState("3");
  const tour = useTour();
  if (site.error) return <ErrorState error={site.error} />;
  if (!site.data) return <Loading />;
  const S = site.data;
  const g = gap(S, "rq2", PRIMARY, ...CELL)!;
  const grid = S.rq2.gaps.filter((r) => r.comparison === PRIMARY && !r.control);
  const g80 = gap(S, "rq2", VS_ORACLE, 80, 3)!;
  const sev = gap(S, "rq3", PRIMARY, CELL[0], CELL[1], "severe_cascade")!;
  const runs = Object.values(S.runs).reduce((a, r) => a + r.ok, 0);
  const ns = [...new Set(S.rq2.gaps.filter((r) => r.slate_size === Number(k)).map((r) => r.num_candidates))].sort((a, b) => a - b);
  const e2 = (gm: string, n: number) => gm === "0" ? gap(S, "phase6b", "E1: learned-myopic (lr 1e-3) - oracle-myopic", n, 3) : gap(S, "phase6b", `E2: gamma ${gm} - oracle-myopic`, n, 3);
  return (
    <div className="page">
      <PageHeader title="Overview" subtitle={`Does a recommender that plans for the whole session (SlateQ) keep simulated viewers watching longer than one that chases the next click? Results from ${int(runs)} training and evaluation runs in RecSim's Interest Evolution simulator.`}>
        <div className="flex flex-wrap items-center gap-1.5"><Pill tone="neutral">Simulated viewers</Pill><Pill tone="neutral">5 seeds</Pill><Pill tone="success">Rule fixed before runs</Pill></div>
        <Link to="/watch" className="btn-primary"><MonitorPlay className="h-4 w-4" />Watch a session</Link>
      </PageHeader>
      <section className="card overflow-hidden">
        <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          <div className="bg-brand px-5 py-5 text-white">
            <div className="text-[12px] font-semibold uppercase tracking-wider text-[#93c5fd]">Start here</div>
            <h2 className="mt-1 text-[18px] font-semibold tracking-tight">Chase the next click, or plan the whole session?</h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-white/75">A recommender shows a few videos at a time. A click-chaser picks what is most likely to be clicked now. SlateQ also thinks about how long the viewer will stay. This site lets you watch both on the same simulated viewers and check the results.</p>
            <button className="btn-primary mt-4 border-white/20 bg-white text-brand hover:bg-white/90" onClick={() => tour.start(0)}><Compass className="h-4 w-4" />Take the guided tour ({TOUR.length} steps)</button>
          </div>
          <ol className="divide-y divide-line">
            {[["/watch", "Watch one viewer", "See each step: what was shown, what was watched, how the time budget changes."],
              ["/race", "Race all four", "The same viewer under every recommender, side by side."],
              ["/findings/rq1", "Read the findings", "The averages over every test viewer, with what each result does and does not show."],
              ["/guide", "Check the limits", "What is simulated and what the numbers cannot tell you."]].map(([to, t, d], i) => (
              <li key={to}><Link to={to} className="group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-hover-row">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent-soft text-[12.5px] font-semibold text-primary ring-1 ring-accent-line">{i + 1}</span>
                <span className="min-w-0 flex-1"><span className="block text-[13.5px] font-medium text-ink">{t}</span><span className="meta">{d}</span></span>
                <ArrowRight className="h-4 w-4 text-faint transition group-hover:translate-x-0.5 group-hover:text-ink" />
              </Link></li>))}
          </ol>
        </div>
      </section>
      <StatStrip items={[
        { label: `RQ1: SlateQ − learned myopic, N = ${CELL[0]}, k = ${CELL[1]}`, value: sgn(g.mean_diff), tone: "accent", sub: `${pct(g.relative_to_b)} watch time per session` },
        { label: "RQ2: settings where SlateQ is clearly higher", sub: <Term id="clear">what "clearly" means</Term>, value: `${grid.filter((r) => r.verdict === "A higher").length} of ${grid.length}`, hint: "Excludes the k = N control" },
        { label: "SlateQ − oracle myopic, N = 80, k = 3", value: sgn(g80.mean_diff), sub: <Term id="oracle">vs the perfect click-chaser</Term> },
        { label: "RQ3: gap under the most different viewers", value: sgn(sev.mean_diff), sub: sev.verdict === "A higher" ? "clear" : "no clear difference" },
        { label: "Test viewers per run", value: int(S.frozen.eval_episodes), unit: "x 5 seeds" },
      ]} />
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="SlateQ advantage by number of candidates" subtitle="Watch time per session, SlateQ minus each click-chaser"
          actions={<Tabs ariaLabel="Videos shown" active={k} onChange={setK} items={["2", "3", "5"].map((x) => ({ key: x, label: `k = ${x}` }))} />}
          footer={<Legend items={[{ label: "vs learned myopic", color: COLOR.slateq }, { label: "vs oracle myopic", color: COLOR.learned_myopic }]} />}>
          <Bars height={230} groups={ns.map((n) => { const a = gap(S, "rq2", PRIMARY, n, Number(k))!, b = gap(S, "rq2", VS_ORACLE, n, Number(k))!;
            return { label: `N = ${n}`, sub: a.control ? "control" : undefined, bars: [{ name: "vs learned", value: a.mean_diff, lo: a.ci95_low, hi: a.ci95_high, color: COLOR.slateq }, { name: "vs oracle", value: b.mean_diff, lo: b.ci95_low, hi: b.ci95_high, color: COLOR.learned_myopic }] }; })} />
        </ChartCard>
        <ChartCard title="How far to look ahead" subtitle="SlateQ at each planning horizon γ minus the perfect click-chaser (exploratory, E2)"
          footer={<Legend items={[{ label: "N = 80, k = 3", color: COLOR.slateq }, { label: "N = 10, k = 3", color: COLOR.learned_myopic }]} />}>
          <LineChart xs={GAM.map((x) => `γ ${x}`)} height={230} series={[80, 10].map((n) => ({ name: `N = ${n}`, color: n === 80 ? COLOR.slateq : COLOR.learned_myopic, pts: GAM.map((x) => { const r = e2(x, n); return r ? { y: r.mean_diff, lo: r.ci95_low, hi: r.ci95_high } : null; }) }))} />
        </ChartCard>
        <ChartCard title="When viewers behave differently" subtitle={`SlateQ − learned myopic at N = ${CELL[0]}, k = ${CELL[1]} (RQ3)`}>
          <GapBars rows={RUNGS.map((c, i) => { const r = gap(S, "rq3", PRIMARY, CELL[0], CELL[1], c)!; return { label: RUNG[c], mean: r.mean_diff, lo: r.ci95_low, hi: r.ci95_high, color: i < 3 ? COLOR.slateq : COLOR.random }; })} />
        </ChartCard>
        <ChartCard title="Watch time per session" subtitle={`Average per test viewer at N = ${CELL[0]}, k = ${CELL[1]}`}
          footer={<Legend items={AGENTS.map((a) => ({ label: NAME[a], color: COLOR[a] }))} />}>
          <Bars height={230} signed={false} digits={1} groups={AGENTS.map((a) => ({ label: NAME[a], bars: [{ name: NAME[a], value: agentRow(S, "rq2", a, ...CELL)?.mean_total_reward, color: COLOR[a] }] }))} />
        </ChartCard>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[["/watch", "Watch side by side", "One recorded viewer, two recommenders, step by step."], ["/race", "Watch-time race", "The same viewer under all four recommenders."], ["/findings", "Findings", "Every question and follow-up, with charts and limits."]].map(([to, t, d]) => (
          <Link key={to} to={to} className="card group flex items-center gap-3 px-4 py-3.5 transition-colors hover:border-line-hover">
            <div className="min-w-0 flex-1"><div className="card-title">{t}</div><div className="meta">{d}</div></div>
            <ArrowRight className="h-4 w-4 text-faint transition group-hover:translate-x-0.5 group-hover:text-ink" />
          </Link>))}
      </div>
    </div>
  );
}
