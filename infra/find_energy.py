import json, urllib.request

url = "http://10.10.20.108:8123/api/states"
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJiMWY3ZjA2YzM2ZDA0ZmJmODQ4OTZjNWE2OWQyYTY2YiIsImlhdCI6MTc3MTk2MzE3NSwiZXhwIjoyMDg3MzIzMTc1fQ.CXQqoEydta_NNkiWm25Pf1UoWQwCpv_FcTSv87pDwCU"
req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
data = json.loads(urllib.request.urlopen(req).read())

print("=== ENERGY / POWER / ELECTRICITY ENTITIES ===")
print()
keywords = ["energy", "power", "watt", "kwh", "electricity", "consumption", "voltage", "current_a", "ampere"]
for e in sorted(data, key=lambda x: x["entity_id"]):
    eid = e["entity_id"].lower()
    attrs = e.get("attributes", {})
    unit = str(attrs.get("unit_of_measurement", "")).lower()
    friendly = str(attrs.get("friendly_name", ""))
    device_class = str(attrs.get("device_class", ""))
    
    is_match = (
        any(k in eid for k in keywords)
        or unit in ["w", "kw", "kwh", "wh", "v", "a", "va"]
        or device_class in ["energy", "power", "voltage", "current"]
    )
    
    if is_match:
        print(f"  {e['entity_id']}")
        print(f"    state: {e['state']} {unit}")
        print(f"    friendly_name: {friendly}")
        print(f"    device_class: {device_class}")
        print(f"    state_class: {attrs.get('state_class', 'N/A')}")
        print()
