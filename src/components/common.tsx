// Page chrome and small shared pieces: page header, tabs, notices, stat strip, cards, loading and empty states.
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";

/** Title row: breadcrumb, title (+ status), subtitle on the left; actions on the right (primary last). */
export function PageHeader({ title, subtitle, children, breadcrumb, status }: {
  title: React.ReactNode; subtitle?: React.ReactNode; children?: React.ReactNode; breadcrumb?: { to: string; label: string }[]; status?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
      <div className="min-w-0 flex-1 basis-72">
        {breadcrumb?.length ? (
          <nav aria-label="Breadcrumb" className="mb-1.5 flex flex-wrap items-center gap-1 text-[12px] text-faint">
            {breadcrumb.map((b, i) => <span key={b.to} className="inline-flex items-center gap-1">{i > 0 && <span aria-hidden>/</span>}
              <Link to={b.to} className="hover:text-ink hover:underline">{i === 0 && <span aria-hidden>&larr; </span>}{b.label}</Link></span>)}
          </nav>) : null}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1"><h1 className="page-title break-words">{title}</h1>{status}</div>
        {subtitle && <p className="mt-1 max-w-3xl text-[13px] text-faint">{subtitle}</p>}
      </div>
      {children && <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export type TabItem = { key: string; label: string; count?: number | null };
export function Tabs({ items, active, onChange, ariaLabel }: { items: TabItem[]; active: string; onChange: (k: string) => void; ariaLabel?: string }) {
  return (
    <div className="seg" role="tablist" aria-label={ariaLabel}>
      {items.map((t) => (
        <button key={t.key} type="button" role="tab" aria-selected={t.key === active} data-active={t.key === active} onClick={() => onChange(t.key)}>
          {t.label}{t.count !== undefined && t.count !== null && <span className="tab-count">{t.count}</span>}
        </button>))}
    </div>
  );
}

export function EmptyState({ title, hint, action, compact }: { title: string; hint?: React.ReactNode; action?: React.ReactNode; compact?: boolean }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-1 px-4 text-center ${compact ? "py-6" : "py-12"}`}>
      <div className="text-[13.5px] font-medium text-ink">{title}</div>
      {hint && <div className="max-w-md text-[13px] text-faint">{hint}</div>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function Notice({ tone = "neutral", title, children, className = "" }: { tone?: "success" | "warning" | "danger" | "info" | "neutral"; title?: string; children?: React.ReactNode; className?: string }) {
  return (
    <div role="status" className={`notice notice-${tone} ${className}`}>
      {title && <div className="font-semibold">{title}</div>}{children && <div className={title ? "mt-0.5" : ""}>{children}</div>}
    </div>
  );
}

/** Headline numbers: one card, cells side by side with hairlines; cells stretch so none is left empty. */
export function StatStrip({ items }: { items: { label: string; value: React.ReactNode; unit?: string; hint?: string; sub?: React.ReactNode; tone?: "warning" | "danger" | "accent" }[] }) {
  return (
    <div className="card flex flex-wrap overflow-hidden">
      {items.map((s) => (
        <div key={s.label} className={`-ml-px -mt-px min-w-0 grow basis-[10.5rem] border-l border-t border-line px-4 py-3.5 ${items.length > 4 ? "sm:basis-[11rem]" : "sm:basis-[13rem]"}`} title={s.hint}>
          <div className="text-[12px] leading-snug text-faint">{s.label}</div>
          <div className={`mt-1.5 break-words text-[clamp(1.125rem,1.2vw+0.6rem,1.375rem)] font-medium leading-tight tracking-tight tabular-nums ${s.tone === "danger" ? "text-danger" : s.tone === "warning" ? "text-warning" : s.tone === "accent" ? "text-data" : "text-ink"}`}>
            {s.value}{s.unit && <span className="ml-1 text-[13px] font-normal text-faint">{s.unit}</span>}
          </div>
          {s.sub && <div className="mt-0.5 text-[12px] text-faint">{s.sub}</div>}
        </div>))}
    </div>
  );
}

export const Spinner = ({ className = "h-4 w-4" }: { className?: string }) => <Loader2 className={`${className} animate-spin text-faint`} aria-hidden />;

export function Loading({ label = "Loading" }: { label?: string }) {
  return <div className="flex items-center justify-center gap-2 py-12 text-[13px] text-faint" role="status"><Spinner />{label}...</div>;
}

export function ErrorState({ error }: { error: unknown }) {
  return <div className="card"><EmptyState title="This could not be loaded" hint={(error as Error)?.message ?? "Try again."} /></div>;
}

/** A card with a title row. */
export function Card({ title, actions, children, className = "", bodyClass = "card-body", count }: { title?: React.ReactNode; actions?: React.ReactNode; children: React.ReactNode; className?: string; bodyClass?: string; count?: React.ReactNode }) {
  return (
    <section className={`card flex min-w-0 flex-col ${className}`}>
      {(title || actions) && <div className="card-head"><h2 className="card-title">{title}</h2>{count !== undefined && <span className="count">{count}</span>}{actions && <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>}</div>}
      <div className={`flex-1 ${bodyClass}`}>{children}</div>
    </section>
  );
}

/** Label + value list for detail panes. */
export function DL({ items }: { items: [string, React.ReactNode][] }) {
  return <dl className="dl">{items.map(([k, v]) => <div key={k} className="contents"><dt>{k}</dt><dd>{v}</dd></div>)}</dl>;
}
