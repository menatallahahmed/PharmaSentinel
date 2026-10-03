/** §05 Recommended Plan and §06 Human Approval. */
import { ArrowRight, Check, Pencil, X } from "lucide-react";
import { useState } from "react";
import type { AnalysisResult, ApprovalRecord } from "@/lib/types";
import { Btn, StatusBadge } from "./ui";

export function Plan({ data }: { data: AnalysisResult }) {
  const verdictOf = (id: string) => (id === "BASE" ? data.simulation.verdict : data.scenarios.find((s) => s.id === id)?.verdict ?? data.simulation.verdict);
  return (
    <div className="space-y-2">
      {data.recommendations.map((r, i) => (
        <div key={r.id} className="panel grid items-center gap-3 p-3 md:grid-cols-[auto_1fr_auto]">
          <div className="tnum flex h-8 w-8 items-center justify-center rounded bg-accent text-sm font-semibold text-accent-foreground">{i + 1}</div>
          <div>
            <div className="font-medium">{r.action}</div>
            <div className="text-xs text-muted-foreground">{r.rationale} · Owner: {r.owner} · Act by day {r.dueDay}</div>
          </div>
          <div className="flex items-center gap-2"><StatusBadge verdict={data.simulation.verdict} /><ArrowRight className="h-4 w-4 text-muted-foreground" aria-label="becomes" /><StatusBadge verdict={verdictOf(r.scenarioId)} /></div>
        </div>
      ))}
      <div className="panel flex flex-wrap items-center justify-between gap-2 border-primary p-3">
        <span className="text-sm font-semibold">Combined plan outcome</span>
        <div className="flex items-center gap-2"><StatusBadge verdict={data.simulation.verdict} /><ArrowRight className="h-4 w-4" aria-label="becomes" /><StatusBadge verdict={data.plannedOutcome.verdict} size="lg" /></div>
      </div>
    </div>
  );
}

export function Approval({ data, records, onDecide }: { data: AnalysisResult; records: ApprovalRecord[]; onDecide: (d: ApprovalRecord["decision"], by: string, note: string) => Promise<void> }) {
  const [by, setBy] = useState("Dr. M. Ahmed"); const [note, setNote] = useState(""); const [busy, setBusy] = useState(false);
  const decide = async (d: ApprovalRecord["decision"]) => { setBusy(true); await onDecide(d, by, note); setBusy(false); setNote(""); };
  const latest = records[0];
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <div className="panel space-y-3 p-4">
        <p className="text-sm">Approve the Scientific Planner's plan for <strong>{data.experiment.title}</strong> ({data.recommendations.length} action{data.recommendations.length > 1 ? "s" : ""}, projected <StatusBadge verdict={data.plannedOutcome.verdict} />).</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="text-xs"><span className="eyebrow">Reviewer</span><input className="field mt-1" value={by} onChange={(e) => setBy(e.target.value)} /></label>
          <label className="text-xs"><span className="eyebrow">Note (required to modify)</span><input className="field mt-1" value={note} onChange={(e) => setNote(e.target.value)} /></label>
        </div>
        <div className="flex flex-wrap gap-2">
          <Btn variant="approve" disabled={busy || !by} onClick={() => decide("APPROVED")}><Check className="h-4 w-4" /> Approve</Btn>
          <Btn disabled={busy || !by || !note} onClick={() => decide("MODIFIED")}><Pencil className="h-4 w-4" /> Modify</Btn>
          <Btn variant="reject" disabled={busy || !by} onClick={() => decide("REJECTED")}><X className="h-4 w-4" /> Reject</Btn>
        </div>
        {latest && <p className="text-sm" role="status">Current decision: <strong className="font-mono">{latest.decision}</strong> by {latest.by}</p>}
      </div>
      <div className="panel p-4">
        <div className="eyebrow mb-2">Decision audit record</div>
        {records.length === 0 ? <p className="text-sm text-muted-foreground">No decision recorded yet. Awaiting human review.</p> : (
          <ul className="space-y-2 text-sm">
            {records.map((r) => (
              <li key={r.id} className="border-l-2 border-primary pl-3">
                <div className="tnum text-xs text-muted-foreground">{r.id} · {new Date(r.at).toLocaleString()} · run {data.runId}</div>
                <div><strong className="font-mono">{r.decision}</strong> by {r.by} — {r.planSummary}</div>
                {r.note && <div className="text-xs text-muted-foreground">“{r.note}”</div>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
