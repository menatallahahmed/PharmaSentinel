/** §04 Simulation & Scenario Comparison — base vs what-if runs. */
import type { AnalysisResult } from "@/lib/types";
import { StatusBadge } from "./ui";

export function Scenarios({ data }: { data: AnalysisResult }) {
  const name = (id: string | null) => data.experiment.materials.find((m) => m.id === id)?.name ?? "—";
  const rows = [
    { id: "BASE", name: "Base case (as planned)", verdict: data.simulation.verdict, firstProblemDay: data.simulation.firstProblemDay, limitingMaterialId: data.simulation.limitingMaterialId, learning: "Reference run.", tradeOffs: [] as string[], costDelta: 0 },
    ...data.scenarios,
  ];
  return (
    <div className="panel overflow-x-auto">
      <table className="w-full min-w-[800px] text-sm">
        <thead><tr className="border-b border-border text-left">
          {["Scenario", "Verdict", "First problem", "Limiting", "Learning", "Trade-offs", "Δ cost"].map((h) => <th key={h} className="eyebrow px-3 py-2">{h}</th>)}
        </tr></thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.id} className={`border-b border-border last:border-0 ${s.id === data.plannedOutcome.scenarioId ? "bg-accent" : ""}`}>
              <td className="px-3 py-2"><span className="tnum mr-2 text-muted-foreground">{s.id}</span>{s.name}</td>
              <td className="px-3"><StatusBadge verdict={s.verdict} /></td>
              <td className="tnum px-3">{s.firstProblemDay ? `Day ${s.firstProblemDay}` : "None"}</td>
              <td className="px-3 text-xs">{name(s.limitingMaterialId)}</td>
              <td className="px-3 text-xs">{s.learning}</td>
              <td className="px-3 text-xs text-muted-foreground">{s.tradeOffs.join(" · ") || "—"}</td>
              <td className="tnum px-3 text-right">{s.costDelta ? `+$${s.costDelta}` : "$0"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
