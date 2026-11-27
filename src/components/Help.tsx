// Small teaching aids: Term (a word with a pop-up definition) and Hint (one line of guidance under a page title).
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CircleHelp, Lightbulb } from "lucide-react";

export const GLOSSARY: Record<string, { term: string; text: string }> = {
  slate: { term: "Slate", text: "The videos shown at once: 3 of the 10 candidates. The viewer watches at most one." },
  quality: { term: "Quality", text: "A hidden score of each video. Above 0 gives the viewer time back; below 0 uses extra time." },
  taste: { term: "Taste", text: "How much the viewer likes a topic, from −1 to +1. It changes slowly with what they watch." },
  budget: { term: "Time budget", text: "The viewer's remaining time. It starts at 200; the session ends at 0." },
  watch: { term: "Watch time", text: "Total time spent watching in one session. This is the score: higher is better." },
  clear: { term: "Clear result", text: "The 95% interval excludes 0 and all 5 independent runs agree. This rule was fixed before any run." },
  ci: { term: "95% interval", text: "The range the true average difference very likely falls in, based on 5 independent runs." },
  oracle: { term: "Oracle myopic", text: "A click-chaser given the simulator's exact click model. The best possible recommender that only looks at the next click." },
  gamma: { term: "γ (gamma)", text: "How far ahead a recommender plans. 0 = next click only; 0.99 = the whole session." },
};

/** A word with a dotted underline; its definition opens on hover, focus or tap, above everything else on the page. */
export function Term({ id, children }: { id: keyof typeof GLOSSARY; children?: React.ReactNode }) {
  const g = GLOSSARY[id];
  const btn = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number; above: boolean } | null>(null);
  useLayoutEffect(() => {
    if (!open || !btn.current) return;
    const r = btn.current.getBoundingClientRect();
    const w = 256, above = r.bottom + 120 > window.innerHeight;
    setPos({ left: Math.max(8, Math.min(r.left, window.innerWidth - w - 8)), top: above ? r.top - 8 : r.bottom + 8, above });
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    return () => window.removeEventListener("scroll", close, true);
  }, [open]);
  return (
    <>
      <button ref={btn} type="button" className="inline-flex cursor-help items-center gap-0.5 rounded-sm border-b border-dotted border-current text-inherit focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} onClick={() => setOpen((o) => !o)}>
        {children ?? g.term}<CircleHelp className="h-3 w-3 opacity-60" aria-hidden />
      </button>
      {open && pos && createPortal(
        <span role="tooltip" className="pop pointer-events-none fixed z-[200] w-64 px-3 py-2.5 text-[12.5px] leading-snug text-muted"
          style={{ left: pos.left, top: pos.top, transform: pos.above ? "translateY(-100%)" : undefined }}>
          <span className="mb-0.5 block font-semibold text-ink">{g.term}</span>{g.text}
        </span>, document.body)}
    </>
  );
}

/** One line of guidance under a page title. */
export function Hint({ children }: { children: React.ReactNode }) {
  return <p className="flex items-start gap-2 rounded-lg border border-info-line bg-info-soft px-3 py-2 text-[13px] leading-relaxed text-ink"><Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-info" /><span className="min-w-0">{children}</span></p>;
}
