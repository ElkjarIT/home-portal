import json, urllib.request
from datetime import datetime, timedelta, timezone

base = "http://10.10.20.108:8123/api"
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJiMWY3ZjA2YzM2ZDA0ZmJmODQ4OTZjNWE2OWQyYTY2YiIsImlhdCI6MTc3MTk2MzE3NSwiZXhwIjoyMDg3MzIzMTc1fQ.CXQqoEydta_NNkiWm25Pf1UoWQwCpv_FcTSv87pDwCU"
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

entity = "sensor.grid_connection_import_energy"

# Get 8 days of history (to compute 7 full days of diffs)
start = (datetime.now(timezone.utc) - timedelta(days=7)).strftime("%Y-%m-%dT00:00:00Z")
url = f"{base}/history/period/{start}?filter_entity_id={entity}"

req = urllib.request.Request(url, headers=headers)
resp = urllib.request.urlopen(req)
data = json.loads(resp.read())
entries = data[0] if data else []

print(f"Total entries: {len(entries)}")

# Group by day - get first and last reading per day
from collections import defaultdict
daily = defaultdict(list)
for e in entries:
    lc = e.get("last_changed", "")
    if not lc:
        continue
    day = lc[:10]
    state = e.get("state", "")
    try:
        val = float(state)
        daily[day].append(val)
    except (ValueError, TypeError):
        pass

print("\n=== Daily energy readings (Wh running total) ===")
sorted_days = sorted(daily.keys())
for day in sorted_days:
    vals = daily[day]
    print(f"  {day}: first={vals[0]:.0f} Wh, last={vals[-1]:.0f} Wh, count={len(vals)}")

print("\n=== Daily consumption (kWh) ===")
for i in range(1, len(sorted_days)):
    prev_day = sorted_days[i-1]
    curr_day = sorted_days[i]
    prev_last = daily[prev_day][-1]
    curr_last = daily[curr_day][-1]
    diff_kwh = (curr_last - prev_last) / 1000
    print(f"  {curr_day}: {diff_kwh:.2f} kWh")

# Also show today's usage so far
if sorted_days:
    today = sorted_days[-1]
    today_first = daily[today][0]
    today_last = daily[today][-1]
    today_kwh = (today_last - today_first) / 1000
    print(f"\n  Today so far: {today_kwh:.2f} kWh (from midnight to now)")
