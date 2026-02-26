import json, sys, urllib.request
url = "http://10.10.20.108:8123/api/states"
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJiMWY3ZjA2YzM2ZDA0ZmJmODQ4OTZjNWE2OWQyYTY2YiIsImlhdCI6MTc3MTk2MzE3NSwiZXhwIjoyMDg3MzIzMTc1fQ.CXQqoEydta_NNkiWm25Pf1UoWQwCpv_FcTSv87pDwCU"
req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
data = json.loads(urllib.request.urlopen(req).read())

trackers = [
    "device_tracker.ha", "device_tracker.pve_1", "device_tracker.valhalla",
    "device_tracker.nas01", "device_tracker.immich01", "device_tracker.pihole_secondary",
    "device_tracker.stuen", "device_tracker.freja", "device_tracker.garagen",
    "device_tracker.usw2", "device_tracker.cannon",
]

print("=== DEVICE TRACKER DETAILS ===")
for e in data:
    if e["entity_id"] in trackers:
        print(f"\n  {e['entity_id']}")
        print(f"    state: {e['state']}")
        print(f"    last_changed: {e.get('last_changed', 'N/A')}")
        print(f"    last_updated: {e.get('last_updated', 'N/A')}")
        attrs = e.get("attributes", {})
        for k, v in attrs.items():
            print(f"    attr.{k}: {v}")

print("\n=== ALL UPTIME ENTITIES ===")
for e in data:
    if "uptime" in e["entity_id"].lower():
        print(f"  {e['entity_id']} = {e['state']}  (last_changed: {e.get('last_changed', 'N/A')})")
