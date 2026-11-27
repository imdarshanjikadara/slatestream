// Start page: the question in plain words, the four headline numbers, the two key charts, and where to go next.
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { CELL, COLOR, PRIMARY, RUNG, RUNGS, SRC, VS_ORACLE, gap, pct, sgn, useSite } from "@/lib/data";
import { Source } from "@/components/Source";
import { useTour } from "@/lib/tour";
import { Compass } from "lucide-react";
import { ErrorState, Loading, StatStrip, Tabs } from "@/components/common";
import { Bars, ChartCard, GapBars, Legend } from "@/components/Charts";
import { Term } from "@/components/Help";
import { NextStep, PATH, StepLabel } from "@/components/Path";

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
  const ns = [...new Set(S.rq2.gaps.filter((r) => r.slate_size === Number(k)).map((r) => r.num_candidates))].sort((a, b) => a - b);
  return (
    <div className="page">
      <div>
        <StepLabel to="/" />
        <h1 className="page-title">Should a recommender chase the next click, or plan for the whole session?</h1>
        <p className="mt-2 max-w-3xl text-[14px] leading-relaxed text-muted">
          A video app shows a few videos at a time. A <b className="font-medium text-ink">myopic</b> recommender picks what is most likely to be clicked now.
          <b className="font-medium text-ink"> SlateQ</b> (Ie et al., 2019) also plans for how long the viewer stays. I compared them in Google's RecSim simulator,
          on simulated viewers only.
        </p>
        <button className="btn mt-3" onClick={() => tour.start(0)}><Compass className="h-4 w-4" />Open the user guide</button>
      </div>

      <StatStrip items={[
        { label: `RQ1 · SlateQ vs myopic (${CELL[0]} candidates, ${CELL[1]} shown)`, value: sgn(g.mean_diff), tone: "accent", sub: `more watch time per session (${pct(g.relative_to_b)})` },
        { label: "RQ2 · settings where SlateQ wins", value: `${grid.filter((r) => r.verdict === "A higher").length} of ${grid.length}`, sub: <Term id="clear">clear wins</Term> },
        { label: "RQ2 · 80 candidates, vs the best click-chaser", value: sgn(g80.mean_diff), sub: <Term id="oracle">oracle myopic</Term> },
        { label: "RQ3 · viewers who scan top-down", value: sgn(sev.mean_diff), sub: sev.verdict === "A higher" ? "clear win" : "not a clear win" },
      ]} />
      <Source files={[SRC.rq2Gaps, SRC.rq3Gaps]} className="-mt-3" />

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="RQ2 · More candidates, bigger advantage" subtitle="SlateQ's extra watch time per session"
          actions={<Tabs ariaLabel="Videos shown" active={k} onChange={setK} items={["2", "3", "5"].map((x) => ({ key: x, label: `${x} shown` }))} />}
          footer={<Legend items={[{ label: "vs learned myopic", color: COLOR.slateq }, { label: "vs oracle myopic", color: COLOR.learned_myopic }]} />} source={[SRC.rq2Gaps]}>
          <Bars height={230} groups={ns.map((n) => { const a = gap(S, "rq2", PRIMARY, n, Number(k))!, b = gap(S, "rq2", VS_ORACLE, n, Number(k))!;
            return { label: `${n}`, sub: a.control ? "control" : undefined, bars: [{ name: "vs learned", value: a.mean_diff, lo: a.ci95_low, hi: a.ci95_high, color: COLOR.slateq }, { name: "vs oracle", value: b.mean_diff, lo: b.ci95_low, hi: b.ci95_high, color: COLOR.learned_myopic }] }; })} />
          <div className="meta mt-1 text-center">number of candidates</div>
        </ChartCard>
        <ChartCard title="RQ3 · When viewers behave differently" subtitle={`SlateQ's extra watch time, ${CELL[0]} candidates, ${CELL[1]} shown`} source={[SRC.rq3Gaps]}>
          <GapBars rows={RUNGS.map((c, i) => { const r = gap(S, "rq3", PRIMARY, CELL[0], CELL[1], c)!; return { label: RUNG[c], mean: r.mean_diff, lo: r.ci95_low, hi: r.ci95_high, color: i < 3 ? COLOR.slateq : COLOR.random }; })} />
        </ChartCard>
      </div>

      <section className="card p-4">
        <h2 className="card-title">How to use this site</h2>
        <ol className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {PATH.slice(1).map((p, i) => (
            <li key={p.to}><Link to={p.to} className="group flex h-full items-center gap-3 rounded-lg border border-line px-3 py-2.5 transition-colors hover:border-line-hover hover:bg-hover-row">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-[12px] font-semibold text-on-primary">{i + 2}</span>
              <span className="min-w-0 flex-1 text-[13.5px] font-medium text-ink">{p.label}</span>
              <ArrowRight className="h-4 w-4 text-faint transition group-hover:translate-x-0.5 group-hover:text-ink" />
            </Link></li>))}
        </ol>
      </section>
      <NextStep to="/" />
    </div>
  );
}
