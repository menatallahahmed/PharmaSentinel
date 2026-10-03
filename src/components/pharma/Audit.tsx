/** §07 Evidence / Audit — every claim linked to simulation data + agent. */
import type { AnalysisResult } from "@/lib/types";

export function Audit({ data }: { data: AnalysisResult }) {
  const lookup = (materialId?: string, day?: number, metric?: string) => {
    const s = data.simulation.series.find((x) => x.materialId === materialId);
    const p = s?.points.find((x) => x.day === day);
    return p && metric ? `${(p as unknown as Record<string, number>)[metric]} ${data.experiment.materials.find((m) => m.id === materialId)?.unit ?? ""}` : "—";
  };
  return (
    <div className="panel overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <thead><tr className="border-b border-border text-left">
          {["ID", "Claim", "Source", "Agent", "Material · day", "Metric", "Simulated value"].map((h) => <th key={h} className="eyebrow px-3 py-2">{h}</th>)}
        </tr></thead>
        <tbody>
          {data.evidence.map((e) => (
            <tr key={e.id} className="border-b border-border last:border-0">
              <td className="tnum px-3 py-2">{e.id}</td>
              <td className="px-3">{e.claim}</td>
              <td className="px-3 font-mono text-xs">{e.source}</td>
              <td className="px-3 text-xs">{data.agents.find((a) => a.id === e.agentId)?.name}</td>
              <td className="tnum px-3 text-xs">{e.materialId ? `${e.materialId} · d${e.day}` : "—"}</td>
              <td className="px-3 font-mono text-xs">{e.metric ?? "—"}</td>
              <td className="tnum px-3 font-semibold">{lookup(e.materialId, e.day, e.metric)}</td>
            </tr>
          ))}
          {data.evidence.length === 0 && <tr><td colSpan={7} className="px-3 py-3 text-muted-foreground">No evidence items returned.</td></tr>}
        </tbody>
      </table>
      <div className="tnum border-t border-border px-3 py-2 text-xs text-muted-foreground">run {data.runId} · generated {new Date(data.generatedAt).toLocaleString()} · deterministic simulation, reproducible from experiment inputs</div>
    </div>
  );
}
