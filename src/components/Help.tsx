// Teaching aids: glossary pop-ups (Term), collapsible "How to read this" panels (HowTo) and numbered hints (Hint).
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, CircleHelp, Lightbulb } from "lucide-react";

export const GLOSSARY: Record<string, { term: string; text: string }> = {
  slate: { term: "Slate", text: "The small set of videos put on screen at once (here 3 of the 10 candidates). The viewer watches at most one of them." },
  quality: { term: "Quality", text: "A hidden score of each video. Watching a good-quality video (above 0) gives the viewer some time back; a poor one (below 0) uses extra time. Viewers do not see it when they choose." },
  taste: { term: "Taste", text: "How much the viewer likes a topic, from −1 (dislikes) to +1 (likes). Viewers click liked topics more often, and their taste slowly changes with what they watch." },
  budget: { term: "Time budget", text: "How much time the viewer has left. Every step uses some; good-quality videos refund part of it. When it reaches 0 the viewer leaves." },
  watch: { term: "Watch time", text: "The score of a session: total time spent watching videos. Higher is better. A longer session usually means more watch time." },
  gamma: { term: "γ (gamma)", text: "How far ahead a recommender plans. γ = 0 only cares about the next click; γ = 0.99 also values what happens many steps later." },
  ci: { term: "95% confidence interval", text: "The range the true average difference very likely lies in, given the 5 runs. If it does not include 0, the difference is unlikely to be luck." },
  clear: { term: "Clear result", text: "The rule fixed before any run: a difference counts as clear only if its 95% interval excludes 0 and all 5 runs agree on the direction." },
  oracle: { term: "Oracle myopic", text: "A cheating click-chaser that can see the viewer's hidden tastes. It is the best possible recommender that only thinks about the next click." },
  learned: { term: "Learned myopic", text: "The same learning code as SlateQ, but told to care only about the next click (γ = 0). It is the fair comparison for SlateQ." },
  N: { term: "N (candidates)", text: "How many fresh videos the recommender can choose from at each step." },
  k: { term: "k (slate size)", text: "How many videos are shown at once." },
};

/** A word with a dotted underline and a small pop-up definition (hover, focus or tap). */
export function Term({ id, children }: { id: keyof typeof GLOSSARY; children?: React.ReactNode }) {
  const g = GLOSSARY[id];
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLSpanElement>(null);
  const tip = useId();
  useEffect(() => {
    if (!open) return;
    const off = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", off); return () => document.removeEventListener("mousedown", off);
  }, [open]);
  return (
    <span ref={box} className="relative inline-flex items-center" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button type="button" className="inline-flex cursor-help items-center gap-0.5 border-b border-dotted border-current text-inherit" aria-describedby={open ? tip : undefined}
        onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} onClick={() => setOpen((o) => !o)}>
        {children ?? g.term}<CircleHelp className="h-3 w-3 opacity-60" aria-hidden />
      </button>
      {open && (
        <span id={tip} role="tooltip" className="pop absolute left-0 top-full z-50 mt-1.5 w-64 px-3 py-2.5 text-left text-[12.5px] font-normal leading-snug text-muted normal-case tracking-normal">
          <span className="mb-0.5 block font-semibold text-ink">{g.term}</span>{g.text}
        </span>)}
    </span>
  );
}

/** Collapsible "How to read this" panel; remembers whether it was closed. */
export function HowTo({ id, title = "How to read this page", children }: { id: string; title?: string; children: React.ReactNode }) {
  const key = `ss-howto-${id}`;
  const [open, setOpen] = useState(() => { try { return localStorage.getItem(key) !== "closed"; } catch { return true; } });
  const toggle = () => { setOpen((o) => { try { localStorage.setItem(key, o ? "closed" : "open"); } catch { /* storage blocked */ } return !o; }); };
  return (
    <section className="rounded-xl border border-info-line bg-info-soft">
      <button type="button" onClick={toggle} aria-expanded={open} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13.5px] font-semibold text-info">
        <Lightbulb className="h-4 w-4" />{title}<ChevronDown className={`ml-auto h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-4 pb-3.5 text-[13px] leading-relaxed text-ink">{children}</div>}
    </section>
  );
}

/** Numbered list of hints inside a HowTo. */
export function Steps({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((x, i) => (
        <li key={i} className="flex gap-2.5 rounded-lg border border-info-line/70 bg-surface px-3 py-2.5">
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-semibold text-on-primary">{i + 1}</span>
          <span className="text-[12.5px] leading-snug text-muted">{x}</span>
        </li>))}
    </ol>
  );
}
