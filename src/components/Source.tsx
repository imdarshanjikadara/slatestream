// "Source: <file>" links to the exact result file in the study repository on GitHub.
import { ExternalLink } from "lucide-react";
import { STUDY_BLOB } from "@/lib/data";

export function Source({ files, className = "" }: { files: string[]; className?: string }) {
  return (
    <p className={`flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-faint ${className}`}>
      <span>Source:</span>
      {files.map((f, i) => (
        <a key={f} href={STUDY_BLOB + f} target="_blank" rel="noopener noreferrer" className="inline-flex min-w-0 items-center gap-0.5 break-all font-mono text-[11.5px] text-info hover:underline">
          {f}<ExternalLink className="h-3 w-3" aria-hidden />{i < files.length - 1 && <span className="text-faint">,</span>}
        </a>))}
    </p>
  );
}
