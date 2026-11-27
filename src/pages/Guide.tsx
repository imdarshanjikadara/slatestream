// About the project: the setup, the rules and the limits, in a few short cards.
import { AGENTS, CELL, COLOR, NAME, ROLE, SRC, STUDY_BLOB, int, useSite } from "@/lib/data";
import { Source } from "@/components/Source";
import { Card, ErrorState, Loading, PageHeader } from "@/components/common";
import { STUDY_REPO } from "@/components/Layout";

export default function Guide() {
  const site = useSite();
  if (site.error) return <ErrorState error={site.error} />;
  if (!site.data) return <Loading />;
  const f = site.data.frozen;
  const p = "text-[13px] leading-relaxed text-muted";
  return (
    <div className="page">
      <PageHeader title="About the project" subtitle="Course project for CSCI 5933 Reinforcement Learning, University of Colorado Denver." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="The simulator">
          <p className={p}>Google's RecSim, "Interest Evolution" setting. Each step the recommender sees {CELL[0]} fresh candidate videos and shows {CELL[1]}. The viewer watches at most one. Clicks depend on the viewer's taste; a hidden video quality decides how much time the viewer has left. Good videos make the session last longer.</p>
        </Card>
        <Card title="The four recommenders" bodyClass="">
          <ul className="divide-y divide-line">
            {AGENTS.map((a) => <li key={a} className="flex items-baseline gap-2.5 px-4 py-2.5"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: COLOR[a] }} /><span className="text-[13.5px] font-medium text-ink">{NAME[a]}</span><span className="meta">{ROLE[a]}</span></li>)}
          </ul>
        </Card>
        <Card title="How results are judged">
          <ul className={`list-disc space-y-1 pl-5 ${p}`}>
            <li>Training: {int(f.budget)} steps per learned recommender, settings tuned once, then frozen.</li>
            <li>Testing: the same {int(f.eval_episodes)} new viewers for every recommender, repeated in 5 independent runs.</li>
            <li>A result is "clear" only if its 95% interval excludes 0 and all 5 runs agree. This rule was written before any run.</li>
          </ul>
          <Source files={[SRC.budget, SRC.tune]} className="mt-3" />
        </Card>
        <Card title="Limits">
          <ul className={`list-disc space-y-1 pl-5 ${p}`}>
            <li>Simulated viewers only; no claim about any real platform.</li>
            <li>SlateQ is my PyTorch version of RecSim's agent, checked with unit tests, not run side by side with Google's original.</li>
            <li>The replays are 25 recorded sessions; the results use every test viewer.</li>
            <li>Topic names and video pictures are made up; in the simulator topics are only numbers.</li>
          </ul>
        </Card>
      </div>
      <Card title="Where the numbers come from">
        <ol className={`list-decimal space-y-1 pl-5 ${p}`}>
          <li>Each run of the experiments saves its raw output.</li>
          <li>The study's analysis script turns the runs into small tables in <code className="font-mono text-[12px]">results/</code> (for example <code className="font-mono text-[12px]">results/rq2/gaps.csv</code>).</li>
          <li>This site reads copies of those tables. Under every chart and number, a <b className="font-medium text-ink">Source</b> link opens the exact file on GitHub.</li>
        </ol>
        <p className={`mt-3 ${p}`}>All numbers with their files are also listed in <a className="font-medium text-info hover:underline" href={STUDY_BLOB + SRC.numbers} target="_blank" rel="noopener noreferrer">docs/NUMBERS.md</a>. Code: <a className="font-medium text-info hover:underline" href={STUDY_REPO} target="_blank" rel="noopener noreferrer">github.com/imdarshanjikadara/slateq-recsim-study</a>.</p>
      </Card>
    </div>
  );
}
