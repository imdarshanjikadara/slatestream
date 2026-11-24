// All comparisons: every paired comparison in the study as one table, filtered by section and searchable.
import { useMemo, useState } from "react";
import { Download, Search, X } from "lucide-react";
import { RUNG, fmt, sgn, useSite, type Gap } from "@/lib/data";
import { ErrorState, EmptyState, Loading, PageHeader, Tabs } from "@/components/common";
import { VerdictPill } from "@/components/Pill";
import { HowTo, Term } from "@/components/Help";

type Row = Gap & { section: string };
const SECTIONS = [{ key: "all", label: "All" }, { key: "rq2", label: "RQ1 and RQ2" }, { key: "rq3", label: "RQ3" }, { key: "phase6b", label: "Follow-ups E1 to E4" }];

export default function Comparisons() {
  const site = useSite();
  const [sec, setSec] = useState("all");
  const [q, setQ] = useState("");
  const [verdict, setVerdict] = useState("");
  const rows = useMemo<Row[]>(() => {
    if (!site.data) return [];
    return (["rq2", "rq3", "phase6b"] as const).flatMap((s) => site.data![s].gaps.filter((g) => !(s === "rq3" && g.condition === "matched")).map((g) => ({ ...g, section: s })));
  }, [site.data]);
  if (site.error) return <ErrorState error={site.error} />;
  if (!site.data) return <Loading />;
  const shown = rows.filter((r) => (sec === "all" || r.section === sec) && (!verdict || r.verdict === verdict)
    && (!q || `${r.comparison} ${RUNG[r.condition] ?? r.condition} N=${r.num_candidates} k=${r.slate_size}`.toLowerCase().includes(q.toLowerCase())));
  const count = (s: string) => rows.filter((r) => s === "all" || r.section === s).length;
  const csv = () => {
    const head = ["section", "condition", "N", "k", "comparison", "mean_diff", "ci95_low", "ci95_high", "n_seeds", "verdict"];
    const body = shown.map((r) => [r.section, r.condition, r.num_candidates, r.slate_size, r.comparison, r.mean_diff, r.ci95_low, r.ci95_high, r.n_seeds, r.verdict].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const url = URL.createObjectURL(new Blob([[head.join(","), ...body].join("\n")], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = "slatestream-comparisons.csv"; a.click(); URL.revokeObjectURL(url);
  };
  return (
    <div className="page">
      <PageHeader title="All comparisons" subtitle="Every paired comparison in the study: the mean difference in watch time per session over 5 seeds, its 95% confidence interval and the verdict by the pre-registered rule.">
        <button className="btn" onClick={csv}><Download className="h-4 w-4" />Export CSV</button>
      </PageHeader>
      <HowTo id="comparisons">
        Each row compares two recommenders as <b className="font-medium">first − second</b> in <Term id="watch">watch time</Term> per session, averaged over 5 runs. The <Term id="ci">95% CI</Term> is the likely range of that average; the verdict applies the <Term id="clear">rule fixed before any run</Term>. <Term id="N">N</Term> is the number of candidates and <Term id="k">k</Term> the number shown.
      </HowTo>
      <Tabs ariaLabel="Section" active={sec} onChange={setSec} items={SECTIONS.map((s) => ({ key: s.key, label: s.label, count: count(s.key) }))} />
      <div className="flex flex-wrap items-center gap-2" role="search">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search comparisons" aria-label="Search comparisons" className="input pl-8 pr-8" type="search" />
        </div>
        <select className="input w-full pr-8 sm:w-52" aria-label="Verdict" value={verdict} onChange={(e) => setVerdict(e.target.value)}>
          <option value="">Any verdict</option><option value="A higher">Clear: first higher</option><option value="A lower">Clear: first lower</option><option value="no clear difference">No clear difference</option>
        </select>
        {(q || verdict) && <button className="btn-ghost" onClick={() => { setQ(""); setVerdict(""); }}><X className="h-4 w-4" />Clear</button>}
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-auto">
          <table className="tbl w-full text-[13px]">
            <thead className="bg-surface-alt"><tr className="border-b border-line">
              {["Comparison", "Setting", "N", "k", "Mean difference", "95% CI", "Verdict"].map((h, i) => <th key={h} className={`whitespace-nowrap px-3 py-2.5 text-[12px] font-medium text-faint first:pl-4 ${[2, 3, 4, 5].includes(i) ? "text-right" : "text-left"}`}>{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-line">
              {shown.map((r, i) => (
                <tr key={i} className="hover:bg-hover-row">
                  <td className="h-10 min-w-[16rem] px-3 py-1.5 pl-4">{r.comparison.replace(/ - /g, " − ")}</td>
                  <td className="whitespace-nowrap px-3 text-muted">{RUNG[r.condition] ?? r.condition}{r.control ? " (control)" : ""}</td>
                  <td className="px-3 text-right tabular-nums">{r.num_candidates}</td>
                  <td className="px-3 text-right tabular-nums">{r.slate_size}</td>
                  <td className={`px-3 text-right font-medium tabular-nums ${r.mean_diff < 0 ? "text-danger" : "text-ink"}`}>{sgn(r.mean_diff)}</td>
                  <td className="whitespace-nowrap px-3 text-right tabular-nums text-muted">[{fmt(r.ci95_low)}, {fmt(r.ci95_high)}]</td>
                  <td className="whitespace-nowrap px-3"><VerdictPill v={r.verdict} /></td>
                </tr>))}
              {!shown.length && <tr><td colSpan={7}><EmptyState title="Nothing matches these filters" hint="Comparisons exist, but the search or verdict filter hides them." /></td></tr>}
            </tbody>
          </table>
        </div>
        <div className="border-t border-line px-4 py-2.5 text-[12.5px] text-muted">Rows <b className="font-semibold text-ink">{shown.length}</b> of <b className="font-semibold text-ink">{rows.length}</b></div>
      </div>
    </div>
  );
}
