// All numbers: every comparison in the study as a plain table, each row linked to the file it comes from.
import { useMemo, useState } from "react";
import { Download, ExternalLink, Search, X } from "lucide-react";
import { PRIMARY, RUNG, SRC, STUDY_BLOB, fmt, sgn, useSite, type Gap } from "@/lib/data";
import { EmptyState, ErrorState, Loading, PageHeader, Tabs } from "@/components/common";
import { Hint, Term } from "@/components/Help";
import { Pill } from "@/components/Pill";

type Row = { part: string; comparison: string; first: string; setting: string; diff: number; lo: number; hi: number; verdict: string; main: boolean; file: string };

/** "E1: SlateQ - learned-myopic, both lr 1e-3" -> part E1, "SlateQ vs learned myopic, both lr 1e-3" */
function plain(c: string) {
  const m = c.match(/^(E\d): (.*)$/);
  const text = (m ? m[2] : c).replace(/learned-myopic/g, "learned myopic").replace(/oracle-myopic/g, "oracle myopic").replace(/ - /g, " vs ");
  return { part: m?.[1], text, first: text.split(" vs ")[0] };
}

function toRow(g: Gap, sec: "rq2" | "rq3" | "phase6b"): Row {
  const p = plain(g.comparison);
  const part = p.part ?? (sec === "rq3" ? "RQ3" : g.num_candidates === 10 && g.slate_size === 3 ? "RQ1" : "RQ2");
  const behaviour = g.condition !== "matched" ? ` · ${RUNG[g.condition] ?? g.condition}` : "";
  return {
    part, comparison: p.text, first: p.first,
    setting: `${g.num_candidates} candidates, ${g.slate_size} shown${g.control ? " (all shown)" : ""}${behaviour}`,
    diff: g.mean_diff, lo: g.ci95_low, hi: g.ci95_high, verdict: g.verdict,
    main: g.comparison === PRIMARY || g.comparison === "E4: SlateQ - learned-myopic" || /both lr|both 600K/.test(g.comparison),
    file: sec === "rq2" ? SRC.rq2Gaps : sec === "rq3" ? SRC.rq3Gaps : SRC.p6Gaps,
  };
}

export default function Comparisons() {
  const site = useSite();
  const [view, setView] = useState("main");
  const [q, setQ] = useState("");
  const rows = useMemo<Row[]>(() => {
    if (!site.data) return [];
    return (["rq2", "rq3", "phase6b"] as const).flatMap((s) => site.data![s].gaps
      .filter((g) => !(s === "rq3" && g.condition === "matched")) // same runs as RQ1
      .map((g) => toRow(g, s)));
  }, [site.data]);
  if (site.error) return <ErrorState error={site.error} />;
  if (!site.data) return <Loading />;
  const shown = rows.filter((r) => (view === "all" || r.main) && (!q || `${r.part} ${r.comparison} ${r.setting}`.toLowerCase().includes(q.toLowerCase())));
  const csv = () => {
    const head = ["part", "comparison", "setting", "difference", "range_low", "range_high", "result", "source_file"];
    const body = shown.map((r) => [r.part, r.comparison, r.setting, r.diff, r.lo, r.hi, r.verdict, r.file].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const url = URL.createObjectURL(new Blob([[head.join(","), ...body].join("\n")], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = "slatestream-numbers.csv"; a.click(); URL.revokeObjectURL(url);
  };
  return (
    <div className="page">
      <PageHeader title="All numbers" subtitle="Every comparison in the study, each linked to the file it comes from.">
        <button className="btn" onClick={csv}><Download className="h-4 w-4" />Download CSV</button>
      </PageHeader>
      <Hint>
        Each row compares two recommenders on the same viewers. <b className="font-medium">Difference</b> = first minus second, in <Term id="watch">watch time</Term> per session.
        Example: <b className="font-medium">+1.70</b> means SlateQ kept viewers watching 1.70 longer per session than learned myopic.
      </Hint>
      <div className="flex flex-wrap items-center gap-2">
        <Tabs ariaLabel="Rows" active={view} onChange={setView} items={[{ key: "main", label: "Main comparison", count: rows.filter((r) => r.main).length }, { key: "all", label: "Everything", count: rows.length }]} />
        <div className="relative w-full sm:ml-auto sm:w-72">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search, e.g. 80 candidates or E2" aria-label="Search" className="input pl-8 pr-8" type="search" />
          {q && <button type="button" onClick={() => setQ("")} className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-faint hover:text-ink" aria-label="Clear search"><X className="h-3.5 w-3.5" /></button>}
        </div>
      </div>
      {view === "main" && <p className="-mt-2 text-[12.5px] text-faint">Showing SlateQ vs learned myopic only (the main comparison). Choose "Everything" to add the comparisons with oracle myopic and random.</p>}
      <div className="card overflow-hidden">
        <div className="overflow-auto">
          <table className="tbl w-full text-[13px]">
            <thead className="bg-surface-alt"><tr className="border-b border-line">
              {["Part", "Comparison", "Setting", "Difference", "95% range", "Result", "Source"].map((h, i) => <th key={h} className={`whitespace-nowrap px-3 py-2.5 text-[12px] font-medium text-faint first:pl-4 ${i === 3 || i === 4 ? "text-right" : "text-left"}`}>{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-line">
              {shown.map((r, i) => (
                <tr key={i} className="hover:bg-hover-row">
                  <td className="h-10 px-3 pl-4 font-medium text-muted">{r.part}</td>
                  <td className="min-w-[13rem] px-3 py-1.5">{r.comparison}</td>
                  <td className="min-w-[11rem] px-3 text-muted">{r.setting}</td>
                  <td className={`px-3 text-right font-medium tabular-nums ${r.verdict === "A higher" ? "text-success" : r.verdict === "A lower" ? "text-danger" : "text-ink"}`}>{sgn(r.diff)}</td>
                  <td className="whitespace-nowrap px-3 text-right tabular-nums text-faint">{fmt(r.lo)} to {fmt(r.hi)}</td>
                  <td className="whitespace-nowrap px-3">
                    {r.verdict === "A higher" ? <Pill tone="success">{r.first} clearly ahead</Pill> : r.verdict === "A lower" ? <Pill tone="danger">{r.first} clearly behind</Pill> : <Pill tone="neutral">No clear difference</Pill>}
                  </td>
                  <td className="whitespace-nowrap px-3">
                    <a href={STUDY_BLOB + r.file} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 font-mono text-[11.5px] text-info hover:underline">{r.file.replace("results/", "")}<ExternalLink className="h-3 w-3" /></a>
                  </td>
                </tr>))}
              {!shown.length && <tr><td colSpan={7}><EmptyState title="Nothing matches this search" hint="Try a shorter word, or clear the search." /></td></tr>}
            </tbody>
          </table>
        </div>
        <div className="border-t border-line px-4 py-2.5 text-[12.5px] text-muted">{shown.length} rows</div>
      </div>
    </div>
  );
}
