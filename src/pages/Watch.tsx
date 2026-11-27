// Watch side by side: one recorded viewer, two recommenders, step by step.
import { useState } from "react";
import { AGENTS, CELL, NAME, PRIMARY, ROLE, COLOR, fmt, gap, sgn, int, topicName, useSite, useTraces, type Agent, type Session, type Site } from "@/lib/data";
import { useReplay } from "@/lib/replay";
import { ErrorState, Loading, Notice, PageHeader } from "@/components/common";
import { BudgetMeter, Cover, History, PlayerBar, VideoTile, ViewerPicker } from "@/components/Replay";
import { VerdictPill } from "@/components/Pill";
import { Hint, Term } from "@/components/Help";
import { NextStep, StepLabel } from "@/components/Path";
import { BookOpenText } from "lucide-react";

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
      <div>
        <StepLabel to="/watch" />
        <PageHeader title="Watch a session"
          subtitle={<>One recorded viewer, served by two recommenders. Over all {int(S.frozen.eval_episodes)} test viewers SlateQ gets {sgn(g.mean_diff)} more watch time per session; single viewers vary.</>}>
          <ViewerPicker seeds={S.trace_seeds} caseSeed={S.case_study_seed} />
        </PageHeader>
      </div>
      <Hint>Press <b className="font-medium">Play</b>. Each step shows the <Term id="slate">slate</Term>; the outlined video is the one watched. Green <Term id="quality">quality</Term> gives time back, red costs extra, and the session ends when the <Term id="budget">time budget</Term> runs out.</Hint>
      <div className="grid gap-4 lg:grid-cols-2">
        <Pane agent={a} onAgent={setA} e={A} max={max} bmax={bmax} />
        <Pane agent={b} onAgent={setB} e={B} max={max} bmax={bmax} />
      </div>
      <Story a={a} b={b} A={A} B={B} />
      {r.t >= max && <Outcome site={S} a={a} b={b} A={A} B={B} />}
      <PlayerBar max={max} />
      <NextStep to="/watch" />
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
                <div className="mt-0.5 text-[13px] text-white/70">Total watch time <span className="font-semibold text-primary">{fmt(e.total)}</span> · {e.clicks} videos watched</div></div>
            </div>
          ) : (
            <>
              <div className={c >= 0 ? "" : "opacity-40 grayscale"} style={{ height: "100%" }}><Cover topic={e.clusters[i][c >= 0 ? c : 0]} variant={i * 3 + Math.max(c, 0)} /></div>
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-brand/90 via-brand/30 to-transparent p-3.5">
                {c >= 0 ? <>
                  <span className="self-start rounded-md bg-primary px-1.5 py-0.5 text-[11px] font-semibold text-on-primary">Watching</span>
                  <div className="mt-1.5 text-[16px] font-semibold text-white">{topicName(e.clusters[i][c])}</div>
                  <div className="text-[12.5px] text-white/75">Quality {fmt(e.quality[i][c])} · taste for this topic {fmt(e.interests[i][e.clusters[i][c]])}</div>
                </> : <>
                  <span className="self-start rounded-md bg-white/15 px-1.5 py-0.5 text-[11px] font-semibold text-white">Scrolled past</span>
                  <div className="mt-1.5 text-[16px] font-semibold text-white">Nothing watched this step</div>
                  <div className="text-[12.5px] text-white/75">Skipping all {e.clusters[i].length} videos still uses time budget.</div>
                </>}
              </div>
              {c >= 0 && <span className="absolute right-3 top-3 rounded-md bg-surface px-2 py-0.5 text-[13px] font-semibold tabular-nums text-success shadow-card">+{fmt(e.reward[i])}</span>}
              {c >= 0 && <div className="absolute inset-x-0 bottom-0 h-1 bg-white/15"><div key={`${r.t}-${r.playing}`} className={r.playing ? "step-fill h-full bg-primary" : "h-full w-full bg-primary"} style={{ ["--step-ms" as string]: `${r.stepMs * 0.9}ms` }} /></div>}
            </>
          )}
        </div>
        <div>
          <div className="mb-1.5 flex justify-between text-[12px] text-faint"><span>On screen now: the <Term id="slate">slate</Term></span><span>{ended ? "" : `Step ${i + 1}`}</span></div>
          {ended ? <div className="grid h-[7.5rem] place-items-center rounded-lg border border-dashed border-line-strong text-[13px] text-faint">The viewer has left</div> : (
            <div className="grid grid-cols-3 gap-2" key={`${i}`}>
              {e.clusters[i].map((topic, j) => <VideoTile key={j} topic={topic} variant={i * 3 + j} quality={e.quality[i][j]} taste={e.interests[i][topic]} watched={c === j} skipped={c >= 0 && c !== j || c < 0} />)}
            </div>)}
        </div>
        <div className="card flex overflow-hidden shadow-none">
          {([[<Term id="watch">Watch time</Term>, fmt(cum)], ["Videos watched", String(clicks)], ["Steps", String(steps)]] as [React.ReactNode, string][]).map(([k, v], n) => (
            <div key={n} className={`min-w-0 flex-1 px-3 py-2.5 ${n ? "border-l border-line" : ""}`}>
              <div className="text-[12px] text-faint">{k}</div>
              <div className={`mt-1 text-[20px] font-medium tabular-nums tracking-tight ${n === 0 ? "text-data" : "text-ink"}`}>{v}</div>
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
          : <><b>{NAME[win]}</b> kept this viewer watching <b className="text-data">{fmt(Math.abs(d))}</b> longer than {NAME[lose]} ({fmt(Math.max(A.total, B.total))} vs {fmt(Math.min(A.total, B.total))}).</>}</div>
        <div className="meta mt-0.5">{avg ? <>Average over all test viewers: {NAME[a]} − {NAME[b]} = {sgn(flip ? -avg.mean_diff : avg.mean_diff)} per session. One viewer is only an example.</> : "One viewer is an example; the averages on the Findings page are the evidence."}</div>
      </div>
      {avg && <VerdictPill v={flip ? (avg.verdict === "A higher" ? "A lower" : avg.verdict === "A lower" ? "A higher" : avg.verdict) : avg.verdict} a={NAME[a]} />}
    </div>
  );
}

