// Small dependency-free charts: blue for the data under study, neutrals for the rest, hairline grid, a hover readout.
import { useEffect, useRef, useState } from "react";
import { sgn } from "@/lib/data";

export const BRAND = "var(--color-data)";
const NoData = () => <div className="grid h-44 place-items-center text-[13px] text-faint">No data</div>;

function useWidth(min = 260) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(600);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ro = new ResizeObserver(() => setW(Math.max(min, Math.round(el.clientWidth))));
    ro.observe(el); return () => ro.disconnect();
  }, [min]);
  return [ref, w] as const;
}

export function ChartCard({ title, subtitle, children, actions, footer }: { title: string; subtitle?: React.ReactNode; children: React.ReactNode; actions?: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <section className="card flex h-full w-full flex-col p-4">
      <div className="mb-3 flex flex-wrap items-start gap-2"><div className="min-w-0 flex-1"><h2 className="card-title">{title}</h2>{subtitle && <div className="meta">{subtitle}</div>}</div>{actions}</div>
      <div className="flex flex-1 flex-col justify-end">{children}</div>
      {footer && <div className="mt-3 border-t border-line pt-3">{footer}</div>}
    </section>
  );
}

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
      {items.map((i) => <span key={i.label} className="flex items-center gap-2 text-[12px] text-muted"><span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: i.color }} />{i.label}</span>)}
    </div>
  );
}

export type GapRow = { label: string; sub?: string; mean: number | null | undefined; lo?: number; hi?: number; color?: string };

/** Horizontal bars from zero with 95% CI whiskers: one row per comparison. */
export function GapBars({ rows, axis, digits = 2 }: { rows: GapRow[]; axis?: string; digits?: number }) {
  const [box, w] = useWidth(280);
  const [hover, setHover] = useState<number | null>(null);
  if (!rows.length) return <NoData />;
  const L = 0, R = 64, rowH = 46, top = 4;
  const H = top + rows.length * rowH + 22;
  const vals = rows.flatMap((r) => [r.mean, r.lo, r.hi, 0]).filter((v): v is number => typeof v === "number");
  let lo = Math.min(...vals), hi = Math.max(...vals);
  const pad = (hi - lo) * 0.06 || 1; if (lo < 0) lo -= pad; hi += pad;
  const X = (v: number) => L + ((v - lo) / (hi - lo)) * (w - L - R);
  return (
    <div ref={box} className="relative">
      <svg viewBox={`0 0 ${w} ${H}`} width="100%" height={H} className="block overflow-visible" role="img"
        aria-label={rows.map((r) => `${r.label} ${sgn(r.mean, digits)}`).join(", ")} onMouseLeave={() => setHover(null)}>
        <line x1={X(0)} x2={X(0)} y1={0} y2={H - 18} stroke="var(--color-line-strong)" strokeDasharray="3 3" />
        {rows.map((r, i) => {
          const y0 = top + i * rowH, y = y0 + 22;
          const c = r.color ?? BRAND;
          const end = typeof r.mean === "number" ? Math.max(X(r.mean), typeof r.hi === "number" ? X(r.hi) : 0) : 0;
          return (
            <g key={r.label + i} onMouseEnter={() => setHover(i)}>
              <rect x={0} y={y0} width={w} height={rowH} fill={hover === i ? "var(--color-hover-row)" : "transparent"} />
              <text x={0} y={y0 + 14} fontSize="12.5" fontWeight={500} fill="var(--color-ink)">{r.label}{r.sub && <tspan fill="var(--color-faint)" fontWeight={400}>{`  ·  ${r.sub}`}</tspan>}</text>
              {typeof r.mean === "number" && <>
                <rect x={X(Math.min(0, r.mean))} y={y} width={Math.max(1.5, Math.abs(X(r.mean) - X(0)))} height={14} rx={3} fill={c} opacity={0.85} />
                {typeof r.lo === "number" && typeof r.hi === "number" && <g stroke="var(--color-ink)" strokeWidth={1.3} opacity={0.7}>
                  <line x1={X(r.lo)} x2={X(r.hi)} y1={y + 7} y2={y + 7} /><line x1={X(r.lo)} x2={X(r.lo)} y1={y + 2} y2={y + 12} /><line x1={X(r.hi)} x2={X(r.hi)} y1={y + 2} y2={y + 12} />
                </g>}
                <text x={end + 6} y={y + 11.5} fontSize="12" fontWeight={600} fill="var(--color-ink)" className="tabular-nums">{sgn(r.mean, digits)}</text>
              </>}
            </g>);
        })}
        <text x={X(0)} y={H - 4} textAnchor="middle" fontSize="11" fill="var(--color-faint)">0</text>
        {axis && <text x={w - R} y={H - 4} textAnchor="end" fontSize="11" fill="var(--color-faint)">{axis}</text>}
      </svg>
      {hover !== null && typeof rows[hover].lo === "number" && (
        <div className="pointer-events-none absolute right-0 top-0 rounded-md border border-line bg-surface px-2 py-1 text-[12px] shadow-card">
          <span className="text-faint">{rows[hover].label}</span> <span className="font-medium tabular-nums">{sgn(rows[hover].mean, digits)}</span>
          <span className="text-faint"> [{sgn(rows[hover].lo, digits)}, {sgn(rows[hover].hi, digits)}]</span>
        </div>)}
    </div>
  );
}

