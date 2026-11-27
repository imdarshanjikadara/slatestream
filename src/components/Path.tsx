// The suggested order through the site. Each page on the path shows "Step n of 5" and a button to the next page.
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";

export const PATH = [
  { to: "/", label: "Start" },
  { to: "/watch", label: "Watch a session" },
  { to: "/race", label: "Compare all four" },
  { to: "/taste", label: "Viewer tastes" },
  { to: "/findings", label: "Results" },
];

export function StepLabel({ to }: { to: string }) {
  const i = PATH.findIndex((p) => p.to === to);
  if (i < 0) return null;
  return <div className="mb-1 text-[12px] font-medium text-info">Step {i + 1} of {PATH.length}</div>;
}

export function NextStep({ to }: { to: string }) {
  const { search } = useLocation();
  const i = PATH.findIndex((p) => p.to === to);
  const prev = PATH[i - 1], next = PATH[i + 1];
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
      {prev && <Link to={{ pathname: prev.to, search }} className="btn"><ArrowLeft className="h-4 w-4" />{prev.label}</Link>}
      {next && <Link to={{ pathname: next.to, search }} className="btn-primary ml-auto">Next: {next.label}<ArrowRight className="h-4 w-4" /></Link>}
    </div>
  );
}