/* ------------------------------------------------------------------ narrator: what just happened, in words */
function describe(name: string, e: Session, t: number): { text: React.ReactNode; tone: "good" | "bad" | "skip" | "end" } {
  const who = <b className="font-medium text-ink">{name}</b>;
  if (t >= e.len) return { tone: "end", text: <>{who}: session over after {e.len} steps, {fmt(e.total)} watch time.</> };
  const c = e.clicked[t];
  if (c < 0) return { tone: "skip", text: <>{who}: the viewer skipped all {e.clusters[t].length} videos. No watch time; a little budget lost.</> };
  const q = e.quality[t][c];
  return { tone: q >= 0 ? "good" : "bad", text: <>{who}: watched {topicName(e.clusters[t][c])}, +{fmt(e.reward[t])} watch time. Quality {fmt(q)}, so it {q >= 0 ? "gave time back" : "used extra time"}.</> };
}
const DOT = { good: "bg-success-fill", bad: "bg-danger-fill", skip: "bg-line-hover", end: "bg-primary" };

function Story({ a, b, A, B }: { a: Agent; b: Agent; A: Session; B: Session }) {
  const r = useReplay();
  const t = r.t;
  const da = describe(NAME[a], A, t), db = describe(NAME[b], B, t);
  const ia = Math.min(t, A.len - 1), ib = Math.min(t, B.len - 1);
  const ca = t >= A.len ? A.total : A.cum[ia], cb = t >= B.len ? B.total : B.cum[ib];
  const lead = Math.abs(ca - cb) < 1e-9 ? "Both have the same watch time so far." : `${ca > cb ? NAME[a] : NAME[b]} is ahead by ${fmt(Math.abs(ca - cb))} watch time so far.`;
  const tip = da.tone === "good" || db.tone === "good" ? "Good-quality videos give time back, so the session lasts longer. That is what planning ahead buys."
    : da.tone === "bad" || db.tone === "bad" ? "A poor video still earns watch time now, but shortens the session. A click-chaser ignores this cost."
    : da.tone === "skip" && db.tone === "skip" ? "Skips happen when nothing shown matches the viewer's taste."
    : "Keep watching: the difference builds up over many steps.";
  return (
    <section className="card" aria-live="polite">
      <div className="card-head"><BookOpenText className="h-4 w-4 text-info" /><h2 className="card-title">What just happened</h2><span className="count">{t >= Math.max(A.len, B.len) ? "session over" : `step ${t + 1}`}</span></div>
      <div className="card-body grid gap-3 lg:grid-cols-2">
        {[da, db].map((d, k) => <p key={k} className="flex gap-2.5 text-[13px] leading-relaxed text-muted"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT[d.tone]}`} /><span className="min-w-0">{d.text}</span></p>)}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line bg-surface-alt px-4 py-2.5 text-[12.5px]">
        <span className="font-medium text-ink">{lead}</span>
        <span className="basis-full text-info">Why it matters: {tip}</span>
      </div>
    </section>
  );
}
