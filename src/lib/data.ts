// Study data: public/data/site.json and traces_seed<k>.json, generated in the study repository from its results/
// (scripts/build_web.py) and copied here by scripts/sync-data.mjs. No result number is typed by hand anywhere in
// this app: every value shown is read from these files.
import { useEffect, useState } from "react";

export type Agent = "slateq" | "learned_myopic" | "oracle_myopic" | "random";
export const AGENTS: Agent[] = ["slateq", "learned_myopic", "oracle_myopic", "random"];
export const NAME: Record<Agent, string> = { slateq: "SlateQ", learned_myopic: "Learned myopic", oracle_myopic: "Oracle myopic", random: "Random" };
export const ROLE: Record<Agent, string> = {
  slateq: "Plans for the whole session (γ = 0.99)",
  learned_myopic: "Same model, but only looks at the next click (γ = 0)",
  oracle_myopic: "Given the exact click model; the best click-chaser",
  random: "Shows random videos",
};
/** Data colours: blue for the method under study, neutrals for the baselines (reference: "colour for data, neutral for the rest"). */
export const COLOR: Record<Agent, string> = { slateq: "#1d4ed8", learned_myopic: "#64748b", oracle_myopic: "#0b1f3f", random: "#cbd5e1" };

export const PRIMARY = "SlateQ - learned-myopic";
export const VS_ORACLE = "SlateQ - oracle-myopic";
export const CELL: [number, number] = [10, 3];
export const RUNGS = ["matched", "mild_noclick3", "moderate_logit", "severe_cascade"] as const;
export const RUNG: Record<string, string> = {
  matched: "As SlateQ assumes",
  mild_noclick3: "Skip more often",
  moderate_logit: "Different click formula",
  severe_cascade: "Scan top-down (RecSim cascade)",
  paper_cascade: "Scan top-down (SlateQ paper)",
};

export type Verdict = "A higher" | "A lower" | "no clear difference" | string;
export type Gap = {
  condition: string; num_candidates: number; slate_size: number; control: boolean; comparison: string;
  agent_a: string; agent_b: string; primary: boolean; n_seeds: number; mean_diff: number; std_diff: number;
  ci95_low: number; ci95_high: number; relative_to_b: number; verdict: Verdict; [k: string]: unknown;
};
export type AgentRow = {
  condition: string; num_candidates: number; slate_size: number; control: boolean; agent: string; n_seeds: number;
  mean_total_reward: number; mean_length: number; mean_clicks: number; mean_clicked_quality: number; [k: string]: unknown;
};
export type ClickRow = {
  condition: string; num_candidates: number; slate_size: number; control: boolean; agent: string;
  click_rate: number; clicks_per_session: number; watch_per_click: number; watch_per_session: number; [k: string]: unknown;
};
export type ClickGap = {
  condition: string; num_candidates: number; slate_size: number; control: boolean; comparison: string; pattern: string;
  click_rate_verdict: Verdict; watch_per_session_verdict: Verdict; clicks_per_session_verdict: Verdict; [k: string]: unknown;
};
export type Site = {
  git_sha: string; case_study_seed: number; trace_seeds: number[];
  frozen: { budget: number; eval_episodes: number; selected: Record<string, { learning_rate: number }> };
  runs: Record<string, { ok: number }>;
  rq2: { agents: AgentRow[]; gaps: Gap[] };
  rq3: { agents: AgentRow[]; gaps: Gap[] };
  phase6b: { agents: AgentRow[]; gaps: Gap[]; clicks_watch: ClickRow[]; clicks_watch_gaps: ClickGap[] };
};
export type Session = {
  episode: number; budget: number[]; reward: number[]; clicked: number[]; clusters: number[][]; quality: number[][]; interests: number[][];
  // derived
  cum: number[]; clk: number[]; len: number; total: number; clicks: number;
};
export type Traces = Record<Agent, Session[]>;

