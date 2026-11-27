// How it works: the setup and its limits in plain words.
import { AGENTS, CELL, COLOR, NAME, ROLE, int, useSite } from "@/lib/data";
import { Card, ErrorState, Loading, Notice, PageHeader } from "@/components/common";
import { STUDY_REPO } from "@/components/Layout";

export default function Guide() {
  const site = useSite();
  if (site.error) return <ErrorState error={site.error} />;
  if (!site.data) return <Loading />;
  const f = site.data.frozen;
  const viewers = site.data.trace_seeds.length * 5;
  return (
    <div className="page">
      <PageHeader title="How it works" subtitle="What SlateStream shows, where the numbers come from, and what they cannot tell you." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="The simulated platform">
          <p className="text-[13px] text-muted">SlateStream is a front end for Google's RecSim "Interest Evolution" simulator. Each simulated viewer has tastes for 20 topics, which every recommender can see, and a limited time budget, which none of them can see. Every step the recommender sees {CELL[0]} fresh candidate videos and puts {CELL[1]} on screen (a slate). The viewer watches at most one.</p>
        </Card>
        <Card title="Why planning can help">
          <p className="text-[13px] text-muted">Viewers click on topics they like. Each video also has a hidden quality: good videos give some time budget back, poor ones use extra. A recommender that only chases the next click ignores quality; one that plans ahead can pick equally clickable but better videos, so the session lasts longer.</p>
        </Card>
        <Card title="The four recommenders" bodyClass="">
          <ul className="divide-y divide-line">
            {AGENTS.map((a) => <li key={a} className="flex items-start gap-2.5 px-4 py-3"><span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: COLOR[a] }} /><div><div className="text-[13.5px] font-medium text-ink">{NAME[a]}</div><div className="meta">{ROLE[a]}</div></div></li>)}
          </ul>
        </Card>
        <Card title="Fair rules">
          <ul className="list-disc space-y-1.5 pl-5 text-[13px] text-muted marker:text-line-hover">
            <li>Each learned recommender trained for {int(f.budget)} steps; settings were tuned once on separate viewers, then frozen.</li>
            <li>All recommenders are tested on the same {int(f.eval_episodes)} new viewers, repeated with 5 run seeds.</li>
            <li>A result is clear only if its 95% confidence interval excludes zero and all 5 seeds agree. The rule was written down before any run.</li>
            <li>Follow-ups E1 to E5 were planned after the main results and are labelled exploratory.</li>
          </ul>
        </Card>
        <Card title="What the replays are">
          <p className="text-[13px] text-muted">Watch, Race and Taste replay recorded test sessions: {viewers} viewers (5 per run seed), each served once by every recommender at N = {CELL[0]}, k = {CELL[1]}. Nothing is simulated in your browser. Other settings were saved only as averages, so they appear on the Findings page as charts.</p>
        </Card>
        <Card title="Where the numbers come from">
          <p className="text-[13px] text-muted">Every number is read from data files generated from the study's results by its own scripts; none is typed by hand. Code, configurations, protocol and results are in the <a className="font-medium text-info hover:underline" href={STUDY_REPO} target="_blank" rel="noopener noreferrer">study repository</a>.</p>
        </Card>
      </div>
      <Notice tone="warning" title="Limits">
        Simulated viewers only: nothing here is a claim about any real platform. SlateQ is the project's own PyTorch port of RecSim's agent, checked with unit tests and a calibration against the perfect click-chaser, not run side by side with the original. Topic names and cover art are generated decoration: topics in the simulator are only numbers.
      </Notice>
    </div>
  );
}
