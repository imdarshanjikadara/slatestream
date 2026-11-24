// Findings: every research question and follow-up on the left, the selected one in full on the right.
import { useNavigate, useParams } from "react-router-dom";
import { useSite, type Site } from "@/lib/data";
import { FINDINGS, FOLLOW, MAIN, type Finding } from "@/lib/findings";
import { ErrorState, Loading, PageHeader } from "@/components/common";
import { SplitItem, SplitList, SplitView } from "@/components/SplitView";
import { Exploratory } from "@/components/Pill";
import { HowTo, Steps, Term } from "@/components/Help";

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
      <PageHeader title="Findings" subtitle={<>Averages over {S.frozen.eval_episodes.toLocaleString("en-US")} test viewers per run and 5 run seeds. A result is <b className="font-medium text-ink">clear</b> only if its 95% confidence interval excludes zero and all 5 seeds agree; the rule was fixed before any run.</>} />
      <HowTo id="findings" title="How to read a finding">
        <Steps items={[
          <>Pick a question on the left. <b className="font-medium text-ink">RQ1 to RQ3</b> were planned before any run; <b className="font-medium text-ink">E1 to E5</b> are follow-ups.</>,
          <>The big number is an average difference in <Term id="watch">watch time</Term> per session. Positive means SlateQ keeps viewers longer.</>,
          <>The pill says whether it is a <Term id="clear">clear result</Term>. Bar whiskers show the <Term id="ci">95% interval</Term>.</>,
          <>Always read <b className="font-medium text-ink">What it does not show</b> at the bottom of each finding.</>,
        ]} />
      </HowTo>
      <SplitView selected={!!cur} onBack={() => nav("/findings")}
        list={<SplitList title="Questions" count={`${FINDINGS.length} findings`} rowKey={(f) => f.id} activeId={shown?.id} onPick={pick}
          groups={[{ label: "Main questions · pre-registered", rows: MAIN }, { label: "Follow-ups · exploratory", rows: FOLLOW }]}
          render={(f) => { const h = f.headline(S); return <SplitItem title={<><span className="text-faint">{f.kicker} · </span>{f.title}</>} right={<span className="text-[13.5px] font-medium tabular-nums text-ink">{h.value}</span>} meta={h.verdict} metaRight={f.explo ? undefined : undefined} />; }} />}
        detail={shown && <Detail f={shown} S={S} />} />
    </div>
  );
}

function Detail({ f, S }: { f: Finding; S: Site }) {
  const h = f.headline(S);
  return (
    <div className="flex flex-col gap-4">
      <section className="card px-5 py-4">
        <div className="text-[12px] text-faint">{f.kicker}{f.explo ? " · follow-up, registered after the main results were seen" : " · pre-registered"}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1"><h2 className="text-[17px] font-semibold tracking-tight text-ink">{f.title}</h2>{f.explo && <Exploratory />}</div>
        <p className="mt-1 text-[13px] text-muted">{f.question}</p>
        <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-2 border-t border-line pt-3">
          <span className="text-[26px] font-medium tabular-nums tracking-tight text-data">{h.value}</span>
          <span className="text-[13px] text-faint">{h.unit}</span>
          <span className="ml-auto">{h.verdict}</span>
        </div>
      </section>
      <f.Detail site={S} />
    </div>
  );
}
