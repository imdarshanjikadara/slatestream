// Findings: every research question and follow-up on the left, the selected one in full on the right.
import { useNavigate, useParams } from "react-router-dom";
import { useSite, type Site } from "@/lib/data";
import { FINDINGS, FOLLOW, MAIN, type Finding } from "@/lib/findings";
import { ErrorState, Loading, PageHeader } from "@/components/common";
import { SplitItem, SplitList, SplitView } from "@/components/SplitView";
import { Exploratory } from "@/components/Pill";
import { Source } from "@/components/Source";
import { Hint, Term } from "@/components/Help";
import { NextStep, StepLabel } from "@/components/Path";

export default function Findings() {
  const { id } = useParams();
  const nav = useNavigate();
  const site = useSite();
  if (site.error) return <ErrorState error={site.error} />;
  if (!site.data) return <Loading />;
  const S = site.data;
  const cur = FINDINGS.find((f) => f.id === id);
  const wide = typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;
  const shown = cur ?? (wide ? FINDINGS[0] : undefined);
  const pick = (f: Finding) => nav(`/findings/${f.id}`);
  return (
    <div className="page">
      <div>
        <StepLabel to="/findings" />
        <PageHeader title="Results" subtitle="Averages over every test viewer and 5 independent runs." />
      </div>
      <Hint>Pick a question on the left. The big number is SlateQ's extra <Term id="watch">watch time</Term> per session; the pill says if it is a <Term id="clear">clear result</Term>. Each result ends with what it does not show.</Hint>
      <SplitView selected={!!cur} onBack={() => nav("/findings")}
        list={<SplitList title="Questions" rowKey={(f) => f.id} activeId={shown?.id} onPick={pick}
          groups={[{ label: "Research questions", rows: MAIN }, { label: "Follow-up checks", rows: FOLLOW }]}
          render={(f) => { const h = f.headline(S); return <SplitItem title={<><span className="text-faint">{f.kicker} · </span>{f.title}</>} right={<span className="text-[13.5px] font-medium tabular-nums text-ink">{h.value}</span>} meta={h.verdict} metaRight={f.explo ? undefined : undefined} />; }} />}
        detail={shown && <Detail f={shown} S={S} />} />
      <NextStep to="/findings" />
    </div>
  );
}

function Detail({ f, S }: { f: Finding; S: Site }) {
  const h = f.headline(S);
  return (
    <div className="flex flex-col gap-4">
      <section className="card px-5 py-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1"><span className="text-[12px] font-medium text-faint">{f.kicker}</span><h2 className="text-[17px] font-semibold tracking-tight text-ink">{f.title}</h2>{f.explo && <Exploratory />}</div>
        <p className="mt-1 text-[13px] text-muted">{f.question}</p>
        <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-2 border-t border-line pt-3">
          <span className="text-[26px] font-medium tabular-nums tracking-tight text-data">{h.value}</span>
          <span className="text-[13px] text-faint">{h.unit}</span>
          <span className="ml-auto">{h.verdict}</span>
        </div>
        <Source files={f.sources} className="mt-2" />
      </section>
      <f.Detail site={S} />
    </div>
  );
}
