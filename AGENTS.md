<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Components get data only via `src/lib/api.ts` typed by `src/lib/types.ts`; mock data lives in `src/data/*.json` and `src/lib/simulate.ts` stands in for the backend — so swapping to a real API (VITE_API_BASE) needs no component changes.
# PharmaSentinel Agents

| Agent | Role | Input | Output |
|---|---|---|---|
| Evidence | Retrieves public literature (Europe PMC); flags synthetic data | Question | Cited evidence |
| Hypothesis | Proposes testable causes with confidence | Evidence | H1-H3 with status |
| Experiment | Runs reproducible day-by-day simulation | Parameters | Feasibility, shortage days |
| Critic | Challenges whether a fix addresses the cause | Experiment 1 result | Critique |
| Planner | Chooses the next experiment from the result | Result + critique | Experiment 2 |

## Policies
- No consequential action without human Approve / Modify / Reject.
- Synthetic inventory data is never presented as lab measurement.
- Every step is written to an audit log.
