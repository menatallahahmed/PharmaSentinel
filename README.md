# PharmaSentinel
Can a planned experiment stay feasible until completion under uncertain material supply?

Loop: Question -> Evidence -> Hypothesis -> Experiment 1 -> Result -> Critic -> Planner -> Experiment 2 -> Human approval

| Data | Source |
|---|---|
| Literature | Real: Europe PMC |
| Inventory, expiry, shipments | Synthetic demo values |
| Hypotheses, critique, plan | AI/rule-generated |
| Feasibility results | Computed by simulate() |

Omnigent: agent roles are specified in AGENTS.md and implemented in the backend. Omnigent model integration was blocked by model access in the free environment.
## Setup
Backend: pip install fastapi uvicorn, then cd backend and run: uvicorn main:app --port 8000
Endpoints: GET /health, GET /experiments, POST /analyses, POST /analyses/{run_id}/approvals, GET /benchmark
Frontend: npm install, then npm run dev (runs on built-in mock data and a local simulation unless VITE_API_BASE points at the backend)

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS

# PharmaSentinel (front-end prototype)

Run: `bun install && bun run dev` → http://localhost:8080

## Data contract
All types: `src/lib/types.ts`. Components only call `src/lib/api.ts`:
- `GET /experiments` → `Experiment[]`
- `POST /analyses` `{ experiment }` → `AnalysisResult` (simulation series, verdict, KPIs, agents, scenarios, recommendations, plannedOutcome, evidence, approvals)
- `POST /analyses/{runId}/approvals` → `ApprovalRecord`

Set `VITE_API_BASE` to switch from mock (`src/data/*.json` + `src/lib/simulate.ts`) to the real backend.
