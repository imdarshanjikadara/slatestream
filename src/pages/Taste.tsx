// Taste profile: how the viewer's interests in the 20 topics change during the session, per recommender.
import { useEffect, useRef, useState } from "react";
import { AGENTS, COLOR, NAME, fmt, sgn, topicName, useSite, useTraces, type Session } from "@/lib/data";
import { useReplay } from "@/lib/replay";
import { ErrorState, Loading, PageHeader, Tabs } from "@/components/common";
import { PlayerBar, ViewerPicker } from "@/components/Replay";
import { Hint } from "@/components/Help";
import { NextStep, StepLabel } from "@/components/Path";

// Diverging scale: grey-blue (dislike) through near-white to blue (like).
function color(v: number): [number, number, number] {
  const t = Math.max(-1, Math.min(1, v));
  const mid = [249, 250, 251], pos = [29, 78, 216], neg = [148, 113, 70];
  const to = t >= 0 ? pos : neg, a = Math.abs(t);
  return [0, 1, 2].map((k) => mid[k] + (to[k] - mid[k]) * a) as [number, number, number];
}

export default function Taste() {
  const site = useSite();
  const r = useReplay();
  const tr = useTraces(r.seed);
  const [mode, setMode] = useState<"abs" | "delta">("abs");
  if (site.error || tr.error) return <ErrorState error={site.error ?? tr.error} />;
  if (!site.data || !tr.data) return <Loading />;
  const ss = AGENTS.map((a) => ({ a, e: tr.data![a][r.ep] }));
  const max = Math.max(...ss.map((x) => x.e.len));
  let D = 1e-9;
  for (const { e } of ss) for (const row of e.interests) row.forEach((v, k) => { D = Math.max(D, Math.abs(v - e.interests[0][k])); });
  const val = (e: Session, x: number, y: number) => (mode === "abs" ? e.interests[x][y] : (e.interests[x][y] - e.interests[0][y]) / D);
  return (
    <div className="page">
      <div>
        <StepLabel to="/taste" />
        <PageHeader title="Viewer tastes" subtitle="What a viewer watches slowly changes what they like.">
          <ViewerPicker seeds={site.data.trace_seeds} caseSeed={site.data.case_study_seed} />
        </PageHeader>
      </div>
      <Hint>Each picture is one recommender. Rows are the 20 topics, columns are steps. Blue = likes, brown = dislikes; dots mark what was watched. Switch to <b className="font-medium">Change since step 1</b> to see the drift.</Hint>
      <div className="flex flex-wrap items-center gap-3">
        <Tabs ariaLabel="Show" active={mode} onChange={(k) => setMode(k as "abs" | "delta")} items={[{ key: "abs", label: "Taste level" }, { key: "delta", label: "Change since step 1" }]} />
        <div className="flex items-center gap-2 text-[12px] text-faint">
          <span>{mode === "abs" ? "Dislike" : "Likes less"}</span>
          <span className="h-2.5 w-36 rounded-full" style={{ background: `linear-gradient(90deg, rgb(${color(-1)}), rgb(${color(0)}), rgb(${color(1)}))` }} />
          <span>{mode === "abs" ? "Like" : `Likes more (largest change ${fmt(D)})`}</span>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {ss.map(({ a, e }) => <Heat key={a + mode + r.viewer} title={NAME[a]} dot={COLOR[a]} e={e} max={max} t={r.t} val={(x, y) => val(e, x, y)} />)}
      </div>
      <PlayerBar max={max} />
      <NextStep to="/taste" />
    </div>
  );
}

function Heat({ title, dot, e, max, t, val }: { title: string; dot: string; e: Session; max: number; t: number; val: (x: number, y: number) => number }) {
  const cv = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = cv.current; if (!c) return;
    const sc = 6; c.width = max * sc; c.height = 20 * sc;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, c.width, c.height);
    for (let x = 0; x < e.len; x++) for (let y = 0; y < 20; y++) { const [r, g, b] = color(val(x, y)); ctx.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`; ctx.fillRect(x * sc, y * sc, sc, sc); }
    ctx.fillStyle = "#0b1f3f";
    for (let x = 0; x < e.len; x++) { const k = e.clicked[x]; if (k >= 0) { ctx.beginPath(); ctx.arc(x * sc + sc / 2, e.clusters[x][k] * sc + sc / 2, sc * 0.3, 0, 7); ctx.fill(); } }
  }, [e, max, val]);
  const i = Math.min(t, e.len - 1);
  return (
    <section className="card p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: dot }} /><h2 className="card-title">{title}</h2><span className="meta ml-auto">{e.len} steps · total watch {fmt(e.total)}</span></div>
      <div className="relative overflow-hidden rounded-md border border-line">
        <canvas ref={cv} className="block h-40 w-full [image-rendering:pixelated]" />
        <span className="pointer-events-none absolute inset-y-0 w-0.5 bg-ink transition-[left] duration-200" style={{ left: `${(Math.min(t, max) / max) * 100}%` }} />
      </div>
      <div className="mt-3 flex h-6 gap-0.5">
        {e.interests[i].map((v, k) => { const [r, g, b] = color(val(i, k)); return <span key={k} className="flex-1 rounded-[2px] border border-line" style={{ background: `rgb(${r | 0},${g | 0},${b | 0})` }} title={`${topicName(k)}: taste ${fmt(v)}, change ${sgn(v - e.interests[0][k])}`} />; })}
      </div>
      <div className="meta mt-1">Now: topics 01 to 20</div>
    </section>
  );
}
