// Replay pieces: viewer picker, player bar, video tile, time-budget meter and session history strip.
import { useEffect } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react";
import { useReplay, PER_SEED } from "@/lib/replay";
import { fmt, topicName, type Session } from "@/lib/data";

/* ------------------------------------------------------------------ viewer picker */
export function ViewerPicker({ seeds, caseSeed }: { seeds: number[]; caseSeed: number }) {
  const { viewer, setViewer } = useReplay();
  const count = seeds.length * PER_SEED;
  return (
    <div className="flex w-full items-center gap-1.5 sm:w-auto">
      <button className="btn w-9 px-0" aria-label="Previous viewer" disabled={viewer <= 1} onClick={() => setViewer(viewer - 1)}><ChevronLeft className="h-4 w-4" /></button>
      <select className="input min-w-0 flex-1 pr-8 sm:w-auto sm:min-w-[15rem] sm:flex-none" aria-label="Recorded viewer" value={viewer} onChange={(e) => setViewer(Number(e.target.value))}>
        {seeds.map((s, si) => (
          <optgroup key={s} label={`Run seed ${s}`}>
            {Array.from({ length: PER_SEED }, (_, e) => {
              const v = si * PER_SEED + e + 1;
              return <option key={v} value={v}>Viewer {v}: seed {s}, test viewer {e + 1}{s === caseSeed && e === 0 ? " (case study)" : ""}</option>;
            })}
          </optgroup>))}
      </select>
      <button className="btn w-9 px-0" aria-label="Next viewer" disabled={viewer >= count} onClick={() => setViewer(viewer + 1)}><ChevronRight className="h-4 w-4" /></button>
    </div>
  );
}

