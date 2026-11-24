// Watch side by side: one recorded viewer, two recommenders, step by step.
import { useState } from "react";
import { AGENTS, CELL, NAME, PRIMARY, ROLE, COLOR, fmt, gap, sgn, pct, int, topicName, useSite, useTraces, type Agent, type Session, type Site } from "@/lib/data";
import { useReplay } from "@/lib/replay";
import { ErrorState, Loading, Notice, PageHeader } from "@/components/common";
import { BudgetMeter, Cover, History, PlayerBar, VideoTile, ViewerPicker } from "@/components/Replay";
import { VerdictPill } from "@/components/Pill";

export default function Watch() {
  const site = useSite();
  const r = useReplay();
  const tr = useTraces(r.seed);
  const [a, setA] = useState<Agent>("slateq");
  const [b, setB] = useState<Agent>("learned_myopic");
  if (site.error || tr.error) return <ErrorState error={site.error ?? tr.error} />;
  if (!site.data || !tr.data) return <Loading />;
  const S = site.data;
  const A = tr.data[a][r.ep], B = tr.data[b][r.ep];
  const max = Math.max(A.len, B.len);
  const bmax = Math.max(...AGENTS.map((x) => Math.ceil(tr.data![x][r.ep].budget[0] / 10) * 10));
  const g = gap(S, "rq2", PRIMARY, ...CELL)!;
  return (
    <div className="page">
      <PageHeader title="Watch side by side"
        subtitle={<>The same recorded viewer served by two recommenders. Each step shows the {CELL[1]} videos put on screen out of {CELL[0]} candidates, which one was watched and the viewer's time budget. Over all {int(S.frozen.eval_episodes)} test viewers, SlateQ adds {sgn(g.mean_diff)} watch time per session over the learned click-chaser ({pct(g.relative_to_b)}); single viewers vary.</>}>
        <ViewerPicker seeds={S.trace_seeds} caseSeed={S.case_study_seed} />
      </PageHeader>
      <div className="grid gap-4 lg:grid-cols-2">
        <Pane agent={a} onAgent={setA} e={A} max={max} bmax={bmax} />
        <Pane agent={b} onAgent={setB} e={B} max={max} bmax={bmax} />
      </div>
      {r.t >= max && <Outcome site={S} a={a} b={b} A={A} B={B} />}
      <PlayerBar max={max} />
    </div>
  );
}

function Pane({ agent, onAgent, e, max, bmax }: { agent: Agent; onAgent: (a: Agent) => void; e: Session; max: number; bmax: number }) {
  const r = useReplay();
  const ended = r.t >= e.len, i = Math.min(r.t, e.len - 1);
  const c = e.clicked[i];
  const cum = ended ? e.total : e.cum[i], clicks = ended ? e.clicks : e.clk[i], steps = ended ? e.len : i + 1;
  return (
    <section className="card flex min-w-0 flex-col">
      <div className="card-head">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: COLOR[agent] }} />
        <select className="input input-sm w-auto pr-8 font-medium" aria-label="Recommender" value={agent} onChange={(ev) => onAgent(ev.target.value as Agent)}>
          {AGENTS.map((x) => <option key={x} value={x}>{NAME[x]}</option>)}
        </select>
        <span className="meta min-w-0 flex-1 truncate">{ROLE[agent]}</span>
      </div>
      <div className="card-body flex flex-col gap-3">
        <div className="relative aspect-[21/9] overflow-hidden rounded-lg border border-line bg-brand">
          {ended ? (
            <div className="grid h-full place-items-center px-4 text-center">
              <div><div className="text-[12px] font-medium uppercase tracking-wider text-white/50">Session over</div>
                <div className="mt-1 text-[18px] font-semibold text-white">Viewer left after {e.len} steps</div>
                <div className="mt-0.5 text-[13px] text-white/70">Total watch time <span className="font-semibold text-gold">{fmt(e.total)}</span> · {e.clicks} videos watched</div></div>
            </div>
          ) : (
            <>
              <div className={c >= 0 ? "" : "opacity-40 grayscale"} style={{ height: "100%" }}><Cover topic={e.clusters[i][c >= 0 ? c : 0]} variant={i * 3 + Math.max(c, 0)} /></div>
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-brand/90 via-brand/30 to-transparent p-3.5">
                {c >= 0 ? <>
                  <span className="self-start rounded-md bg-gold px-1.5 py-0.5 text-[11px] font-semibold text-on-gold">Watching</span>
                  <div className="mt-1.5 text-[16px] font-semibold text-white">{topicName(e.clusters[i][c])}</div>
                  <div className="text-[12.5px] text-white/75">Quality {fmt(e.quality[i][c])} · taste for this topic {fmt(e.interests[i][e.clusters[i][c]])}</div>
                </> : <>
                  <span className="self-start rounded-md bg-white/15 px-1.5 py-0.5 text-[11px] font-semibold text-white">Scrolled past</span>
                  <div className="mt-1.5 text-[16px] font-semibold text-white">Nothing watched this step</div>
                  <div className="text-[12.5px] text-white/75">Skipping all {e.clusters[i].length} videos still uses time budget.</div>
                </>}
              </div>
              {c >= 0 && <span className="absolute right-3 top-3 rounded-md bg-surface px-2 py-0.5 text-[13px] font-semibold tabular-nums text-success shadow-card">+{fmt(e.reward[i])}</span>}
              {c >= 0 && <div className="absolute inset-x-0 bottom-0 h-1 bg-white/15"><div key={`${r.t}-${r.playing}`} className={r.playing ? "step-fill h-full bg-gold" : "h-full w-full bg-gold"} style={{ ["--step-ms" as string]: `${r.stepMs * 0.9}ms` }} /></div>}
            </>
          )}
        </div>
        <div>
          <div className="mb-1.5 flex justify-between text-[12px] text-faint"><span>On screen now</span><span>{ended ? "" : `Step ${i + 1}`}</span></div>
          {ended ? <div className="grid h-[7.5rem] place-items-center rounded-lg border border-dashed border-line-strong text-[13px] text-faint">The viewer has left</div> : (
            <div className="grid grid-cols-3 gap-2" key={`${i}`}>
              {e.clusters[i].map((topic, j) => <VideoTile key={j} topic={topic} variant={i * 3 + j} quality={e.quality[i][j]} taste={e.interests[i][topic]} watched={c === j} skipped={c >= 0 && c !== j || c < 0} />)}
            </div>)}
        </div>
        <div className="card flex overflow-hidden shadow-none">
          {[["Watch time", fmt(cum)], ["Videos watched", String(clicks)], ["Steps", String(steps)]].map(([k, v], n) => (
            <div key={k} className={`min-w-0 flex-1 px-3 py-2.5 ${n ? "border-l border-line" : ""}`}>
              <div className="text-[12px] text-faint">{k}</div>
              <div className={`mt-1 text-[20px] font-medium tabular-nums tracking-tight ${n === 0 ? "text-bronze" : "text-ink"}`}>{v}</div>
            </div>))}
        </div>
        <BudgetMeter value={ended ? 0 : e.budget[i]} max={bmax} />
        <History e={e} t={r.t} max={max} onSeek={(t) => { r.pause(); r.setT(t); }} />
      </div>
    </section>
  );
}

