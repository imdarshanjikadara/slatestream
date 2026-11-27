// App shell: navy sidebar listing the pages in reading order, plus About and the code link.
// Phones get a top bar and a slide-in menu.
import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { BookOpen, Code2, Compass, Flag, FlaskConical, Home, Menu, MonitorPlay, Palette, Table2, X } from "lucide-react";
import { ErrorBoundary } from "./ErrorBoundary";
import { TourBar, useTour } from "@/lib/tour";

type Item = { to: string; label: string; icon: React.ComponentType<{ className?: string }> };
const STEPS: Item[] = [
  { to: "/", label: "Start", icon: Home },
  { to: "/watch", label: "Watch a session", icon: MonitorPlay },
  { to: "/race", label: "Compare all four", icon: Flag },
  { to: "/taste", label: "Viewer tastes", icon: Palette },
  { to: "/findings", label: "Results", icon: FlaskConical },
];
const MORE: Item[] = [
  { to: "/comparisons", label: "All numbers", icon: Table2 },
  { to: "/guide", label: "About the project", icon: BookOpen },
];
export const STUDY_REPO = "https://github.com/imdarshanjikadara/slateq-recsim-study";

const itemClass = (active: boolean) => `group flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13.5px] transition ${active ? "bg-white/15 font-medium text-white" : "text-white/75 hover:bg-white/[0.08] hover:text-white"}`;
const iconClass = (active: boolean) => `h-[18px] w-[18px] shrink-0 ${active ? "text-white" : "text-white/55 group-hover:text-white/85"}`;

export function Layout() {
  const [open, setOpen] = useState(false);
  const tour = useTour();
  const loc = useLocation();
  useEffect(() => setOpen(false), [loc.pathname]);
  useEffect(() => { window.scrollTo(0, 0); }, [loc.pathname]);
  const all = [...STEPS, ...MORE];
  const current = all.filter((i) => (i.to === "/" ? loc.pathname === "/" : loc.pathname.startsWith(i.to))).sort((a, b) => b.to.length - a.to.length)[0];
  useEffect(() => { document.title = current && current.to !== "/" ? `${current.label} · SlateStream` : "SlateStream"; }, [current]);
  const search = loc.search; // keep ?viewer= when moving between pages

  const link = (i: Item, n?: number) => {
    const Icon = i.icon, active = i === current;
    return (
      <NavLink key={i.to} to={{ pathname: i.to, search }} aria-current={active ? "page" : undefined} className={itemClass(active)}>
        <Icon className={iconClass(active)} /><span className="flex-1">{i.label}</span>
        {n !== undefined && <span className={`text-[11px] tabular-nums ${active ? "text-white/80" : "text-white/35"}`}>{n}</span>}
      </NavLink>);
  };

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <div className="min-h-screen lg:flex">
        <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-surface px-4 lg:hidden">
          <button onClick={() => setOpen(true)} className="btn btn-sm w-9 px-0" aria-label="Menu"><Menu className="h-4 w-4" /></button>
          <div className="min-w-0 truncate text-[14px] font-semibold text-ink">{current?.label ?? "SlateStream"}</div>
        </div>
        {open && <div className="dialog-backdrop fixed inset-0 z-40 lg:hidden" onClick={() => setOpen(false)} />}
        <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-brand transition-transform lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
          {open && <button className="absolute right-2 top-4 rounded-lg p-1.5 text-white/70 hover:bg-white/10 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X className="h-4 w-4" /></button>}
          <Link to="/" className="flex h-16 items-center gap-2.5 border-b border-white/10 px-5" aria-label="SlateStream, start page">
            <img src="/brand/mark.svg" alt="" className="h-9 w-9 shrink-0" />
            <div className="leading-tight"><div className="text-[14px] font-bold tracking-[0.08em] text-[#93c5fd]">SLATESTREAM</div><div className="text-[11px] text-white/60">SlateQ vs click-chasing</div></div>
          </Link>
          <nav className="scroll-on-brand flex-1 overflow-y-auto px-3 py-3" aria-label="Main">
            <button type="button" onClick={() => (tour.index === null ? tour.start(0) : tour.go(tour.index))} className={`${itemClass(tour.index !== null)} mb-3 w-full border border-white/15`}><Compass className={iconClass(tour.index !== null)} /><span className="flex-1 text-left">{tour.index === null ? "User guide" : `User guide · step ${tour.index + 1}`}</span></button>
            <div className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/50">Walk through</div>
            <div className="mb-4">{STEPS.map((s, i) => link(s, i + 1))}</div>
            <div className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/50">More</div>
            {MORE.map((s) => link(s))}
            <a href={STUDY_REPO} target="_blank" rel="noopener noreferrer" className={itemClass(false)}><Code2 className={iconClass(false)} />Code and data</a>
          </nav>
          <div className="border-t border-white/10 px-5 py-4 text-[12px] leading-snug text-white/55">
            <div className="text-white/80">Darshankumar Jikadara</div>
            CSCI 5933 Reinforcement Learning<br />University of Colorado Denver
          </div>
        </aside>
        <main id="main" tabIndex={-1} className="min-w-0 flex-1 px-4 py-5 outline-none sm:px-6 lg:px-8 lg:py-7">
          <div className="mx-auto max-w-[1500px]"><TourBar /><ErrorBoundary key={loc.pathname}><Outlet /></ErrorBoundary></div>
        </main>
      </div>
    </>
  );
}
