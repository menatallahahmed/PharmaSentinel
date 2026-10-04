import os, json, time, urllib. request, urllib.parse from fastapi import FastAPI from fastapi.middleware.cors import CORSMiddleware
app = FastAPI ()
app.add_middleware (CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
RUNS, AUDIT = i, Il
DEFAULT = dict(days=21, start=300, usage=20, waste=0.08, satety=40,
expiry_day=12, incoming_day=18, incoming_qty=400)
det simulatelp, usage_mult=1.0,
incoming_day=None, topup=0):
inc_day = incoming_day or pl"incoming_day"]
lotl, lot, shortage, trace = p["start"], 0.0, I, |]
use = pl"usage"] * (1 + p["waste"]) * usage_mult
for d in range(1, p["days"] + 1):
if d == inc_day: lot2 += pl"incoming_qty"] + topup
if d == pl"expiry_day"]: lot1 = 0.0
need = use
cakel = min(loti, need); lotl -= takel; need -= take.
take2 = min(lot2, need); lot2 -= take2; need -= take2
if need > le-9: shortage.append (d)
trace.append (dict(day=d, inventory-round(lot1 + lot2, 1)))
return dict(feasible=len(shortage) == 0, shortage_days=shortage, trace=trace)
def evidence(query="ELISA capture antibody stability storage"):
out = []
try:
u = ('https://www.ebi.ac.uk/europepmc/webservices/rest/search?format=json&pageSize=3&query="
+ urtlib.parse.quote(query))
r = json.load(urllib.request.urlopen(u, timeout=8))
for x in r["resultlist"]["result"]:
out.append(dict(source="Europe PMC"
except Exception as e:
soxeema get "dished, title, get "title"),
out. append (dict (source="Europe PMC"
out. append(dict(source="Synthetic inpu " types"error", title=str(e)))
, type="synthetic"
itle="Lot expiry day and shipment day are SYNTHETIC demo values, not lab measurements"))
return out
def 1lm (prompt) :
key = os.getenv ("GEMINI_API_KEY")
if not key: return None try:
url =f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={key}"
body = json.dumps(1"contents": (t"parts":
K"text": prompt}]}]}).encode()
eg = urllib.request.Request(url, body, {"Content-Type": "application/ison"})
return ison.load(urllib.request.urlopen(rea, timeout=20)) ["candidates"][0]["content"]["parts"] [0] ["text"]
except Exception:
return None
def log(run, agent, msg): AUDIT. append(dict(run=run, t=time, time(), agent=agent, msg=msg))
@app.get ("/health")
def health(): return {"ok": True, "llm": bool(os.getenv("GEMINI_API_KEY") )}
@app.get("/experiments")
def experiments(): return [dict(id="EXP-ELISA-21"
, name="21-day ELISA assay", **DEFAULT) ]
@app.post("/analyses")
det analyses bodv: dict = None):
p = {**DEFAULT, **((body or {}). get ("params") or {})}
run = f"run-{int(time.time())}"
ev = evidence(); log(run, "Evidence", f"{len(ev)} items")
base = simulate(p)
gap pr"coming day"Lot exexpiryday pl'expiry_day" 17, replacement day fpl'incoming_day ''")
hyps = l
dict(id="H1", text="Overconsumption exhausts capture antibody" , status="rejected", confidence=0.88,
why=f"Starting stock {p['start']} covers {p['start']/(pl'usage']*(1+p['waste'])):.1f} days, longer than expiry day {pl'expiry_day']}"),
dict(id="H2", text="Lot expiry before resupply creates stockout window", status="supported", confidence=0.90,
why=f"Shortage days {base|'shortage_days' ]}; {gap}-day gap"),
dict(id="H3", text="Waste rate causes late-run breach", status="plausible", confidence=0.60,
why="Non-blocking in baseline")]
s_reduce = simulate(p, usage_mult=0.7)
exp1 = dict(baseline=base, reduce_consumption=s_reduce)
log(run, "Experiment", f"Baseline feasible=(base|'feasible']}; -30% consumption feasible={s_reducel'feasible']}")
if not s_reducel"feasible"] and s_reducel"shortage_days"] == basel"shortage_days"]:
critic = "Reducing consumption is a FALSE FIX: the shortage window is unchanged because the lot expires, not because it is consumed."
else:
critic = "Reduction changes the outcome; reconsider H2."
log(run, "Critic", critic)
if not s_reducel"feasible"]:
decision = "Consumption reduction rejected. Next experiment: expedite replacement to the day before expiry and add a top-up."
exp2 = simulate(p, incoming_day=p|"expiry_day"] - 1, topup=100)
else:
decision = "Consumption reduction works; accept and test cost impact."
exp2 = s_reduce
log(run, "Planner", decision)
log|run, "Experiment", f"Experiment 2 feasible={exp2|'feasible']}")
narrative = 1lm(f"In 3 sentences, explain to a scientist: baseline shortage days {basel'shortage_days']}, "
f"-30% consumption shortage days {s_reducel'shortage_days']}, expedited+topup feasible={exp2|' feasible']).")
result = dict(runId=run, params=p, evidence=ev, hypotheses=hyps, experiment1=exp1,
critic=critic, planner=dict(decision=decision, Ilm_used=bool(narrative)), experiment2=exp2, narrative=narrative,
provenance=dict (published="Europe PMC items", synthetic="inventory/expiry/shipment values",
ai_generated="hypotheses, critic, planner", simulation="simulate()"),
audit=la for a in AUDIT if al"run"] == run], status="awaiting_approval")
RUNS [run] = result
return result
@app.post("/analyses/frun_id}/approvals") def approve(run_id: str, body: dict):
log (run_id, "Human", f"{body get|'decision' )} {body get('note', '')}")
RUNS [run_id] ["status"] = body-get("decision", "approved")
return RUNS [run_id]