function Outcome({ site, a, b, A, B }: { site: Site; a: Agent; b: Agent; A: Session; B: Session }) {
  if (a === b) return <Notice>Pick two different recommenders to compare.</Notice>;
  const d = A.total - B.total;
  const win = d >= 0 ? a : b, lose = d >= 0 ? b : a;
  const label = (x: Agent) => ({ slateq: "SlateQ", learned_myopic: "learned-myopic", oracle_myopic: "oracle-myopic", random: "random" }[x]);
  let avg = site.rq2.gaps.find((r) => r.condition === "matched" && r.num_candidates === CELL[0] && r.slate_size === CELL[1] && r.comparison === `${label(a)} - ${label(b)}`);
  let flip = false;
  if (!avg) { avg = site.rq2.gaps.find((r) => r.condition === "matched" && r.num_candidates === CELL[0] && r.slate_size === CELL[1] && r.comparison === `${label(b)} - ${label(a)}`); flip = !!avg; }
  return (
    <div className="card flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5">
      <div className="min-w-0 flex-1 basis-80">
        <div className="text-[14px] text-ink">{Math.abs(d) < 1e-9 ? <>Tie: both gave this viewer <b>{fmt(A.total)}</b> watch time.</>
          : <><b>{NAME[win]}</b> kept this viewer watching <b className="text-bronze">{fmt(Math.abs(d))}</b> longer than {NAME[lose]} ({fmt(Math.max(A.total, B.total))} vs {fmt(Math.min(A.total, B.total))}).</>}</div>
        <div className="meta mt-0.5">{avg ? <>Average over all test viewers and 5 seeds: {NAME[a]} − {NAME[b]} = {sgn(flip ? -avg.mean_diff : avg.mean_diff)} per session. One viewer is an example; the averages are the evidence.</> : "One viewer is an example; the averages on the Findings page are the evidence."}</div>
      </div>
      {avg && <VerdictPill v={flip ? (avg.verdict === "A higher" ? "A lower" : avg.verdict === "A lower" ? "A higher" : avg.verdict) : avg.verdict} a={NAME[a]} />}
    </div>
  );
}
