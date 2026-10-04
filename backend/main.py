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
