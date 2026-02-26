import json, urllib.request

url = "http://10.10.20.108:8123/api/states"
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJiMWY3ZjA2YzM2ZDA0ZmJmODQ4OTZjNWE2OWQyYTY2YiIsImlhdCI6MTc3MTk2MzE3NSwiZXhwIjoyMDg3MzIzMTc1fQ.CXQqoEydta_NNkiWm25Pf1UoWQwCpv_FcTSv87pDwCU"

req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
with urllib.request.urlopen(req) as resp:
    states = json.load(resp)

# Find all light entities to see what exists
print("=== ALL LIGHT ENTITIES ===")
for s in states:
    eid = s["entity_id"]
    if eid.startswith("light."):
        name = s["attributes"].get("friendly_name", "")
        state = s["state"]
        model = s["attributes"].get("model", "")
        supported = s["attributes"].get("supported_color_modes", [])
        print(f"{eid} | {name} | {state} | model={model} | modes={supported}")

print("\n=== SHELLY ENTITIES (any domain) ===")
for s in states:
    eid = s["entity_id"]
    name = s["attributes"].get("friendly_name", "")
    if "shelly" in (eid + name).lower():
        state = s["state"]
        print(f"{eid} | {name} | {state}")
