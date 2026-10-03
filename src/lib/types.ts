/**
 * PharmaSentinel — API contract.
 * These types mirror exactly what the Python backend must return.
 * Components import ONLY these types + functions from `api.ts`.
 */

export type Verdict = "FEASIBLE" | "AT_RISK" | "INFEASIBLE";
export type DayStatus = "ok" | "below_safety" | "stockout";

export interface Shipment {
  arrivalDay: number;
  quantity: number;
}

export interface Material {
  id: string;
  name: string;
  unit: string;
  currentInventory: number;
  dailyConsumption: number;
  wastePct: number;
  safetyStock: number;
  supplierLeadTimeDays: number;
  /** Absolute day on which the current stock lot becomes unusable. */
  expiryDay: number;
  /** Shelf life (days) applied to incoming lots. */
  shelfLifeDays: number;
  incomingShipments: Shipment[];
  critical: boolean;
  unitCost: number;
  supplier?: string;
  catalogNumber?: string;
  /** Name used to look up public chemical data (PubChem). */
  pubchemQuery?: string;
}

export interface ProtocolRef { title: string; source: string; url: string }

/** Public compound record (PubChem PUG REST). */
export interface CompoundInfo {
  query: string;
  cid: number;
  formula: string;
  molecularWeight: number;
  iupacName: string;
  url: string;
}

export interface Experiment {
  id: string;
  title: string;
  description: string;
  durationDays: number;
  startDay: number;
  deadlineDay?: number | null;
  materials: Material[];
  protocol?: ProtocolRef;
}

export interface DayPoint {
  day: number;
  stock: number;
  arrived: number;
  expired: number;
  consumed: number;
  wasted: number;
  shortfall: number;
  status: DayStatus;
}

export interface MaterialSeries {
  materialId: string;
  safetyStock: number;
  points: DayPoint[];
  firstProblemDay: number | null;
  firstProblemType: DayStatus | null;
  expiryInWindow: boolean;
}

export interface Simulation {
  experimentId: string;
  verdict: Verdict;
  firstProblemDay: number | null;
  limitingMaterialId: string | null;
  kpis: {
    materialsMonitored: number;
    criticalAtRisk: number;
    safetyStockViolations: number;
    expiryRisks: number;
    projectedWasteCost: number;
  };
  series: MaterialSeries[];
}

export interface AgentOutput {
  id: "evidence" | "hypothesis" | "experiment" | "critic" | "planner";
  name: string;
  role: string;
  summary: string;
  reasoning: string[];
  conclusion: string;
  confidence: number;
  evidenceIds: string[];
}

export interface MaterialPatch {
  materialId: string;
  changes?: Partial<Omit<Material, "id" | "incomingShipments">>;
  replaceShipments?: Shipment[];
  addShipments?: Shipment[];
}

export interface ScenarioDefinition {
  id: string;
  name: string;
  description: string;
  patches: MaterialPatch[];
  tradeOffs: string[];
  costDelta: number;
}

export interface ScenarioResult extends ScenarioDefinition {
  verdict: Verdict;
  firstProblemDay: number | null;
  limitingMaterialId: string | null;
  learning: string;
}

export interface Recommendation {
  id: string;
  action: string;
  rationale: string;
  owner: string;
  dueDay: number;
  scenarioId: string;
}

export interface EvidenceItem {
  id: string;
  claim: string;
  source: "simulation" | "input" | "agent";
  agentId: AgentOutput["id"];
  materialId?: string;
  day?: number;
  metric?: keyof DayPoint;
}

export interface ApprovalRecord {
  id: string;
  decision: "APPROVED" | "MODIFIED" | "REJECTED";
  by: string;
  at: string;
  planSummary: string;
  note?: string | undefined;
}

export interface AnalysisResult {
  experiment: Experiment;
  simulation: Simulation;
  agents: AgentOutput[];
  scenarios: ScenarioResult[];
  recommendations: Recommendation[];
  plannedOutcome: { scenarioId: string; verdict: Verdict };
  evidence: EvidenceItem[];
  approvals: ApprovalRecord[];
  runId: string;
  generatedAt: string;
}
