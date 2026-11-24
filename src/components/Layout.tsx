// App shell: navy sidebar with grouped navigation (Overview; REPLAY; RESULTS), the guide and the study link pinned
// at the bottom. Active item is a soft fill, never a side bar. Phones get a top bar and a slide-in menu.
import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { ErrorBoundary } from "./ErrorBoundary";
import { TourBar, Welcome, useTour } from "@/lib/tour";
import { BookOpen, Code2, Compass, Flag, FlaskConical, LayoutDashboard, Menu, MonitorPlay, Palette, Table2, X } from "lucide-react";

type Item = { to: string; label: string; icon: React.ComponentType<{ className?: string }> };
export const NAV: { group: string | null; items: Item[] }[] = [
  { group: null, items: [{ to: "/", label: "Overview", icon: LayoutDashboard }] },
  { group: "Replay", items: [
    { to: "/watch", label: "Watch side by side", icon: MonitorPlay },
    { to: "/race", label: "Watch-time race", icon: Flag },
    { to: "/taste", label: "Taste profile", icon: Palette },
  ] },
  { group: "Results", items: [
    { to: "/findings", label: "Findings", icon: FlaskConical },
    { to: "/comparisons", label: "All comparisons", icon: Table2 },
  ] },
];
export const STUDY_REPO = "https://github.com/imdarshanjikadara/slateq-recsim-study";

function Brand() {
  return (
    <Link to="/" className="flex h-16 items-center gap-2.5 border-b border-white/10 px-5" aria-label="SlateStream, home">
      <img src="/brand/mark.svg" alt="" className="h-9 w-9 shrink-0" />
      <div className="leading-tight"><div className="text-[14px] font-bold tracking-[0.08em] text-[#93c5fd]">SLATESTREAM</div><div className="text-[11px] text-white/60">Recommender study</div></div>
    </Link>
  );
}

const itemClass = (active: boolean) => `group flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13.5px] transition ${active ? "bg-white/10 font-medium text-white" : "text-white/75 hover:bg-white/[0.07] hover:text-white"}`;
const iconClass = (active: boolean) => `h-[18px] w-[18px] shrink-0 ${active ? "text-primary" : "text-white/50 group-hover:text-white/80"}`;

export function Layout() {
  const [open, setOpen] = useState(false);
  const tour = useTour();
  const loc = useLocation();
  useEffect(() => setOpen(false), [loc.pathname]);
  useEffect(() => { document.getElementById("main")?.scrollTo?.(0, 0); window.scrollTo(0, 0); }, [loc.pathname]);
  const all = NAV.flatMap((g) => g.items);
  const current = all.filter((i) => (i.to === "/" ? loc.pathname === "/" : loc.pathname.startsWith(i.to))).sort((a, b) => b.to.length - a.to.length)[0];
  const onGuide = loc.pathname.startsWith("/guide");
  useEffect(() => { document.title = `${onGuide ? "How it works" : current?.label ?? "SlateStream"} · SlateStream`; }, [current, onGuide]);
  const search = loc.search; // keep ?viewer= when moving between pages

  const nav = (
    <nav className="scroll-on-brand flex-1 overflow-y-auto px-3 py-3" aria-label="Main">
      {NAV.map((g, gi) => (
        <div key={gi} className="mb-4">
          {g.group && <div className="flex items-center gap-2 px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/50">{g.group}<span className="h-px flex-1 bg-white/10" /></div>}
          {g.items.map((i) => {
            const Icon = i.icon, active = i === current;
            return <NavLink key={i.to} to={{ pathname: i.to, search }} aria-current={active ? "page" : undefined} className={itemClass(active)}><Icon className={iconClass(active)} />{i.label}</NavLink>;
          })}
        </div>))}
    </nav>
  );
  const footer = (
    <div className="border-t border-white/10 p-3">
      <button type="button" onClick={() => (tour.index === null ? tour.start(0) : tour.go(tour.index))} className={`${itemClass(tour.index !== null)} mb-0.5 w-full`}><Compass className={iconClass(tour.index !== null)} />{tour.index === null ? "Guided tour" : `Guided tour · ${tour.index + 1}`}</button>
      <NavLink to="/guide" aria-current={onGuide ? "page" : undefined} className={`${itemClass(onGuide)} mb-0.5`}><BookOpen className={iconClass(onGuide)} />How it works</NavLink>
      <a href={STUDY_REPO} target="_blank" rel="noopener noreferrer" className={itemClass(false)}><Code2 className={iconClass(false)} />Study code and data</a>
      <div className="mt-3 flex items-center gap-2.5 rounded-lg px-2 py-1.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 text-[11px] font-semibold text-white">RL</span>
        <div className="min-w-0 leading-tight"><div className="truncate text-[13px] text-white">CSCI 5933 project</div><div className="truncate text-[11.5px] text-white/50">Simulated viewers only</div></div>
      </div>
    </div>);

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <Welcome />
      <div className="min-h-screen lg:flex">
        <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-surface px-4 lg:hidden">
          <button onClick={() => setOpen(true)} className="btn btn-sm w-9 px-0" aria-label="Menu"><Menu className="h-4 w-4" /></button>
          <div className="min-w-0 truncate text-[14px] font-semibold text-ink">{onGuide ? "How it works" : current?.label ?? "SlateStream"}</div>
        </div>
        {open && <div className="dialog-backdrop fixed inset-0 z-40 lg:hidden" onClick={() => setOpen(false)} />}
        <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-brand transition-transform lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
          {open && <button className="absolute right-2 top-4 rounded-lg p-1.5 text-white/70 hover:bg-white/10 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X className="h-4 w-4" /></button>}
          <Brand />{nav}{footer}
        </aside>
        <main id="main" tabIndex={-1} className="min-w-0 flex-1 px-4 py-5 outline-none sm:px-6 lg:px-8 lg:py-7">
          <div className="mx-auto max-w-[1500px]"><TourBar /><ErrorBoundary key={loc.pathname}><Outlet /></ErrorBoundary></div>
        </main>
      </div>
    </>
  );
}
