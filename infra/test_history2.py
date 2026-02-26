import json, urllib.request
from datetime import datetime, timedelta, timezone

base = "http://10.10.20.108:8123/api"
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJiMWY3ZjA2YzM2ZDA0ZmJmODQ4OTZjNWE2OWQyYTY2YiIsImlhdCI6MTc3MTk2MzE3NSwiZXhwIjoyMDg3MzIzMTc1fQ.CXQqoEydta_NNkiWm25Pf1UoWQwCpv_FcTSv87pDwCU"
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

entity = "sensor.grid_connection_import_energy"

# Try different timestamp formats
formats = [
    "2026-02-26T00:00:00Z",
    "2026-02-26T00:00:00",
    "2026-02-26T00:00:00.000Z",
]

for fmt in formats:
    url = f"{base}/history/period/{fmt}?filter_entity_id={entity}"
    print(f"Trying: {url}")
    req = urllib.request.Request(url, headers=headers)
    try:
        resp = urllib.request.urlopen(req)
        data = json.loads(resp.read())
        if data and data[0]:
            print(f"  SUCCESS - {len(data[0])} entries")
            print(f"  First: {json.dumps(data[0][0])[:200]}")
            break
        else:
            print(f"  Empty response")
    except urllib.error.HTTPError as ex:
        body = ex.read().decode()[:300]
        print(f"  Error {ex.code}: {body}")
    except Exception as ex:
        print(f"  Error: {ex}")

# Also try without timestamp in path (gets last 24h)
print("\nTrying: no timestamp (default last day)")
url2 = f"{base}/history/period?filter_entity_id={entity}&minimal_response"
req2 = urllib.request.Request(url2, headers=headers)
try:
    resp2 = urllib.request.urlopen(req2)
    data2 = json.loads(resp2.read())
    if data2 and data2[0]:
        print(f"  SUCCESS - {len(data2[0])} entries")
        print(f"  First: {json.dumps(data2[0][0])[:200]}")
        print(f"  Last:  {json.dumps(data2[0][-1])[:200]}")
    else:
        print(f"  Empty")
except urllib.error.HTTPError as ex:
    body = ex.read().decode()[:300]
    print(f"  Error {ex.code}: {body}")

# Try the calendar/statistics websocket-like API
print("\nTrying: /api/calendars")
# Actually check if there's a statistics endpoint
for path in ["/api/statistics", "/api/recorder/statistics", "/api/history/statistics"]:
    url3 = f"{base.replace('/api','')}{path}"
    req3 = urllib.request.Request(url3, headers=headers)
    try:
        resp3 = urllib.request.urlopen(req3)
        print(f"  {path}: {resp3.status}")
    except urllib.error.HTTPError as ex:
        print(f"  {path}: {ex.code}")