export type BarGroup = { label: string; sub?: string; key?: string; bars: { name: string; value: number | null | undefined; lo?: number; hi?: number; color: string; muted?: boolean }[] };

/** Vertical bars, optionally grouped, with value labels and CI whiskers. */
export function Bars({ groups, height = 220, digits = 1, signed = true, onPick, active }: { groups: BarGroup[]; height?: number; digits?: number; signed?: boolean; onPick?: (k: string) => void; active?: string }) {
  const [box, w] = useWidth(240);
  if (!groups.length) return <NoData />;
  const H = height, padT = 18, padB = 34;
  const vals = groups.flatMap((g) => g.bars.flatMap((b) => [b.value, b.lo, b.hi])).filter((v): v is number => typeof v === "number");
  const lo = Math.min(0, ...vals), hi = Math.max(0, ...vals) * 1.1 || 1;
  const Y = (v: number) => padT + (1 - (v - lo) / (hi - lo)) * (H - padT - padB);
  const gw = w / groups.length;
  const f = (v: number) => (signed ? sgn(v, digits) : v.toFixed(digits));
  return (
    <div ref={box}>
      <svg viewBox={`0 0 ${w} ${H}`} width="100%" height={H} className="block overflow-visible" role="img"
        aria-label={groups.map((g) => `${g.label}: ${g.bars.map((b) => `${b.name} ${typeof b.value === "number" ? f(b.value) : "-"}`).join(", ")}`).join("; ")}>
        {[0.5, 1].map((t) => <line key={t} x1={0} x2={w} y1={Y(lo + (hi - lo) * t)} y2={Y(lo + (hi - lo) * t)} stroke="var(--color-line)" />)}
        <line x1={0} x2={w} y1={Y(0)} y2={Y(0)} stroke="var(--color-line-strong)" />
        {groups.map((g, gi) => {
          const n = g.bars.length, bw = Math.min(52, (gw - 18) / n);
          const x0 = gi * gw + (gw - bw * n) / 2;
          const on = active !== undefined && g.key === active;
          return (
            <g key={g.label + gi} className={onPick ? "cursor-pointer" : ""} onClick={() => onPick && g.key && onPick(g.key)}>
              {on && <rect x={gi * gw + 4} y={2} width={gw - 8} height={H - 4} rx={6} fill="var(--color-accent-soft)" />}
              {g.bars.map((b, bi) => {
                if (typeof b.value !== "number") return null;
                const x = x0 + bi * bw + 3, bwi = bw - 6;
                const top = Math.min(Y(0), Y(b.value)), h = Math.max(1.5, Math.abs(Y(b.value) - Y(0)));
                const labelY = b.value >= 0 ? Math.min(Y(b.value), typeof b.hi === "number" ? Y(b.hi) : 1e9) - 5 : Math.max(Y(b.value), typeof b.lo === "number" ? Y(b.lo) : 0) + 13;
                return (
                  <g key={b.name}>
                    <rect x={x} y={top} width={bwi} height={h} rx={3} fill={b.color} opacity={b.muted ? 0.35 : 0.88}><title>{`${g.label} ${b.name}: ${f(b.value)}`}</title></rect>
                    {typeof b.lo === "number" && typeof b.hi === "number" && <line x1={x + bwi / 2} x2={x + bwi / 2} y1={Y(b.lo)} y2={Y(b.hi)} stroke="var(--color-ink)" strokeWidth={1.2} opacity={0.6} />}
                    <text x={x + bwi / 2} y={labelY} textAnchor="middle" fontSize="11" fill="var(--color-muted)" className="tabular-nums">{f(b.value)}</text>
                  </g>);
              })}
              <text x={gi * gw + gw / 2} y={H - 16} textAnchor="middle" fontSize="12" fill={on ? "var(--color-ink)" : "var(--color-faint)"} fontWeight={on ? 600 : 400}>{g.label}</text>
              {g.sub && <text x={gi * gw + gw / 2} y={H - 3} textAnchor="middle" fontSize="10.5" fill="var(--color-faint)">{g.sub}</text>}
            </g>);
        })}
      </svg>
    </div>
  );
}

