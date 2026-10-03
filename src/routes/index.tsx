import { createFileRoute } from "@tanstack/react-router";
import { FlaskConical, Moon, Plus, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { listExperiments, runAnalysis, submitDecision } from "@/lib/api";
import type { AnalysisResult, ApprovalRecord, Experiment } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ExperimentInput } from "@/components/pharma/ExperimentInput";
import { Dashboard } from "@/components/pharma/Dashboard";
import { Agents } from "@/components/pharma/Agents";
import { Scenarios } from "@/components/pharma/Scenarios";
import { Approval, Plan } from "@/components/pharma/PlanApproval";
import { Audit } from "@/components/pharma/Audit";
import { Section, StatusBadge } from "@/components/pharma/ui";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PharmaSentinel — Experimental Feasibility Intelligence" },
      { name: "description", content: "Simulate reagent use, waste, expiry and resupply day by day to see if a lab experiment stays feasible." },
      { property: "og:title", content: "PharmaSentinel — Experimental Feasibility Intelligence" },
      { property: "og:description", content: "Agentic day-by-day feasibility simulation for lab experiments, with human approval." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => listExperiments(),
  component: Index,
});

const NAV = [
  ["input", "Experiment input"], ["dashboard", "Feasibility"], ["agents", "Agent investigation"],
  ["scenarios", "Scenarios"], ["plan", "Recommended plan"], ["approval", "Human approval"], ["audit", "Evidence / audit"],
] as const;
const AGENT_STEPS = ["Evidence", "Hypothesis", "Experiment", "Critic", "Planner"];

function Index() {
  const initial = Route.useLoaderData();
  const [experiments, setExperiments] = useState<Experiment[]>(initial);
  const [selId, setSelId] = useState(initial[0]!.id);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [approvals, setApprovals] = useState<ApprovalRecord[]>([]);
  const [dark, setDark] = useState(false);
  const exp = experiments.find((e) => e.id === selId)!;

  useEffect(() => { setDark(localStorage.getItem("ps-theme") === "dark"); }, []);
  useEffect(() => { document.documentElement.classList.toggle("dark", dark); localStorage.setItem("ps-theme", dark ? "dark" : "light"); }, [dark]);

  const run = async (e: Experiment = exp) => {
    setProgress(0);
    const r = await runAnalysis(e, setProgress);
    setResult(r); setApprovals(r.approvals); setProgress(null);
  };
  useEffect(() => { run(exp); /* auto-run on experiment switch for demo */ // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selId]);

  const update = (e: Experiment) => setExperiments((xs) => xs.map((x) => (x.id === e.id ? e : x)));
  const createNew = () => {
    const e: Experiment = { id: `exp-${Date.now()}`, title: "New experiment", description: "", durationDays: 14, startDay: 1, deadlineDay: null, materials: [] };
    setExperiments((xs) => [...xs, e]); setSelId(e.id);
  };
  const decide = async (decision: ApprovalRecord["decision"], by: string, note: string) => {
    if (!result) return;
    const rec = await submitDecision(result.runId, exp.id, { decision, by, note: note || undefined, planSummary: result.recommendations.map((r) => r.action).join("; ") });
    setApprovals((a) => [rec, ...a]);
  };
  const running = progress !== null;
  const stale = result && result.experiment.id !== exp.id;

  return (
    <div className="flex min-h-screen w-full">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-4 lg:flex">
        <div className="flex items-center gap-2"><FlaskConical className="h-5 w-5 text-primary" aria-hidden /><span className="font-semibold tracking-tight">PharmaSentinel</span></div>
        <p className="mt-1 text-xs text-muted-foreground">Experimental feasibility & resource risk intelligence</p>
        <div className="eyebrow mt-6 mb-2">Experiments</div>
        <ul className="space-y-1">
          {experiments.map((e) => (
            <li key={e.id}>
              <button onClick={() => setSelId(e.id)} className={cn("w-full rounded px-2 py-1.5 text-left text-sm hover:bg-sidebar-accent", e.id === selId && "bg-sidebar-accent font-medium")}>{e.title}</button>
            </li>
          ))}
        </ul>
        <button onClick={createNew} className="mt-2 flex items-center gap-1 rounded px-2 py-1.5 text-sm text-primary hover:bg-sidebar-accent"><Plus className="h-4 w-4" /> New experiment</button>
        <nav aria-label="Sections" className="mt-6">
          <div className="eyebrow mb-2">Sections</div>
          <ol className="space-y-0.5 text-sm">
            {NAV.map(([id, l], i) => <li key={id}><a href={`#${id}`} className="flex gap-2 rounded px-2 py-1 hover:bg-sidebar-accent"><span className="tnum text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>{l}</a></li>)}
          </ol>
        </nav>
        <button onClick={() => setDark((d) => !d)} className="mt-auto flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-sidebar-accent" aria-label="Toggle colour theme">
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />} {dark ? "Light mode" : "Dark mode"}
        </button>
      </aside>

      <main className="min-w-0 flex-1">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-background/90 px-4 py-2 backdrop-blur lg:px-6">
          <select aria-label="Experiment" className="field max-w-xs lg:hidden" value={selId} onChange={(e) => setSelId(e.target.value)}>
            {experiments.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
          </select>
          <div className="hidden min-w-0 truncate text-sm font-medium lg:block">{exp.title}</div>
          <div className="flex items-center gap-2 text-xs" aria-live="polite">
            {running ? (
              <span className="flex items-center gap-1 font-mono">
                {AGENT_STEPS.map((s, i) => <span key={s} className={cn("rounded px-1.5 py-0.5", i < progress! ? "bg-accent text-accent-foreground" : i === progress ? "animate-pulse bg-primary text-primary-foreground" : "text-muted-foreground")}>{s}</span>)}
              </span>
            ) : result && !stale ? <StatusBadge verdict={result.simulation.verdict} /> : null}
          </div>
        </div>

        <div className="mx-auto max-w-[1400px] space-y-10 p-4 lg:p-6">
          <Section id="input" index={1} title="Experiment input" hint="Edit the plan and materials, then re-run the analysis.">
            <ExperimentInput exp={exp} onChange={update} onRun={() => run()} running={running} />
          </Section>
          {result && !stale && (
            <Section id="dashboard" index={2} title="Feasibility dashboard" hint="Day-by-day projected stock for every material across the experiment window.">
              <div className={cn(running && "opacity-50 transition")}><Dashboard key={result.runId} data={result} /></div>
            </Section>
          )}
          {result && !stale && (<>
            <Section id="agents" index={3} title="Agent investigation" hint="Why is the experiment at risk? Supporting reasoning trail."><Agents agents={result.agents} activeIndex={progress ?? undefined} /></Section>
            <Section id="scenarios" index={4} title="Simulation & scenario comparison"><Scenarios data={result} /></Section>
            <Section id="plan" index={5} title="Recommended plan" hint="Scientific Planner output — before / after feasibility per action."><Plan data={result} /></Section>
            <Section id="approval" index={6} title="Human approval"><Approval data={result} records={approvals} onDecide={decide} /></Section>
            <Section id="audit" index={7} title="Evidence / audit" hint="Each conclusion traced to the simulated value that supports it."><Audit data={result} /></Section>
          </>)}
        </div>
      </main>
    </div>
  );
}
