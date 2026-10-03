/** Custom SVG stock-level chart: stock line, safety threshold, expiry, arrivals, first problem day. */
import type { Material, MaterialSeries } from "@/lib/types";

export function StockChart({ series, material, firstProblemDay, height = 260 }: { series: MaterialSeries; material: Material; firstProblemDay: number | null; height?: number }) {
  const W = 900, H = height, P = { l: 52, r: 16, t: 24, b: 30 };
  const pts = series.points;
  const p0 = pts[0]!, pN = pts[pts.length - 1]!;
  const days = [p0.day - 1, pN.day] as const;
  const maxY = Math.max(material.currentInventory, ...pts.map((p) => p.stock), series.safetyStock) * 1.1 || 1;
  const x = (d: number) => P.l + ((d - days[0]) / (days[1] - days[0])) * (W - P.l - P.r);
  const y = (v: number) => H - P.b - (v / maxY) * (H - P.t - P.b);
  const path = [`M${x(days[0])},${y(material.currentInventory)}`, ...pts.map((p) => `L${x(p.day)},${y(p.stock)}`)].join(" ");
  const outRanges = pts.filter((p) => p.status === "stockout");
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * maxY);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Projected stock of ${material.name}`}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} className="stroke-grid" />
          <text x={P.l - 6} y={y(t) + 3} textAnchor="end" className="fill-muted-foreground font-mono text-[10px]">{Math.round(t)}</text>
        </g>
      ))}
      {pts.map((p) => p.day % 2 === 1 && <text key={p.day} x={x(p.day)} y={H - 10} textAnchor="middle" className="fill-muted-foreground font-mono text-[10px]">d{p.day}</text>)}
      {/* stockout bands */}
      {outRanges.map((p) => <rect key={p.day} x={x(p.day - 1)} width={x(p.day) - x(p.day - 1)} y={P.t} height={H - P.t - P.b} className="fill-infeasible-soft" />)}
      {/* safety */}
      <line x1={P.l} x2={W - P.r} y1={y(series.safetyStock)} y2={y(series.safetyStock)} className="stroke-risk" strokeDasharray="5 4" strokeWidth={1.5} />
      <text x={W - P.r} y={y(series.safetyStock) - 4} textAnchor="end" className="fill-risk font-mono text-[10px]">safety {series.safetyStock} {material.unit}</text>
      {/* expiry & arrivals */}
      {pts.filter((p) => p.expired > 0).map((p) => (
        <g key={`e${p.day}`}>
          <line x1={x(p.day)} x2={x(p.day)} y1={P.t} y2={H - P.b} className="stroke-infeasible" strokeWidth={1.5} />
          <text x={x(p.day) + 4} y={P.t + 22} className="fill-infeasible font-mono text-[10px]">✕ lot expires −{p.expired}</text>
        </g>
      ))}
      {pts.filter((p) => p.arrived > 0).map((p) => (
        <g key={`a${p.day}`}>
          <line x1={x(p.day)} x2={x(p.day)} y1={P.t} y2={H - P.b} className="stroke-primary" strokeDasharray="2 3" />
          <text x={x(p.day) + 4} y={P.t + 36} className="fill-primary font-mono text-[10px]">▲ +{p.arrived} arrives</text>
        </g>
      ))}
      <path d={path} fill="none" className="stroke-foreground" strokeWidth={2} />
      {pts.map((p) => <circle key={p.day} cx={x(p.day)} cy={y(p.stock)} r={2.5} className={p.status === "ok" ? "fill-foreground" : p.status === "stockout" ? "fill-infeasible" : "fill-risk"} />)}
      {firstProblemDay !== null && series.firstProblemDay === firstProblemDay && (
        <g>
          <line x1={x(firstProblemDay)} x2={x(firstProblemDay)} y1={8} y2={H - P.b} className="stroke-infeasible" strokeWidth={2} />
          <rect x={x(firstProblemDay) - 80} y={2} width={160} height={16} rx={2} className="fill-infeasible" />
          <text x={x(firstProblemDay)} y={13} textAnchor="middle" className="fill-background font-mono text-[10px] font-semibold">FIRST PROBLEM · DAY {firstProblemDay}</text>
        </g>
      )}
    </svg>
  );
}

/** Tiny sparkline for the material picker. */
export function Spark({ series }: { series: MaterialSeries }) {
  const W = 120, H = 28; const pts = series.points;
  const max = Math.max(...pts.map((p) => p.stock), series.safetyStock) || 1;
  const x = (i: number) => (i / (pts.length - 1)) * W, y = (v: number) => H - 2 - (v / max) * (H - 4);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-7 w-full" aria-hidden>
      <line x1={0} x2={W} y1={y(series.safetyStock)} y2={y(series.safetyStock)} className="stroke-risk" strokeDasharray="3 2" />
      <polyline fill="none" strokeWidth={1.5} className="stroke-foreground" points={pts.map((p, i) => `${x(i)},${y(p.stock)}`).join(" ")} />
    </svg>
  );
}
