/**
 * Mock backend simulation engine (stands in for the Python service).
 * Day-by-day FIFO-by-expiry model: arrivals → expiry → consumption (incl. waste).
 */
import type { DayPoint, Experiment, Material, MaterialPatch, MaterialSeries, Simulation, Verdict } from "./types";

const r = (n: number) => Math.round(n * 100) / 100;

function simulateMaterial(m: Material, exp: Experiment): MaterialSeries {
  let lots = [{ qty: m.currentInventory, expiry: m.expiryDay }];
  const points: DayPoint[] = [];
  const end = exp.startDay + exp.durationDays - 1;
  for (let day = exp.startDay; day <= end; day++) {
    let arrived = 0, expired = 0;
    for (const s of m.incomingShipments) if (s.arrivalDay === day) {
      arrived += s.quantity;
      lots.push({ qty: s.quantity, expiry: day + m.shelfLifeDays });
    }
    lots = lots.filter((l) => { if (l.expiry <= day) { expired += l.qty; return false; } return true; });
    lots.sort((a, b) => a.expiry - b.expiry);
    const need = m.dailyConsumption * (1 + m.wastePct / 100);
    let remaining = need;
    for (const l of lots) { const take = Math.min(l.qty, remaining); l.qty -= take; remaining -= take; }
    lots = lots.filter((l) => l.qty > 1e-9);
    const stock = lots.reduce((s, l) => s + l.qty, 0);
    const consumed = need - remaining;
    const status = remaining > 1e-9 ? "stockout" : stock < m.safetyStock ? "below_safety" : "ok";
    points.push({ day, stock: r(stock), arrived, expired: r(expired), consumed: r(consumed), wasted: r(consumed * (m.wastePct / (100 + m.wastePct))), shortfall: r(remaining), status });
  }
  const first = points.find((p) => p.status !== "ok");
  return { materialId: m.id, safetyStock: m.safetyStock, points, firstProblemDay: first?.day ?? null, firstProblemType: first?.status ?? null, expiryInWindow: points.some((p) => p.expired > 0) };
}

export function simulate(exp: Experiment): Simulation {
  const series = exp.materials.map((m) => simulateMaterial(m, exp));
  const byId = Object.fromEntries(exp.materials.map((m) => [m.id, m]));
  const critStockout = series.filter((s) => byId[s.materialId]!.critical && s.points.some((p) => p.status === "stockout"));
  const anyProblem = series.filter((s) => s.firstProblemDay !== null || s.expiryInWindow);
  const verdict: Verdict = critStockout.length ? "INFEASIBLE" : anyProblem.some((s) => s.firstProblemDay !== null) ? "AT_RISK" : "FEASIBLE";
  const pool = critStockout.length ? critStockout : series.filter((s) => s.firstProblemDay !== null);
  const limiting = [...pool].sort((a, b) => (a.firstProblemDay ?? 1e9) - (b.firstProblemDay ?? 1e9))[0];
  const firstProblemDay = series.reduce<number | null>((min, s) => s.firstProblemDay !== null && (min === null || s.firstProblemDay < min) ? s.firstProblemDay : min, null);
  const wasteCost = series.reduce((sum, s) => sum + s.points.reduce((a, p) => a + p.wasted + p.expired, 0) * byId[s.materialId]!.unitCost, 0);
  return {
    experimentId: exp.id, verdict, firstProblemDay, limitingMaterialId: limiting?.materialId ?? null, series,
    kpis: {
      materialsMonitored: exp.materials.length,
      criticalAtRisk: series.filter((s) => byId[s.materialId]!.critical && s.firstProblemDay !== null).length,
      safetyStockViolations: series.filter((s) => s.points.some((p) => p.status !== "ok")).length,
      expiryRisks: series.filter((s) => s.expiryInWindow).length,
      projectedWasteCost: Math.round(wasteCost),
    },
  };
}

export function applyPatches(exp: Experiment, patches: MaterialPatch[]): Experiment {
  return {
    ...exp,
    materials: exp.materials.map((m) => {
      const ps = patches.filter((p) => p.materialId === m.id);
      return ps.reduce<Material>((acc, p) => ({
        ...acc, ...p.changes,
        incomingShipments: [...(p.replaceShipments ?? acc.incomingShipments), ...(p.addShipments ?? [])],
      }), m);
    }),
  };
}
