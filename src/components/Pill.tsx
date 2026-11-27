// Status pills: dot + soft fill + hairline border. Normal states are neutral; colour only when it carries meaning.
import type { Verdict } from "@/lib/data";

export type Tone = "neutral" | "success" | "warning" | "danger" | "info";
const DOT: Record<Tone, string> = { neutral: "bg-line-hover", success: "bg-success-fill", warning: "bg-warning-fill", danger: "bg-danger-fill", info: "bg-info-fill" };

export function Pill({ tone = "neutral", children, title, dot = true }: { tone?: Tone; children: React.ReactNode; title?: string; dot?: boolean }) {
  return <span className={`pill pill-${tone}`} title={title}>{dot && <span className={`dot ${DOT[tone]}`} />}{children}</span>;
}

const RULE = "Clear = the 95% interval excludes zero and all 5 seeds agree (rule fixed before any run).";

/** Verdict of a paired comparison A − B, by the pre-registered rule. */
export function VerdictPill({ v, a = "first" }: { v: Verdict | undefined; a?: string }) {
  if (v === "A higher") return <Pill tone="success" title={RULE}>Clear: {a} higher</Pill>;
  if (v === "A lower") return <Pill tone="danger" title={RULE}>Clear: {a} lower</Pill>;
  if (v === "no clear difference") return <Pill tone="neutral" title={RULE}>No clear difference</Pill>;
  return <Pill tone="neutral">{v ?? "-"}</Pill>;
}

export function verdictShort(v: Verdict | undefined) {
  return v === "A higher" ? "clear, higher" : v === "A lower" ? "clear, lower" : v === "no clear difference" ? "no clear difference" : String(v ?? "-");
}

export const Exploratory = () => <Pill tone="warning" title="Planned after the main results were seen.">Follow-up</Pill>;