/* ------------------------------------------------------------------ loading (cached per file) */
const cache = new Map<string, Promise<unknown>>();
const resolved = new Map<string, unknown>();
function load<T>(file: string, prep?: (x: any) => T): Promise<T> {
  if (!cache.has(file)) cache.set(file, fetch(`/data/${file}`).then((r) => { if (!r.ok) throw new Error(`${file}: HTTP ${r.status}`); return r.json(); }).then((x) => { const v = prep ? prep(x) : x; resolved.set(file, v); return v; }));
  return cache.get(file) as Promise<T>;
}
function prepTraces(tr: Record<string, any[]>): Traces {
  for (const list of Object.values(tr)) for (const e of list) {
    let c = 0, k = 0;
    e.cum = e.reward.map((r: number) => (c += r));
    e.clk = e.clicked.map((i: number) => (k += i >= 0 ? 1 : 0));
    e.len = e.reward.length; e.total = c; e.clicks = k;
  }
  return tr as Traces;
}
function useLoad<T>(file: string | null, prep?: (x: any) => T) {
  const [state, setState] = useState<{ data?: T; error?: Error; file?: string }>(() => (file && resolved.has(file) ? { data: resolved.get(file) as T, file } : {}));
  useEffect(() => {
    if (!file) return;
    let live = true;
    load<T>(file, prep).then((data) => live && setState({ data, file }), (error) => live && setState({ error, file }));
    return () => { live = false; };
  }, [file]); // eslint-disable-line react-hooks/exhaustive-deps
  const known = file && resolved.has(file) ? (resolved.get(file) as T) : undefined;
  return { data: state.file === file ? state.data : known, error: state.error, loading: !state.data && !state.error };
}
export const useSite = () => useLoad<Site>("site.json");
export const useTraces = (seed: number | null) => useLoad<Traces>(seed === null ? null : `traces_seed${seed}.json`, prepTraces);

/* ------------------------------------------------------------------ lookups */
export const isCell = (r: { num_candidates: number; slate_size: number }, n: number, k: number) => r.num_candidates === n && r.slate_size === k;
export function gap(site: Site, sec: "rq2" | "rq3" | "phase6b", cmp: string, n: number, k: number, cond = "matched"): Gap | undefined {
  return site[sec].gaps.find((r) => r.condition === cond && r.comparison === cmp && isCell(r, n, k));
}
export function agentRow(site: Site, sec: "rq2" | "rq3" | "phase6b", agent: string, n: number, k: number, cond = "matched"): AgentRow | undefined {
  return site[sec].agents.find((r) => r.condition === cond && r.agent === agent && isCell(r, n, k));
}
export const clickRow = (site: Site, agent: string, n: number, k: number, cond: string) =>
  site.phase6b.clicks_watch.find((r) => r.agent === agent && r.condition === cond && isCell(r, n, k));

/* ------------------------------------------------------------------ formatting */
const MINUS = "−";
export const fmt = (x: unknown, d = 2) => { const n = Number(x); return x === null || x === undefined || !Number.isFinite(n) ? "-" : n.toFixed(d).replace("-", MINUS); };
export const sgn = (x: unknown, d = 2) => { const n = Number(x); return x === null || x === undefined || !Number.isFinite(n) ? "-" : (n >= 0 ? "+" : MINUS) + Math.abs(n).toFixed(d); };
export const pct = (x: unknown, d = 1) => { const n = Number(x); return x === null || x === undefined || !Number.isFinite(n) ? "-" : (n >= 0 ? "+" : MINUS) + Math.abs(100 * n).toFixed(d) + "%"; };
export const int = (x: unknown) => { const n = Number(x); return Number.isFinite(n) ? n.toLocaleString("en-US") : "-"; };
export const ci = (g: { ci95_low: number; ci95_high: number }) => `95% CI [${sgn(g.ci95_low)}, ${sgn(g.ci95_high)}]`;
export const topicName = (c: number) => `Topic ${String(c + 1).padStart(2, "0")}`;

/* ------------------------------------------------------------------ where each number comes from (study repo on GitHub) */
export const STUDY_BLOB = "https://github.com/imdarshanjikadara/slateq-recsim-study/blob/master/";
export const SRC = {
  rq2Gaps: "results/rq2/gaps.csv", rq2Agents: "results/rq2/agents.csv",
  rq3Gaps: "results/rq3/gaps.csv", rq3Agents: "results/rq3/agents.csv",
  p6Gaps: "results/phase6b/gaps.csv", p6Agents: "results/phase6b/agents.csv",
  p6Clicks: "results/phase6b/clicks_watch.csv", p6ClickGaps: "results/phase6b/clicks_watch_gaps.csv",
  budget: "results/phase3/budget.json", tune: "results/phase3/tune.json",
  numbers: "docs/NUMBERS.md",
};
export const traceFile = (agent: string, seed: number) => `results/rq2/traces/matched_${agent}_seed${seed}.jsonl`;
