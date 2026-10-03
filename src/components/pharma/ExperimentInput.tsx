/** §01 Experiment Input — editable experiment + materials table. */
import { ExternalLink, Play, Plus, Trash2, X } from "lucide-react";
import { CompoundPanel } from "./CompoundPanel";
import { useState } from "react";
import type { Experiment, Material } from "@/lib/types";
import { Btn } from "./ui";

type NumKey = "currentInventory" | "dailyConsumption" | "wastePct" | "safetyStock" | "supplierLeadTimeDays" | "expiryDay";
const NUM_COLS: { key: NumKey; label: string }[] = [
  { key: "currentInventory", label: "Inventory" },
  { key: "dailyConsumption", label: "Daily use" },
  { key: "wastePct", label: "Waste %" },
  { key: "safetyStock", label: "Safety" },
  { key: "supplierLeadTimeDays", label: "Lead (d)" },
  { key: "expiryDay", label: "Expiry day" },
];

export function ExperimentInput({ exp, onChange, onRun, running }: { exp: Experiment; onChange: (e: Experiment) => void; onRun: () => void; running: boolean }) {
  const setMat = (id: string, patch: Partial<Material>) => onChange({ ...exp, materials: exp.materials.map((m) => (m.id === id ? { ...m, ...patch } : m)) });
  const addMat = () => onChange({ ...exp, materials: [...exp.materials, { id: `m-${Date.now()}`, name: "New material", unit: "units", currentInventory: 0, dailyConsumption: 0, wastePct: 0, safetyStock: 0, supplierLeadTimeDays: 7, expiryDay: 999, shelfLifeDays: 180, incomingShipments: [], critical: false, unitCost: 1 }] });

  return (
    <div className="space-y-3">
      <div className="panel grid gap-3 p-3 md:grid-cols-[2fr_3fr_auto_auto_auto]">
        <label className="text-xs"><span className="eyebrow">Title</span><input className="field mt-1" value={exp.title} onChange={(e) => onChange({ ...exp, title: e.target.value })} /></label>
        <label className="text-xs"><span className="eyebrow">Description</span><input className="field mt-1" value={exp.description} onChange={(e) => onChange({ ...exp, description: e.target.value })} /></label>
        <label className="text-xs"><span className="eyebrow">Duration (d)</span><input type="number" className="field tnum mt-1 w-20" value={exp.durationDays} onChange={(e) => onChange({ ...exp, durationDays: +e.target.value })} /></label>
        <label className="text-xs"><span className="eyebrow">Start day</span><input type="number" className="field tnum mt-1 w-20" value={exp.startDay} onChange={(e) => onChange({ ...exp, startDay: +e.target.value })} /></label>
        <label className="text-xs"><span className="eyebrow">Deadline</span><input type="number" className="field tnum mt-1 w-20" value={exp.deadlineDay ?? ""} placeholder="—" onChange={(e) => onChange({ ...exp, deadlineDay: e.target.value ? +e.target.value : null })} /></label>
      </div>

      {exp.protocol && (
        <p className="text-xs text-muted-foreground">
          <span className="eyebrow">Protocol basis </span>
          <a href={exp.protocol.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline">{exp.protocol.title}<ExternalLink className="h-3 w-3" aria-hidden /></a> · {exp.protocol.source}
        </p>
      )}
      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[1100px] text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="eyebrow px-2 py-2">Material</th><th className="eyebrow px-2">Unit</th>
              {NUM_COLS.map((c) => <th key={c.key} className="eyebrow px-2 text-right">{c.label}</th>)}
              <th className="eyebrow px-2">Incoming shipments</th><th className="eyebrow px-2">Critical</th><th />
            </tr>
          </thead>
          <tbody>
            {exp.materials.map((m) => (
              <tr key={m.id} className="border-b border-border last:border-0 align-top">
                <td className="p-1.5"><input aria-label="Material name" className="field" value={m.name} onChange={(e) => setMat(m.id, { name: e.target.value })} />
                  {m.catalogNumber && <div className="tnum mt-0.5 truncate px-0.5 text-[10px] text-muted-foreground" title={`${m.supplier} ${m.catalogNumber}`}>{m.supplier} · {m.catalogNumber}</div>}</td>
                <td className="p-1.5"><input aria-label="Unit" className="field w-16" value={m.unit} onChange={(e) => setMat(m.id, { unit: e.target.value })} /></td>
                {NUM_COLS.map((c) => (
                  <td key={c.key} className="p-1.5"><input aria-label={`${m.name} ${c.label}`} type="number" className="field tnum w-20 text-right" value={m[c.key]} onChange={(e) => setMat(m.id, { [c.key]: +e.target.value })} /></td>
                ))}
                <td className="p-1.5"><Shipments m={m} onChange={(s) => setMat(m.id, { incomingShipments: s })} /></td>
                <td className="p-1.5 text-center">
                  <input type="checkbox" aria-label={`${m.name} critical`} className="h-4 w-4 accent-primary" checked={m.critical} onChange={(e) => setMat(m.id, { critical: e.target.checked })} />
                </td>
                <td className="p-1.5"><Btn variant="ghost" aria-label={`Remove ${m.name}`} onClick={() => onChange({ ...exp, materials: exp.materials.filter((x) => x.id !== m.id) })}><Trash2 className="h-4 w-4" /></Btn></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CompoundPanel materials={exp.materials} />
      <div className="flex items-center justify-between">
        <Btn onClick={addMat}><Plus className="h-4 w-4" /> Add material</Btn>
        <Btn variant="primary" className="px-5 py-2.5 text-base" onClick={onRun} disabled={running}>
          <Play className="h-4 w-4" /> {running ? "Running agents…" : "Run feasibility analysis"}
        </Btn>
      </div>
    </div>
  );
}

function Shipments({ m, onChange }: { m: Material; onChange: (s: Material["incomingShipments"]) => void }) {
  const [day, setDay] = useState(""); const [qty, setQty] = useState("");
  return (
    <div className="flex flex-wrap items-center gap-1">
      {m.incomingShipments.map((s, i) => (
        <span key={i} className="tnum inline-flex items-center gap-1 rounded bg-accent px-1.5 py-0.5 text-xs text-accent-foreground">
          d{s.arrivalDay} · +{s.quantity}
          <button aria-label="Remove shipment" onClick={() => onChange(m.incomingShipments.filter((_, j) => j !== i))}><X className="h-3 w-3" /></button>
        </span>
      ))}
      <input aria-label="Shipment day" placeholder="day" className="field tnum w-12 !px-1 !py-0.5 text-xs" value={day} onChange={(e) => setDay(e.target.value)} />
      <input aria-label="Shipment quantity" placeholder="qty" className="field tnum w-14 !px-1 !py-0.5 text-xs" value={qty} onChange={(e) => setQty(e.target.value)} />
      <button aria-label="Add shipment" className="rounded border border-border p-0.5 hover:bg-secondary" onClick={() => { if (day && qty) { onChange([...m.incomingShipments, { arrivalDay: +day, quantity: +qty }]); setDay(""); setQty(""); } }}><Plus className="h-3.5 w-3.5" /></button>
    </div>
  );
}
