/** Shared presentational primitives for PharmaSentinel. */
import { AlertTriangle, CheckCircle2, XOctagon } from "lucide-react";
import type { ReactNode } from "react";
import type { Verdict } from "@/lib/types";
import { cn } from "@/lib/utils";

export const VERDICT_META: Record<Verdict, { label: string; Icon: typeof CheckCircle2; text: string; bg: string; border: string }> = {
  FEASIBLE: { label: "Feasible", Icon: CheckCircle2, text: "text-feasible", bg: "bg-feasible-soft", border: "border-feasible" },
  AT_RISK: { label: "At risk", Icon: AlertTriangle, text: "text-risk", bg: "bg-risk-soft", border: "border-risk" },
  INFEASIBLE: { label: "Infeasible", Icon: XOctagon, text: "text-infeasible", bg: "bg-infeasible-soft", border: "border-infeasible" },
};

/** Status chip — always icon + label + colour. */
export function StatusBadge({ verdict, size = "sm" }: { verdict: Verdict; size?: "sm" | "lg" }) {
  const m = VERDICT_META[verdict];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded border font-mono font-medium uppercase tracking-wide", m.text, m.bg, m.border,
      size === "lg" ? "px-3 py-1.5 text-base" : "px-2 py-0.5 text-[11px]")}>
      <m.Icon className={size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5"} aria-hidden />
      {m.label}
    </span>
  );
}

export function Section({ id, index, title, hint, children, actions }: { id: string; index: number; title: string; hint?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-4">
      <header className="mb-3 flex items-end justify-between gap-4 border-b border-border pb-2">
        <div>
          <div className="eyebrow">§{String(index).padStart(2, "0")}</div>
          <h2 id={`${id}-h`} className="text-lg font-semibold tracking-tight">{title}</h2>
          {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
        </div>
        {actions}
      </header>
      {children}
    </section>
  );
}

export function Btn({ variant = "default", className, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "primary" | "ghost" | "approve" | "reject" }) {
  const v = {
    default: "border border-border bg-card hover:bg-secondary",
    primary: "bg-primary text-primary-foreground hover:opacity-90",
    ghost: "hover:bg-secondary text-muted-foreground hover:text-foreground",
    approve: "bg-feasible text-primary-foreground hover:opacity-90",
    reject: "border border-infeasible text-infeasible hover:bg-infeasible-soft",
  }[variant];
  return <button {...p} className={cn("inline-flex items-center justify-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition disabled:opacity-50", v, className)} />;
}
