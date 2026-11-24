// Split view: the list on the left, the full record on the right, the record id in the URL.
// On phones the list and the record take turns (Back returns to the list).
import { ArrowLeft } from "lucide-react";
import { EmptyState } from "./common";

export function SplitView({ list, detail, selected, onBack }: { list: React.ReactNode; detail: React.ReactNode; selected: boolean; onBack: () => void }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(20rem,24rem)_minmax(0,1fr)] lg:items-start">
      <div className={`min-h-0 lg:sticky lg:top-7 ${selected ? "hidden lg:block" : ""}`}>{list}</div>
      <div className={`min-w-0 ${selected ? "" : "hidden lg:block"}`}>
        {selected && <button className="btn-ghost -ml-2 mb-2 lg:hidden" onClick={onBack}><ArrowLeft className="h-4 w-4" />Back to the list</button>}
        {detail}
      </div>
    </div>
  );
}

/** One row of a split-view list: title and its key value on the first line, details and a count on the second. */
export function SplitItem({ title, right, meta, metaRight, children }: { title: React.ReactNode; right?: React.ReactNode; meta?: React.ReactNode; metaRight?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="flex items-start gap-2">
        <span className="line-clamp-2 min-w-0 flex-1 text-[13.5px] font-medium leading-snug text-ink">{title}</span>
        {right && <span className="shrink-0">{right}</span>}
      </div>
      {(meta || metaRight) && (
        <div className="mt-1 flex items-center gap-2 text-[12px] text-faint">
          <span className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden whitespace-nowrap">{meta}</span>
          {metaRight && <span className="shrink-0 whitespace-nowrap tabular-nums">{metaRight}</span>}
        </div>)}
      {children}
    </div>
  );
}

export function SplitList<R>({ title, count, groups, rowKey, activeId, onPick, render }: {
  title: React.ReactNode; count?: React.ReactNode; groups: { label?: string; rows: R[] }[]; rowKey: (r: R) => string; activeId?: string | null; onPick: (r: R) => void; render: (r: R) => React.ReactNode;
}) {
  return (
    <section className="card flex flex-col overflow-hidden">
      <div className="card-head"><h2 className="card-title">{title}</h2>{count !== undefined && <span className="count">{count}</span>}</div>
      {groups.map((g, gi) => (
        <div key={gi}>
          {g.label && <div className={`bg-surface-alt px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-faint ${gi ? "border-t border-line" : ""} border-b border-line`}>{g.label}</div>}
          <ul className="divide-y divide-line" role="listbox" aria-label={g.label ?? "Records"}>
            {g.rows.map((r) => {
              const k = rowKey(r), on = activeId === k;
              return (
                <li key={k} role="option" aria-selected={on}>
                  <button type="button" onClick={() => onPick(r)} className={`block w-full px-4 py-3 text-left transition-colors ${on ? "bg-accent-soft" : "hover:bg-surface-alt"}`}>{render(r)}</button>
                </li>);
            })}
          </ul>
        </div>))}
    </section>
  );
}

export const NothingSelected = ({ what }: { what: string }) => (
  <div className="card"><EmptyState title={`Select ${what}`} hint="Pick one from the list to see every detail here." /></div>
);
