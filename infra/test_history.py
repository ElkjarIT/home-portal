import json, urllib.request
from datetime import datetime, timedelta, timezone

url_base = "http://10.10.20.108:8123/api"
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJiMWY3ZjA2YzM2ZDA0ZmJmODQ4OTZjNWE2OWQyYTY2YiIsImlhdCI6MTc3MTk2MzE3NSwiZXhwIjoyMDg3MzIzMTc1fQ.CXQqoEydta_NNkiWm25Pf1UoWQwCpv_FcTSv87pDwCU"
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

now = datetime.now(timezone.utc)
start = (now - timedelta(days=7)).strftime("%Y-%m-%dT00:00:00+00:00")
end = now.strftime("%Y-%m-%dT%H:%M:%S+00:00")

# 1) Try history/period with proper params
entity = "sensor.grid_connection_import_energy"
history_url = f"{url_base}/history/period/{start}?filter_entity_id={entity}&end_time={end}&minimal_response=true&significant_changes_only=true"
print(f"=== 1) History/period ===")
req = urllib.request.Request(history_url, headers=headers)
try:
    resp = urllib.request.urlopen(req)
    data = json.loads(resp.read())
    if data and len(data) > 0:
        entries = data[0]
        print(f"Got {len(entries)} entries")
        if entries:
            print(f"First: {json.dumps(entries[0])}")
            print(f"Last:  {json.dumps(entries[-1])}")
            # One per day
            seen = set()
            for e in entries:
                lc = e.get("last_changed", e.get("lu", ""))
                day = lc[:10]
                if day not in seen:
                    seen.add(day)
                    print(f"  {day}: {e.get('state', e.get('s', 'N/A'))} Wh")
except Exception as ex:
    print(f"Error: {ex}")

# 2) Try WS-style REST endpoint for statistics
print("\n=== 2) recorder/statistics_during_period ===")
stats_body = json.dumps({
    "type": "recorder/statistics_during_period",
    "start_time": start,
    "end_time": end,
    "statistic_ids": ["sensor.grid_connection_import_energy"],
    "period": "day",
}).encode()
req2 = urllib.request.Request(f"{url_base}/template", headers=headers, method="POST")
# Actually try a simpler approach: just get today's first & last value via history
print("Skipping - trying simpler approach")

# 3) Get first reading of each of last 7 days
print("\n=== 3) Daily first readings ===")
for d in range(7, -1, -1):
    day_start = (now - timedelta(days=d)).replace(hour=0, minute=0, second=0, microsecond=0)
    day_end = day_start + timedelta(hours=1)
    url = f"{url_base}/history/period/{day_start.isoformat()}?filter_entity_id={entity}&end_time={day_end.isoformat()}&minimal_response=true"
    req3 = urllib.request.Request(url, headers=headers)
    try:
        resp3 = urllib.request.urlopen(req3)
        data3 = json.loads(resp3.read())
        if data3 and data3[0]:
            first = data3[0][0]
            val = first.get("state", first.get("s", "?"))
            print(f"  {day_start.strftime('%Y-%m-%d')}: {val} Wh")
        else:
            print(f"  {day_start.strftime('%Y-%m-%d')}: no data")
    except Exception as ex:
        print(f"  {day_start.strftime('%Y-%m-%d')}: error {ex}")
