/**
 * API layer — the ONLY place components get data from.
 * Set VITE_API_BASE to point at the real backend; otherwise mock JSON + local
 * simulation is used. Response shapes are defined in `types.ts`.
 */
import experimentsJson from "@/data/experiments.json";
import analysesJson from "@/data/analyses.json";
import type { CompoundInfo, AgentOutput, AnalysisResult, ApprovalRecord, EvidenceItem, Experiment, Recommendation, ScenarioDefinition, ScenarioResult } from "./types";
import { applyPatches, simulate } from "./simulate";

const API_BASE = import.meta.env["VITE_API_BASE"] as string | undefined;

type MockAnalysis = { agents: AgentOutput[]; scenarios: ScenarioDefinition[]; recommendations: Recommendation[]; plannedScenarioId: string; evidence: EvidenceItem[] };
const analyses = analysesJson as unknown as Record<string, MockAnalysis>;
const approvals: Record<string, ApprovalRecord[]> = {};
const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: { "Content-Type": "application/json" }, ...init });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

/** GET /experiments */
export async function listExperiments(): Promise<Experiment[]> {
  if (API_BASE) return http("/experiments");
  return structuredClone(experimentsJson as Experiment[]);
}

/** Generic agent narrative for user-created experiments (mock only). */
function genericAnalysis(exp: Experiment): MockAnalysis {
  const sim = simulate(exp);
  const lim = exp.materials.find((m) => m.id === sim.limitingMaterialId);
  const text = lim ? `${lim.name} is the limiting material from day ${sim.firstProblemDay}.` : "No material constraints detected.";
  const agents: AgentOutput[] = (["evidence", "hypothesis", "experiment", "critic", "planner"] as const).map((id) => ({
    id, name: { evidence: "Evidence Agent", hypothesis: "Hypothesis Agent", experiment: "Experiment Agent", critic: "Critic Agent", planner: "Scientific Planner" }[id],
    role: "Automated review", summary: text, reasoning: [`Simulated ${exp.durationDays} days for ${exp.materials.length} materials.`], conclusion: text, confidence: 0.7, evidenceIds: [],
  }));
  const scenarios: ScenarioDefinition[] = lim ? [{ id: "S1", name: `Add safety buffer for ${lim.name}`, description: "Ship 50% extra of current inventory on day of first problem minus one.", patches: [{ materialId: lim.id, addShipments: [{ arrivalDay: Math.max(exp.startDay, (sim.firstProblemDay ?? 1) - 1), quantity: Math.ceil(lim.dailyConsumption * exp.durationDays) }] }], tradeOffs: ["Extra procurement cost"], costDelta: Math.round(lim.dailyConsumption * exp.durationDays * lim.unitCost) }] : [];
  return { agents, scenarios, recommendations: lim ? [{ id: "R1", action: scenarios[0]!.name, rationale: text, owner: "Researcher", dueDay: exp.startDay, scenarioId: "S1" }] : [{ id: "R1", action: "Proceed as planned", rationale: text, owner: "Researcher", dueDay: exp.startDay, scenarioId: "BASE" }], plannedScenarioId: lim ? "S1" : "BASE", evidence: [] };
}

/** POST /analyses  { experiment } → AnalysisResult. onProgress reports agent pipeline steps. */
export async function runAnalysis(exp: Experiment, onProgress?: (agentIndex: number) => void): Promise<AnalysisResult> {
  if (API_BASE) return http("/analyses", { method: "POST", body: JSON.stringify({ experiment: exp }) });
  for (let i = 0; i < 5; i++) { onProgress?.(i); await wait(450); }
  const base = simulate(exp);
  const mock = analyses[exp.id] ?? genericAnalysis(exp);
  const scenarios: ScenarioResult[] = mock.scenarios.map((s) => {
    const sim = simulate(applyPatches(exp, s.patches));
    const delta = sim.firstProblemDay === null ? "removes every problem day" : base.firstProblemDay === sim.firstProblemDay ? `first problem day unchanged (day ${sim.firstProblemDay})` : `moves first problem to day ${sim.firstProblemDay}`;
    return { ...s, verdict: sim.verdict, firstProblemDay: sim.firstProblemDay, limitingMaterialId: sim.limitingMaterialId, learning: `${sim.verdict.replace("_", " ")} — ${delta}.` };
  });
  const planned = mock.plannedScenarioId === "BASE" ? base.verdict : scenarios.find((s) => s.id === mock.plannedScenarioId)!.verdict;
  return {
    experiment: exp, simulation: base, agents: mock.agents, scenarios, recommendations: mock.recommendations,
    plannedOutcome: { scenarioId: mock.plannedScenarioId, verdict: planned }, evidence: mock.evidence,
    approvals: approvals[exp.id] ?? [], runId: `run-${Date.now().toString(36)}`, generatedAt: new Date().toISOString(),
  };
}

/** POST /analyses/{runId}/approvals */
export async function submitDecision(runId: string, experimentId: string, rec: Omit<ApprovalRecord, "id" | "at">): Promise<ApprovalRecord> {
  if (API_BASE) return http(`/analyses/${runId}/approvals`, { method: "POST", body: JSON.stringify(rec) });
  await wait(300);
  const full: ApprovalRecord = { ...rec, id: `A-${Math.random().toString(36).slice(2, 7).toUpperCase()}`, at: new Date().toISOString() };
  approvals[experimentId] = [full, ...(approvals[experimentId] ?? [])];
  return full;
}

/** Live public data: PubChem compound properties by name (no key, CORS-enabled). */
export async function lookupCompound(query: string): Promise<CompoundInfo | null> {
  const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(query)}/property/MolecularFormula,MolecularWeight,IUPACName/JSON`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  const p = json?.PropertyTable?.Properties?.[0];
  if (!p) return null;
  return { query, cid: p.CID, formula: p.MolecularFormula, molecularWeight: Number(p.MolecularWeight), iupacName: p.IUPACName ?? "", url: `https://pubchem.ncbi.nlm.nih.gov/compound/${p.CID}` };
}
