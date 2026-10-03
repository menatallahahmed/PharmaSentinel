/** §03 Agent Investigation — lightweight pipeline with collapsible reasoning. */
import { ChevronRight, Network } from "lucide-react";
import type { AgentOutput } from "@/lib/types";
import { cn } from "@/lib/utils";

export function Agents({ agents, activeIndex }: { agents: AgentOutput[]; activeIndex?: number | undefined }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        <Network className="h-3.5 w-3.5" aria-hidden /><span className="font-mono">Omnigent</span><span>coordinates →</span>
        {agents.map((a, i) => (
          <span key={a.id} className="flex items-center gap-1">
            <span className={cn("rounded border border-border px-1.5 py-0.5 font-mono", activeIndex === i && "border-primary text-primary")}>{a.name.replace(" Agent", "")}</span>
            {i < agents.length - 1 && <ChevronRight className="h-3 w-3" aria-hidden />}
          </span>
        ))}
      </div>
      <div className="grid gap-2 md:grid-cols-5">
        {agents.map((a, i) => (
          <details key={a.id} className="panel group p-3 text-sm" open={i === 1 || i === 4}>
            <summary className="cursor-pointer list-none">
              <div className="flex items-center justify-between"><span className="eyebrow">{String(i + 1).padStart(2, "0")} · {a.name}</span><ChevronRight className="h-3.5 w-3.5 transition group-open:rotate-90" aria-hidden /></div>
              <p className="mt-1 font-medium leading-snug">{a.summary}</p>
            </summary>
            <ol className="mt-2 space-y-1 border-l border-border pl-3 text-xs text-muted-foreground">
              {a.reasoning.map((r, j) => <li key={j}>{r}</li>)}
            </ol>
            <p className="mt-2 text-xs"><span className="eyebrow">Conclusion </span>{a.conclusion}</p>
            <p className="tnum mt-1 text-[11px] text-muted-foreground">conf {(a.confidence * 100).toFixed(0)}% · {a.evidenceIds.join(", ") || "—"}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