/* ------------------------------------------------------------------ player bar (sticky at the bottom of the page) */
export function PlayerBar({ max }: { max: number }) {
  const r = useReplay();
  useEffect(() => { r.setMax(max); }, [max]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? "").toUpperCase();
      if (["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(tag) && e.key === " ") return;
      if (["SELECT", "TEXTAREA"].includes(tag)) return;
      if (e.key === " ") { e.preventDefault(); r.playing ? r.pause() : r.play(); }
      if (e.key === "ArrowRight") { r.pause(); r.setT(r.t + 1); }
      if (e.key === "ArrowLeft") { r.pause(); r.setT(r.t - 1); }
    };
    window.addEventListener("keydown", on); return () => window.removeEventListener("keydown", on);
  }, [r]);
  const done = r.t >= max;
  return (
    <div className="sticky bottom-3 z-20 mt-1">
      <div className="card flex flex-wrap items-center gap-2 px-3 py-2.5 shadow-pop sm:flex-nowrap" role="group" aria-label="Playback">
        <button className="btn-icon hidden sm:inline-grid" aria-label="Restart" title="Restart" onClick={() => { r.pause(); r.setT(0); }}><RotateCcw className="h-4 w-4" /></button>
        <button className="btn-icon" aria-label="Step back" title="Step back (←)" onClick={() => { r.pause(); r.setT(r.t - 1); }}><SkipBack className="h-4 w-4" /></button>
        <button className="btn-primary w-24" onClick={() => (r.playing ? r.pause() : r.play())} aria-label={r.playing ? "Pause" : "Play"}>
          {r.playing ? <><Pause className="h-4 w-4" />Pause</> : <><Play className="h-4 w-4" />{done ? "Replay" : "Play"}</>}
        </button>
        <button className="btn-icon" aria-label="Step forward" title="Step forward (→)" onClick={() => { r.pause(); r.setT(r.t + 1); }}><SkipForward className="h-4 w-4" /></button>
        <input type="range" min={0} max={max} value={Math.min(r.t, max)} onChange={(e) => { r.pause(); r.setT(Number(e.target.value)); }} aria-label="Step" className="order-last h-1.5 w-full min-w-0 flex-1 sm:order-none" />
        <span className="count w-24 shrink-0 text-right">{done ? "Session over" : `Step ${r.t + 1} of ${max}`}</span>
        <select className="input input-sm w-[4.5rem] shrink-0" aria-label="Speed" value={r.speed} onChange={(e) => r.setSpeed(Number(e.target.value))}>
          {[0.5, 1, 2, 4, 8].map((s) => <option key={s} value={s}>{s}×</option>)}
        </select>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ video tile (generated cover: topics are only numbers) */
const SHADES = ["#dbeafe", "#e0e7ff", "#cffafe", "#e2e8f0", "#ede9fe", "#d1fae5", "#fce7f3", "#fef3c7", "#dbeafe", "#e0f2fe",
  "#f1f5f9", "#c7d2fe", "#bae6fd", "#ccfbf1", "#e9d5ff", "#fde2e4", "#dcfce7", "#e5e7eb", "#d6e4ff", "#fae8ff"];
const light = (hex: string) => { const n = parseInt(hex.slice(1), 16); return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 > 150; };
function rng(seed: number) { let s = (seed * 2654435761) >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

export function Cover({ topic, variant, className = "" }: { topic: number; variant: number; className?: string }) {
  const bg = SHADES[topic % SHADES.length];
  const ink = light(bg) ? "#1e293b" : "#ffffff";
  const r = rng(topic * 997 + variant * 31 + 7);
  const kind = topic % 5;
  const shapes: React.ReactNode[] = [];
  if (kind === 0) for (let i = 0; i < 4; i++) shapes.push(<circle key={i} cx={r() * 160} cy={r() * 90} r={10 + r() * 30} fill={ink} fillOpacity={0.06 + r() * 0.08} />);
  if (kind === 1) for (let i = -2; i < 10; i++) shapes.push(<rect key={i} x={i * 22 + r() * 6} y={-20} width={5 + r() * 5} height={140} fill={ink} fillOpacity={0.05 + r() * 0.07} transform="rotate(25 80 45)" />);
  if (kind === 2) { let p = "0,90"; for (let x = 0; x <= 160; x += 20 + r() * 20) p += ` ${x.toFixed(0)},${(35 + r() * 45).toFixed(0)}`; shapes.push(<polygon key="m" points={`${p} 160,90`} fill={ink} fillOpacity={0.12} />); }
  if (kind === 3) for (let j = 0; j < 4; j++) { const y = 20 + j * 18 + r() * 6, a = 4 + r() * 7; shapes.push(<path key={j} d={`M0 ${y} Q 20 ${y - a} 40 ${y} T 80 ${y} T 120 ${y} T 160 ${y}`} stroke={ink} strokeOpacity={0.14 + r() * 0.12} strokeWidth={1.5 + r() * 2} fill="none" />); }
  if (kind === 4) for (let x = 8; x < 160; x += 14) for (let y = 8; y < 90; y += 14) if (r() > 0.35) shapes.push(<circle key={`${x}-${y}`} cx={x} cy={y} r={1 + r() * 2} fill={ink} fillOpacity={0.22} />);
  return (
    <svg viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice" className={`block h-full w-full ${className}`} style={{ background: bg }} aria-hidden>
      {shapes}
      <text x={150} y={80} textAnchor="end" fontSize={28} fontWeight={700} fill={ink} fillOpacity={0.28} fontFamily="Inter, system-ui, sans-serif">{String(topic + 1).padStart(2, "0")}</text>
    </svg>
  );
}

export function VideoTile({ topic, variant, quality, taste, watched, skipped }: { topic: number; variant: number; quality: number; taste: number; watched: boolean; skipped: boolean }) {
  return (
    <div className={`rise overflow-hidden rounded-lg border bg-surface transition ${watched ? "border-primary-line ring-2 ring-primary" : "border-line"} ${skipped ? "opacity-60" : ""}`}>
      <div className="relative aspect-video">
        <Cover topic={topic} variant={variant} />
        {watched && <span className="absolute left-1.5 top-1.5 rounded-md bg-primary px-1.5 py-0.5 text-[10.5px] font-semibold text-on-primary">Watched</span>}
      </div>
      <div className="px-2 py-1.5">
        <div className="truncate text-[12.5px] font-medium text-ink">{topicName(topic)}</div>
        <div className="mt-0.5 flex items-center justify-between gap-1 text-[11.5px] tabular-nums">
          <span className={quality >= 0 ? "text-success" : "text-danger"} title="Hidden quality: watching good videos gives time budget back, poor ones cost extra."><span className="hidden sm:inline">Quality </span>{fmt(quality)}</span>
          <span className="hidden text-faint sm:inline" title="The viewer's current taste for this topic (−1 to 1)">Taste {fmt(taste)}</span>
        </div>
        <TasteBar v={taste} />
      </div>
    </div>
  );
}

export function TasteBar({ v }: { v: number }) {
  const w = Math.min(50, Math.abs(v) * 50);
  return (
    <div className="relative mt-1 h-1 overflow-hidden rounded-full bg-track">
      <span className="absolute inset-y-0 left-1/2 w-px bg-line-strong" />
      <span className="absolute inset-y-0" style={v >= 0 ? { left: "50%", width: `${w}%`, background: "var(--color-data)" } : { right: "50%", width: `${w}%`, background: "var(--color-line-hover)" }} />
    </div>
  );
}

/* ------------------------------------------------------------------ time budget meter */
export function BudgetMeter({ value, max }: { value: number; max: number }) {
  const f = Math.max(0, Math.min(1, value / max));
  return (
    <div>
      <div className="mb-1 flex justify-between text-[12px] text-faint"><span>Time budget left</span><span className="tabular-nums text-muted">{fmt(Math.max(0, value), 1)}</span></div>
      <div className="h-2 overflow-hidden rounded-full bg-track"><div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${f * 100}%`, background: f > 0.25 ? "var(--color-data)" : "var(--color-danger-fill)" }} /></div>
    </div>
  );
}

/* ------------------------------------------------------------------ session history strip */
export function History({ e, t, max, onSeek }: { e: Session; t: number; max: number; onSeek: (t: number) => void }) {
  const peak = Math.max(...e.reward, 1e-9);
  return (
    <div>
      <div className="relative flex h-11 cursor-pointer items-end gap-px rounded-lg border border-line bg-surface-alt p-1"
        title="Session history: tall bars are steps with a watched video (green = good quality, red = poor quality). Click to jump."
        onClick={(ev) => { const b = ev.currentTarget.getBoundingClientRect(); onSeek(Math.round(((ev.clientX - b.left) / b.width) * max)); }}>
        {Array.from({ length: max }, (_, i) => {
          if (i >= e.len) return <span key={i} className="flex-1" />;
          const c = e.clicked[i];
          const h = c >= 0 ? 25 + 75 * (e.reward[i] / peak) : 12;
          const col = c >= 0 ? (e.quality[i][c] >= 0 ? "var(--color-success-fill)" : "var(--color-danger-fill)") : "var(--color-line-strong)";
          return <span key={i} className="min-w-px flex-1 rounded-[1px] transition-opacity" style={{ height: `${h}%`, background: col, opacity: i <= t ? 0.9 : 0.25 }} />;
        })}
        <span className="pointer-events-none absolute inset-y-0 w-0.5 bg-ink transition-[left] duration-200" style={{ left: `calc(4px + ${(Math.min(t, max) / max) * 100}% - ${(Math.min(t, max) / max) * 8}px)` }} />
      </div>
      <div className="mt-1 flex justify-between text-[11.5px] text-faint"><span>Session history</span><span>{e.len} steps</span></div>
    </div>
  );
}
