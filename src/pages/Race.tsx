// Watch-time race: the same recorded viewer under all four recommenders.
import { AGENTS, COLOR, NAME, ROLE, fmt, topicName, useSite, useTraces } from "@/lib/data";
import { useReplay } from "@/lib/replay";
import { Card, ErrorState, Loading, Notice, PageHeader } from "@/components/common";
import { PlayerBar, ViewerPicker } from "@/components/Replay";
import { Pill } from "@/components/Pill";
import { HowTo, Steps, Term } from "@/components/Help";

export default function Race() {
  const site = useSite();
  const r = useReplay();
  const tr = useTraces(r.seed);
  if (site.error || tr.error) return <ErrorState error={site.error ?? tr.error} />;
  if (!site.data || !tr.data) return <Loading />;
  const ss = AGENTS.map((a) => ({ a, e: tr.data![a][r.ep] }));
  const max = Math.max(...ss.map((x) => x.e.len));
  const top = Math.max(...ss.map((x) => x.e.total));
  const bmax = Math.max(...ss.map((x) => Math.ceil(x.e.budget[0] / 10) * 10));
  const done = r.t >= max;
  const order = [...ss].sort((p, q) => q.e.total - p.e.total);
  return (
    <div className="page">
      <PageHeader title="Watch-time race" subtitle="Each lane is the same recorded viewer served by a different recommender. The marker moves with every unit of time watched; the thin bar under it is the time budget left. The session ends when the budget runs out.">
        <ViewerPicker seeds={site.data.trace_seeds} caseSeed={site.data.case_study_seed} />
      </PageHeader>
      <HowTo id="race">
        <Steps items={[
          <>Each lane is the <b className="font-medium text-ink">same viewer</b> served by a different recommender.</>,
          <>The dot moves right with every unit of <Term id="watch">watch time</Term>. The thin grey bar is the <Term id="budget">time budget</Term> left.</>,
          <>Press <b className="font-medium text-ink">Play</b>. The line under each lane says what the viewer is doing.</>,
          <>At the end the finishing order appears. Try other viewers with the arrows: the winner changes, the averages do not.</>,
        ]} />
      </HowTo>
      <Card title="Lanes" count={`${AGENTS.length} recommenders`} bodyClass="">
        <ul className="divide-y divide-line">
          {ss.map(({ a, e }) => {
            const ended = r.t >= e.len, i = Math.min(r.t, e.len - 1);
            const cum = ended ? e.total : e.cum[i];
            const x = (cum / top) * 100, bud = ended ? 0 : Math.max(0, e.budget[i]);
            const c = e.clicked[i];
            return (
              <li key={a} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-4 py-3.5 md:grid-cols-[12rem_minmax(0,1fr)_7rem]">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[13.5px] font-medium text-ink"><span className="h-2.5 w-2.5 rounded-full" style={{ background: COLOR[a] }} />{NAME[a]}</div>
                  <div className="meta truncate">{ROLE[a]}</div>
                </div>
                <div className="col-span-2 row-start-2 md:col-span-1 md:row-start-auto">
                  <div className="relative h-6">
                    <div className="absolute inset-x-0 top-2 h-2 rounded-full bg-track" />
                    <div className="absolute left-0 top-2 h-2 rounded-full transition-[width] duration-300" style={{ width: `${x}%`, background: COLOR[a], opacity: 0.85 }} />
                    <div className="absolute top-0.5 h-5 w-5 -translate-x-1/2 rounded-full border-2 border-surface shadow-card transition-[left] duration-300" style={{ left: `${x}%`, background: COLOR[a] }} />
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-track"><div className="h-full bg-line-hover transition-[width] duration-300" style={{ width: `${(bud / bmax) * 100}%` }} /></div>
                  <div className="meta mt-1 truncate">{ended ? `Left after ${e.len} steps · ${e.clicks} videos watched` : c >= 0 ? `Step ${i + 1}: watching ${topicName(e.clusters[i][c])} (quality ${fmt(e.quality[i][c])})` : `Step ${i + 1}: skipped all ${e.clusters[i].length} videos`}</div>
                </div>
                <div className="text-right">
                  <div className="text-[20px] font-medium tabular-nums tracking-tight" style={{ color: a === "random" ? "var(--color-muted)" : COLOR[a] }}>{fmt(cum)}</div>
                  <div className="meta">watch time</div>
                </div>
              </li>);
          })}
        </ul>
      </Card>
      {done && (
        <Card title="Finish" count="this viewer only">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {order.map(({ a, e }, k) => (
              <div key={a} className="rise rounded-lg border border-line bg-surface-alt px-4 py-3" style={{ animationDelay: `${k * 60}ms` }}>
                <div className="flex items-center justify-between"><span className="text-[12px] text-faint">#{k + 1}</span>{k === 0 && <Pill tone="success">Longest session</Pill>}</div>
                <div className="mt-1 text-[13.5px] font-medium text-ink">{NAME[a]}</div>
                <div className="text-[22px] font-medium tabular-nums tracking-tight">{fmt(e.total)}</div>
                <div className="meta">{e.len} steps · {e.clicks} watched</div>
              </div>))}
          </div>
          <Notice className="mt-3">This ranking is for one viewer. Some viewers favour a different recommender; the averages over all test viewers are on the Findings page.</Notice>
        </Card>)}
      <PlayerBar max={max} />
    </div>
  );
}
