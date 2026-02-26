import json, urllib.request

base = "http://10.10.20.108:8123/api"
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJiMWY3ZjA2YzM2ZDA0ZmJmODQ4OTZjNWE2OWQyYTY2YiIsImlhdCI6MTc3MTk2MzE3NSwiZXhwIjoyMDg3MzIzMTc1fQ.CXQqoEydta_NNkiWm25Pf1UoWQwCpv_FcTSv87pDwCU"
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

req = urllib.request.Request(f"{base}/states", headers=headers)
data = json.loads(urllib.request.urlopen(req).read())

print("=== ALL BILSKIRNER ENTITIES ===")
for e in sorted(data, key=lambda x: x["entity_id"]):
    if "bilskirner" in e["entity_id"].lower():
        attrs = e.get("attributes", {})
        print(f"  {e['entity_id']}")
        print(f"    state: {e['state']}")
        print(f"    unit: {attrs.get('unit_of_measurement', 'N/A')}")
        print(f"    friendly_name: {attrs.get('friendly_name', 'N/A')}")
        print(f"    device_class: {attrs.get('device_class', 'N/A')}")
        print()

# Also check grid_connection history format
print("=== GRID IMPORT HISTORY FORMAT (last 24h sample) ===")
from datetime import datetime, timedelta, timezone
now = datetime.now(timezone.utc)
start = (now - timedelta(days=1)).strftime("%Y-%m-%dT00:00:00Z")
url = f"{base}/history/period/{start}?filter_entity_id=sensor.grid_connection_import_energy"
req2 = urllib.request.Request(url, headers=headers)
data2 = json.loads(urllib.request.urlopen(req2).read())
if data2 and data2[0]:
    entries = data2[0]
    print(f"Entries: {len(entries)}")
    # Show first 3 entries fully
    for e in entries[:3]:
        print(f"  {json.dumps(e)[:300]}")
    print("  ...")
    # Show last 3
    for e in entries[-3:]:
        print(f"  {json.dumps(e)[:300]}")
    # Show entries from different days
    seen = set()
    for e in entries:
        lc = e.get("last_changed", e.get("last_updated", ""))
        day = lc[:10] if lc else ""
        if day and day not in seen:
            seen.add(day)
            print(f"\n  Day {day} first entry: state={e.get('state','?')}, last_changed={e.get('last_changed','N/A')}, last_updated={e.get('last_updated','N/A')}")
