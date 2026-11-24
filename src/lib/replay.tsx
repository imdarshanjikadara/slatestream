// Shared replay state for Watch, Race and Taste: which recorded viewer, the current step, play / pause and speed.
// The viewer lives in the URL (?viewer=3), so a link opens the same session; the step is kept while moving between pages.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

type Replay = {
  viewer: number; seed: number; ep: number; setViewer: (v: number) => void;
  t: number; setT: (t: number) => void; max: number; setMax: (m: number) => void;
  playing: boolean; play: () => void; pause: () => void; speed: number; setSpeed: (s: number) => void; stepMs: number;
};
const Ctx = createContext<Replay | null>(null);
export const PER_SEED = 5;

export function ReplayProvider({ children, seeds = [0, 1, 2, 3, 4] }: { children: React.ReactNode; seeds?: number[] }) {
  const [sp, setSp] = useSearchParams();
  const count = seeds.length * PER_SEED;
  const viewer = Math.min(count, Math.max(1, Number(sp.get("viewer")) || 1));
  const seed = seeds[Math.floor((viewer - 1) / PER_SEED)] ?? 0, ep = (viewer - 1) % PER_SEED;
  const [t, setTRaw] = useState(0);
  const [max, setMax] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const stepMs = 900 / speed;
  const setT = useCallback((v: number) => setTRaw(Math.max(0, Math.min(v, max))), [max]);
  const setViewer = useCallback((v: number) => {
    setPlaying(false); setTRaw(0);
    setSp((prev) => { const n = new URLSearchParams(prev); if (v === 1) n.delete("viewer"); else n.set("viewer", String(v)); return n; }, { replace: true });
  }, [setSp]);
  const play = useCallback(() => { setTRaw((x) => (x >= max ? 0 : x)); setPlaying(true); }, [max]);
  const pause = useCallback(() => setPlaying(false), []);
  useEffect(() => {
    if (!playing) return;
    if (t >= max) { setPlaying(false); return; }
    const id = setTimeout(() => setTRaw((x) => Math.min(x + 1, max)), stepMs);
    return () => clearTimeout(id);
  }, [playing, t, max, stepMs]);
  useEffect(() => { if (t > max) setTRaw(max); }, [max, t]);
  const value = useMemo(() => ({ viewer, seed, ep, setViewer, t, setT, max, setMax, playing, play, pause, speed, setSpeed, stepMs }),
    [viewer, seed, ep, setViewer, t, setT, max, playing, play, pause, speed, stepMs]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useReplay() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useReplay outside ReplayProvider");
  return c;
}
