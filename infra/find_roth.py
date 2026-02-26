import json, urllib.request

url = "http://10.10.20.108:8123/api/states"
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJiMWY3ZjA2YzM2ZDA0ZmJmODQ4OTZjNWE2OWQyYTY2YiIsImlhdCI6MTc3MTk2MzE3NSwiZXhwIjoyMDg3MzIzMTc1fQ.CXQqoEydta_NNkiWm25Pf1UoWQwCpv_FcTSv87pDwCU"

req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
with urllib.request.urlopen(req) as resp:
    states = json.load(resp)

# Find all Bilskirner / Tessie entities
print("=== BILSKIRNER / TESSIE ENTITIES ===")
for s in states:
    eid = s["entity_id"]
    name = s["attributes"].get("friendly_name", "")
    search = (eid + name).lower()
    if "bilskirner" in search or "tessie" in search:
        state = s["state"]
        unit = s["attributes"].get("unit_of_measurement", "")
        device_class = s["attributes"].get("device_class", "")
        print(f"{eid} | {name} | {state} {unit} | class={device_class}")
