// Guided tour: a short sequence of pages, each with what to look at and something to try.
// Progress is kept in localStorage so a reload continues where the visitor was.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Compass, X } from "lucide-react";

export type TourStep = { path: string; title: string; body: string; look: string[]; tryThis?: string };
export const TOUR: TourStep[] = [
  { path: "/", title: "The question",
    body: "Should a video recommender show what gets clicked now, or plan for the whole session? This project tests that in a simulator.",
    look: ["The four numbers at the top are the main results.", "Each number has a Source link to the file it comes from."],
    tryThis: "Point at any underlined word to see what it means." },
  { path: "/watch", title: "Watch one viewer",
    body: "A real recorded session: the same viewer, served by SlateQ on the left and a click-chaser on the right.",
    look: ["The outlined video is the one the viewer watched.", "Green quality gives time back, red costs extra.", "The bar shows how much time the viewer has left."],
    tryThis: "Press Play and read the 'What just happened' box." },
  { path: "/race", title: "Compare all four",
    body: "The same viewer, served by each of the four recommenders.",
    look: ["Which bar grows the longest.", "Random can last long but earns little: the viewer mostly skips."],
    tryThis: "Press Play, then try another viewer with the arrows." },
  { path: "/taste", title: "Tastes change",
    body: "What a viewer watches slowly changes what they like.",
    look: ["Rows that change colour over time.", "Dots mark the topic watched at each step."],
    tryThis: "Switch to 'Change since step 1'." },
  { path: "/findings/rq1", title: "Result 1: planning wins, a little",
    body: "Over every test viewer, SlateQ keeps viewers watching slightly longer than both click-chasers.",
    look: ["The big number and its pill (clear or not).", "The lines on each bar show the 95% range."] },
  { path: "/findings/rq2", title: "Result 2: more choice, bigger gap",
    body: "The main new result: with more candidate videos, planning ahead pays off much more.",
    look: ["Bars grow from 5 to 80 candidates.", "Showing more videos at once makes the gap smaller."],
    tryThis: "Click the buttons or a bar group." },
  { path: "/findings/rq3", title: "Result 3: different viewers",
    body: "SlateQ assumes how viewers choose. Here viewers break that assumption.",
    look: ["The advantage holds for small changes.", "It is not clear for viewers who scan top-down."] },
  { path: "/comparisons", title: "Check any number",
    body: "Every comparison in one table, with a link to the file it comes from.",
    look: ["Green = SlateQ clearly ahead; grey = no clear difference."], tryThis: "Open a Source link to see the raw file on GitHub." },
];

type Tour = { index: number | null; start: (at?: number) => void; go: (i: number) => void; end: () => void };
const Ctx = createContext<Tour | null>(null);
const KEY = "ss-tour";

