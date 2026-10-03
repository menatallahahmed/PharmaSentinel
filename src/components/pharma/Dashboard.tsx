/** §02 Feasibility Dashboard — verdict, KPIs, main chart. */
import { useState } from "react";
import type { AnalysisResult } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Spark, StockChart } from "./StockChart";
import { StatusBadge, VERDICT_META } from "./ui";

export function Dashboard({ data }: { data: AnalysisResult }) {
  const { simulation: sim, experiment: exp } = data;
  const [sel, setSel] = useState(sim.limitingMaterialId ?? exp.materials[0]!.id);
  const matOf = (id: string | null) => exp.materials.find((m) => m.id === id);
  const lim = matOf(sim.limitingMaterialId);
  const series = sim.series.find((s) => s.materialId === sel) ?? sim.series[0]!;
  const meta = VERDICT_META[sim.verdict];
  const kpis = [
    ["Materials monitored", sim.kpis.materialsMonitored],
    ["Critical at risk", sim.kpis.criticalAtRisk],
    ["Safety-stock violations", sim.kpis.safetyStockViolations],
    ["Expiry risks", sim.kpis.expiryRisks],
    ["Projected waste", `$${sim.kpis.projectedWasteCost.toLocaleString()}`],
  ] as const;

  return (
    <div className="grid gap-3 lg:grid-cols-[320px_1fr]">
      <div className={cn("panel border-l-4 p-4", meta.border, meta.bg)}>
        <div className="eyebrow">Can this experiment stay feasible?</div>
        <div className="mt-3"><StatusBadge verdict={sim.verdict} size="lg" /></div>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-2"><dt className="text-muted-foreground">First problem day</dt><dd className="tnum font-semibold">{sim.firstProblemDay ? `Day ${sim.firstProblemDay}` : "None"}</dd></div>
          <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Limiting material</dt><dd className="text-right font-semibold">{lim?.name ?? "—"}</dd></div>
          <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Window</dt><dd className="tnum">d{exp.startDay}–d{exp.startDay + exp.durationDays - 1}</dd></div>
        </dl>
        <p className="mt-3 border-t border-border pt-3 text-sm">{data.agents.find((a) => a.id === "hypothesis")?.conclusion}</p>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {kpis.map(([l, v]) => (
            <div key={l} className="panel px-3 py-2"><div className="eyebrow">{l}</div><div className="tnum mt-1 text-2xl font-semibold">{v}</div></div>
          ))}
        </div>
        <div className="panel p-3">
          <div className="mb-1 flex items-baseline justify-between">
            <div className="text-sm font-semibold">{matOf(sel)?.name} <span className="font-normal text-muted-foreground">· projected stock ({matOf(sel)?.unit})</span></div>
            <div className="eyebrow hidden sm:block">— stock · ┄ safety · ▲ arrival · ✕ expiry</div>
          </div>
          <StockChart series={series} material={matOf(sel)!} firstProblemDay={sim.firstProblemDay} />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3 lg:col-span-2 lg:grid-cols-7" role="tablist" aria-label="Select material">
        {sim.series.map((s) => {
          const m = matOf(s.materialId)!;
          const st = s.points.some((p) => p.status === "stockout") ? "INFEASIBLE" : s.firstProblemDay ? "AT_RISK" : "FEASIBLE";
          return (
            <button key={s.materialId} role="tab" aria-selected={sel === s.materialId} onClick={() => setSel(s.materialId)}
              className={cn("panel p-2 text-left transition hover:border-primary", sel === s.materialId && "border-primary ring-1 ring-primary")}>
              <div className="truncate text-xs font-medium">{m.name}</div>
              <Spark series={s} />
              <StatusBadge verdict={st} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