export type Series = { name: string; color: string; pts: ({ y: number; lo?: number; hi?: number } | null)[] };

/** Lines over a categorical axis, with CI whiskers, gridlines and a hover readout. */
export function LineChart({ xs, series, height = 240 }: { xs: string[]; series: Series[]; height?: number }) {
  const [box, w] = useWidth(260);
  const [hover, setHover] = useState<number | null>(null);
  if (!xs.length) return <NoData />;
  const W = w, H = height, padL = 44, padR = 10, padT = 10, padB = 24;
  const vals = series.flatMap((s) => s.pts.flatMap((p) => (p ? [p.y, p.lo, p.hi] : []))).filter((v): v is number => typeof v === "number");
  let lo = Math.min(0, ...vals), hi = Math.max(0, ...vals); const span = hi - lo || 1; lo -= span * 0.06; hi += span * 0.08;
  const x = (i: number) => padL + (xs.length === 1 ? (W - padL - padR) / 2 : (i / (xs.length - 1)) * (W - padL - padR));
  const y = (v: number) => padT + (1 - (v - lo) / (hi - lo)) * (H - padT - padB);
  const ticks = [0, 0.5, 1].map((t) => lo + (hi - lo) * t);
  return (
    <div className="relative" ref={box}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} className="block overflow-visible" role="img"
        aria-label={series.map((s) => `${s.name}: ${s.pts.map((p, i) => `${xs[i]} ${p ? sgn(p.y) : "-"}`).join(", ")}`).join("; ")}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => { const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect(); const px = ((e.clientX - r.left) / r.width) * W; let best = 0; xs.forEach((_, i) => { if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i; }); setHover(best); }}>
        {ticks.map((t) => <g key={t}><line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke="var(--color-line)" /><text x={padL - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--color-faint)">{t.toFixed(Math.abs(hi - lo) < 6 ? 1 : 0)}</text></g>)}
        <line x1={padL} x2={W - padR} y1={y(0)} y2={y(0)} stroke="var(--color-line-strong)" strokeDasharray="3 3" />
        {xs.map((l, i) => <text key={l} x={x(i)} y={H - 6} textAnchor="middle" fontSize="11" fill="var(--color-faint)">{l}</text>)}
        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={padT} y2={H - padB} stroke="var(--color-line-strong)" />}
        {series.map((s) => {
          const pts = s.pts.map((p, i) => (p ? { ...p, i } : null)).filter((p): p is { y: number; lo?: number; hi?: number; i: number } => !!p);
          return (
            <g key={s.name}>
              <path d={pts.map((p, k) => `${k ? "L" : "M"}${x(p.i).toFixed(1)},${y(p.y).toFixed(1)}`).join(" ")} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              {pts.map((p) => <g key={p.i}>
                {typeof p.lo === "number" && typeof p.hi === "number" && <line x1={x(p.i)} x2={x(p.i)} y1={y(p.lo)} y2={y(p.hi)} stroke={s.color} strokeWidth={1.2} opacity={0.55} />}
                <circle cx={x(p.i)} cy={y(p.y)} r={hover === p.i ? 4.5 : 3.5} fill={s.color} stroke="white" strokeWidth={1.5} />
              </g>)}
            </g>);
        })}
      </svg>
      {hover !== null && (
        <div className="pointer-events-none absolute right-0 top-0 rounded-md border border-line bg-surface px-2 py-1 text-[12px] shadow-card">
          <span className="text-faint">{xs[hover]}</span>
          {series.map((s) => <span key={s.name} className="ml-2 font-medium tabular-nums" style={{ color: s.color }}>{s.pts[hover] ? sgn(s.pts[hover]!.y) : "-"}</span>)}
        </div>)}
    </div>
  );
}
