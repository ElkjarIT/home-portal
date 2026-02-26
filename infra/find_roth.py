import json, urllib.request

url = "http://10.10.20.108:8123/api/states"
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJiMWY3ZjA2YzM2ZDA0ZmJmODQ4OTZjNWE2OWQyYTY2YiIsImlhdCI6MTc3MTk2MzE3NSwiZXhwIjoyMDg3MzIzMTc1fQ.CXQqoEydta_NNkiWm25Pf1UoWQwCpv_FcTSv87pDwCU"

req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
with urllib.request.urlopen(req) as resp:
    states = json.load(resp)

# Show ALL Bilskirner entities
for s in states:
    eid = s["entity_id"]
    if "bilskirner" in eid:
        state = s["state"]
        unit = s["attributes"].get("unit_of_measurement", "")
        attrs = s.get("attributes", {})
        extra = ""
        if "last_changed" in s:
            extra = f"  changed={s['last_changed']}"
        print(f"{eid:60s} = {str(state):>15s} {unit:>5s}{extra}")
