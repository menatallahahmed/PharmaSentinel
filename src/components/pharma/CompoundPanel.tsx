/** Live public chemical data (PubChem) for materials that declare a pubchemQuery. */
import { useQuery } from "@tanstack/react-query";
import { Database, ExternalLink } from "lucide-react";
import { lookupCompound } from "@/lib/api";
import type { Material } from "@/lib/types";

function Row({ m }: { m: Material }) {
  const q = useQuery({ queryKey: ["pubchem", m.pubchemQuery], queryFn: () => lookupCompound(m.pubchemQuery!), staleTime: Infinity, retry: 1 });
  return (
    <li className="flex flex-wrap items-baseline justify-between gap-x-3 border-b border-border py-1.5 last:border-0">
      <span className="text-xs font-medium">{m.name}</span>
      {q.isLoading ? <span className="text-xs text-muted-foreground">Looking up…</span>
        : q.data ? (
          <a href={q.data.url} target="_blank" rel="noreferrer" className="tnum inline-flex items-center gap-1 text-xs text-primary hover:underline">
            CID {q.data.cid} · {q.data.formula} · {q.data.molecularWeight.toFixed(2)} g/mol <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        ) : <span className="text-xs text-muted-foreground">Not available offline</span>}
    </li>
  );
}

export function CompoundPanel({ materials }: { materials: Material[] }) {
  const ms = materials.filter((m) => m.pubchemQuery);
  if (!ms.length) return null;
  return (
    <div className="panel p-3">
      <div className="eyebrow mb-1 flex items-center gap-1.5"><Database className="h-3.5 w-3.5" aria-hidden /> Public chemical data · live from PubChem</div>
      <ul>{ms.map((m) => <Row key={m.id} m={m} />)}</ul>
    </div>
  );
}