export function TourProvider({ children }: { children: React.ReactNode }) {
  const nav = useNavigate();
  const [index, setIndex] = useState<number | null>(() => { try { const v = localStorage.getItem(KEY); return v === null ? null : Number(v); } catch { return null; } });
  const save = (v: number | null) => { try { v === null ? localStorage.removeItem(KEY) : localStorage.setItem(KEY, String(v)); } catch { /* storage blocked */ } };
  const go = useCallback((i: number) => { const j = Math.max(0, Math.min(TOUR.length - 1, i)); setIndex(j); save(j); nav(TOUR[j].path); }, [nav]);
  const start = useCallback((at = 0) => go(at), [go]);
  const end = useCallback(() => { setIndex(null); save(null); }, []);
  const value = useMemo(() => ({ index, start, go, end }), [index, start, go, end]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useTour() { const c = useContext(Ctx); if (!c) throw new Error("useTour outside TourProvider"); return c; }

/** The tour card shown at the top of the page while the tour is on. */
export function TourBar() {
  const { index, go, end } = useTour();
  const loc = useLocation();
  const [hidden, setHidden] = useState(false);
  useEffect(() => setHidden(false), [index]);
  if (index === null || hidden) return null;
  const s = TOUR[index];
  const here = loc.pathname === s.path;
  return (
    <section className="card mb-5 overflow-hidden border-info-line" aria-label="User guide">
      <div className="flex flex-wrap items-center gap-2 border-b border-info-line bg-info-soft px-4 py-2.5">
        <Compass className="h-4 w-4 text-info" />
        <span className="text-[12px] font-semibold uppercase tracking-wider text-info">User guide · step {index + 1} of {TOUR.length}</span>
        <div className="ml-auto flex items-center gap-1" aria-hidden>{TOUR.map((_, i) => <span key={i} className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-primary" : i < index ? "w-1.5 bg-primary/50" : "w-1.5 bg-line-strong"}`} />)}</div>
        <button className="btn-icon h-7 w-7" aria-label="Close the guide" title="Close the guide" onClick={end}><X className="h-4 w-4" /></button>
      </div>
      <div className="grid gap-x-6 gap-y-3 px-4 py-3.5 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div>
          <h2 className="text-[15px] font-semibold text-ink">{s.title}</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">{s.body}</p>
          {s.tryThis && <p className="mt-2 text-[13px] text-ink"><span className="font-semibold text-info">Try this: </span>{s.tryThis}</p>}
        </div>
        <div>
          <div className="text-[12px] font-medium text-faint">What to look at</div>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-[13px] text-muted marker:text-info">{s.look.map((l) => <li key={l}>{l}</li>)}</ul>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-line px-4 py-2.5">
        {!here && <button className="btn btn-sm" onClick={() => go(index)}>Back to this step</button>}
        <button className="btn-ghost btn-sm" onClick={() => setHidden(true)}>Hide for now</button>
        <div className="ml-auto flex gap-2">
          <button className="btn btn-sm" disabled={index === 0} onClick={() => go(index - 1)}><ArrowLeft className="h-4 w-4" />Back</button>
          {index < TOUR.length - 1
            ? <button className="btn-primary btn-sm" onClick={() => go(index + 1)}>Next: {TOUR[index + 1].title}<ArrowRight className="h-4 w-4" /></button>
            : <button className="btn-primary btn-sm" onClick={end}>Finish the guide</button>}
        </div>
      </div>
    </section>
  );
}

/** First-visit welcome: offers the tour once. */
export function Welcome() {
  const { start, index } = useTour();
  const [open, setOpen] = useState(() => { try { return !localStorage.getItem("ss-welcome"); } catch { return false; } });
  const close = () => { setOpen(false); try { localStorage.setItem("ss-welcome", "1"); } catch { /* storage blocked */ } };
  if (!open || index !== null) return null;
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center p-4">
      <div className="dialog-backdrop absolute inset-0" onClick={close} />
      <div className="dialog-panel relative w-full max-w-lg p-6" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
        <img src="/brand/mark.svg" alt="" className="h-11 w-11 rounded-xl bg-brand p-1" />
        <h2 id="welcome-title" className="mt-3 text-[18px] font-semibold tracking-tight text-ink">Welcome to SlateStream</h2>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">An interactive look at one question: should a video recommender chase the next click, or plan for the whole session? You can replay real recorded sessions of simulated viewers and see what the experiments found.</p>
        <ul className="mt-3 space-y-1.5 text-[13px] text-muted">
          <li><b className="font-medium text-ink">Guided tour:</b> {TOUR.length} short steps, about 3 minutes.</li>
          <li><b className="font-medium text-ink">Underlined words</b> explain themselves when you hover or tap them.</li>
          <li><b className="font-medium text-ink">Every page</b> has a "How to read this page" panel at the top.</li>
        </ul>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button className="btn" onClick={close}>Explore on my own</button>
          <button className="btn-primary" onClick={() => { close(); start(0); }}><Compass className="h-4 w-4" />Start the guided tour</button>
        </div>
      </div>
    </div>
  );
}
