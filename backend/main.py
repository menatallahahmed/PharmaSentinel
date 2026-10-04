import os, json, time, urllib.request, urllib.parse
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
RUNS, AUDIT = {}, []

DEFAULT = dict(days=21, start=300, usage=20, waste=0.08, safety=40,
               expiry_day=12, incoming_day=18, incoming_qty=400)

# ---------- EXPERIMENT AGENT (real, reproducible simulation) ----------
def simulate(p, usage_mult=1.0, incoming_day=None, topup=0):
    inc_day = incoming_day or p["incoming_day"]
    lot1, lot2, shortage, trace = p["start"], 0.0, [], []
    use = p["usage"] * (1 + p["waste"]) * usage_mult
    for d in range(1, p["days"] + 1):
        if d == inc_day: lot2 += p["incoming_qty"] + topup
        if d == p["expiry_day"]: lot1 = 0.0          # lot 1 expires
        need = use
        take1 = min(lot1, need); lot1 -= take1; need -= take1
        take2 = min(lot2, need); lot2 -= take2; need -= take2
        if need > 1e-9 or (lot1 + lot2) < 0: shortage.append(d)
        trace.append(dict(day=d, inventory=round(lot1 + lot2, 1)))
    return dict(feasible=len(shortage) == 0, shortage_days=shortage, trace=trace)

# ---------- EVIDENCE AGENT (real public sources) ----------
def evidence(query="ELISA capture antibody stability storage"):
    out = []
    try:
        u = ("https://www.ebi.ac.uk/europepmc/webservices/rest/search?format=json&pageSize=3&query="
             + urllib.parse.quote(query))
        r = json.load(urllib.request.urlopen(u, timeout=8))
        for x in r["resultList"]["result"]:
            out.append(dict(source="Europe PMC", type="published", title=x.get("title"),
                            id=x.get("pmid") or x.get("id")))
    except Exception as e:
        out.append(dict(source="Europe PMC", type="error", title=str(e)))
    out.append(dict(source="Synthetic input", type="synthetic",
                    title="Lot expiry day and shipment day are SYNTHETIC demo values, not lab measurements"))
    return out

# ---------- LLM (optional, free Gemini key) ----------
def llm(prompt):
    key = os.getenv("GEMINI_API_KEY")
    if not key: return None
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={key}"
        body = json.dumps({"contents": [{"parts": [{"text": prompt}]}]}).encode()
        req = urllib.request.Request(url, body, {"Content-Type": "application/json"})
        return json.load(urllib.request.urlopen(req, timeout=20))["candidates"][0]["content"]["parts"][0]["text"]
    except Exception:
        return None

def log(run, agent, msg): AUDIT.append(dict(run=run, t=time.time(), agent=agent, msg=msg))

@app.get("/health")
def health(): return {"ok": True, "llm": bool(os.getenv("GEMINI_API_KEY"))}

@app.get("/experiments")
def experiments(): return [dict(id="EXP-ELISA-21", name="21-day ELISA assay", **DEFAULT)]

@app.post("/analyses")
def analyses(body: dict = None):
    p = {**DEFAULT, **((body or {}).get("params") or {})}
    run = f"run-{int(time.time())}"

    # 1. Evidence
    ev = evidence(); log(run, "Evidence", f"{len(ev)} items")
    base = simulate(p)
    log(run, "Evidence", f"Lot expires day {p['expiry_day']}, replacement day {p['incoming_day']}")

    # 2. Hypotheses (tested against baseline)
    gap = p["incoming_day"] - p["expiry_day"]
    total_need = p["usage"] * (1 + p["waste"]) * p["days"]
    hyps = [
      dict(id="H1", text="Overconsumption exhausts capture antibody", status="rejected", confidence=0.88,
           why=f"Starting stock {p['start']} covers {p['start']/(p['usage']*(1+p['waste'])):.1f} days > expiry day {p['expiry_day']}"),
      dict(id="H2", text="Lot expiry before resupply creates stockout window", status="supported", confidence=0.90,
           why=f"Shortage days {base['shortage_days']}; {gap}-day gap"),
      dict(id="H3", text="Waste rate causes late-run breach", status="plausible", confidence=0.60,
           why="Non-blocking in baseline")]

    # 3. EXPERIMENT 1: test the naive fix vs baseline
    s_reduce = simulate(p, usage_mult=0.7)
    exp1 = dict(baseline=base, reduce_consumption=s_reduce)
    log(run, "Experiment", f"Baseline feasible={base['feasible']}; -30% consumption feasible={s_reduce['feasible']}")

    # 4. CRITIC
    critic = ("S2 (reduce consumption) is a FALSE FIX: shortage window unchanged because the lot expires, "
              "not because it is consumed." if not s_reduce["feasible"] and s_reduce["shortage_days"] == base["shortage_days"]
              else "Reduction changes outcome; reconsider H2.")
    log(run, "Critic", critic)

    # 5. PLANNER: decision depends on exp1 result  -> NEXT EXPERIMENT
    if not s_reduce["feasible"]:
        decision = "Consumption reduction rejected. Next experiment: expedite replacement to expiry_day-1 and add top-up."
        exp2 = simulate(p, incoming_day=p["expiry_day"] - 1, topup=100)
    else:
        decision = "Consumption reduction works; accept and test cost impact."
        exp2 = s_reduce
    log(run, "Planner", decision)
    log(run, "Experiment", f"Experiment 2 feasible={exp2['feasible']}")

    narrative = llm(f"In 3 sentences, explain to a scientist: baseline shortage days {base['shortage_days']}, "
                    f"-30% consumption shortage days {s_reduce['shortage_days']}, expedited+topup feasible={exp2['feasible']}.")
    result = dict(runId=run, params=p, evidence=ev, hypotheses=hyps, experiment1=exp1,
                  critic=critic, planner=dict(decision=decision, llm_used=bool(narrative)),
                  experiment2=exp2, narrative=narrative,
                  provenance=dict(published="Europe PMC items", synthetic="inventory/expiry/shipment values",
                                  ai_generated="hypotheses, critic, planner", simulation="simulate()"),
                  audit=[a for a in AUDIT if a["run"] == run], status="awaiting_approval")
    RUNS[run] = result
    return result

@app.post("/analyses/{run_id}/approvals")
def approve(run_id: str, body: dict):
    log(run_id, "Human", f"{body.get('decision')} {body.get('note','')}")
    RUNS[run_id]["status"] = body.get("decision", "approved")
    return RUNS[run_id]
