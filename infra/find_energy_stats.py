#!/usr/bin/env python3
"""Discover HA long-term statistics and energy (kWh) entities."""
import json, requests, sys
from datetime import datetime, timedelta, timezone

HASS = "http://10.10.20.108:8123"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJiMWY3ZjA2YzM2ZDA0ZmJmODQ4OTZjNWE2OWQyYTY2YiIsImlhdCI6MTc3MTk2MzE3NSwiZXhwIjoyMDg3MzIzMTc1fQ.CXQqoEydta_NNkiWm25Pf1UoWQwCpv_FcTSv87pDwCU"
HEADERS = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}

# 1. Find all energy/kWh entities
print("=" * 60)
print("ENERGY (kWh) ENTITIES")
print("=" * 60)
r = requests.get(f"{HASS}/api/states", headers=HEADERS)
states = r.json()
for s in states:
    eid = s["entity_id"]
    attrs = s.get("attributes", {})
    uom = attrs.get("unit_of_measurement", "")
    dc = attrs.get("device_class", "")
    # Find entities with kWh, Wh, or energy device_class
    if uom in ("kWh", "Wh", "MWh") or dc == "energy":
        print(f"  {eid:60s} state={s['state']:>12s}  unit={uom:>5s}  dc={dc}")

# 2. Find *_dag / *_daily / *_today entities
print("\n" + "=" * 60)
print("TODAY/DAILY ENTITIES")
print("=" * 60)
for s in states:
    eid = s["entity_id"]
    if any(kw in eid for kw in ["_dag", "_daily", "_today", "_day"]):
        attrs = s.get("attributes", {})
        uom = attrs.get("unit_of_measurement", "")
        print(f"  {eid:60s} state={s['state']:>12s}  unit={uom}")

# 3. Test statistics API endpoint (if available)
print("\n" + "=" * 60)
print("TESTING STATISTICS API")
print("=" * 60)

# Try the recorder/statistics endpoint
now = datetime.now(timezone.utc)
start = now - timedelta(days=7)
start_iso = start.strftime("%Y-%m-%dT00:00:00Z")

# Standard REST endpoint attempts
for path in [
    f"/api/history/statistics/{start_iso}?statistic_ids=sensor.grid_connection_import_energy",
    f"/api/recorder/statistics_during_period/{start_iso}?statistic_ids=sensor.grid_connection_import_energy",
    f"/api/energy/solar_forecast",
]:
    url = f"{HASS}{path}"
    r2 = requests.get(url, headers=HEADERS)
    print(f"\n  GET {path}")
    print(f"  Status: {r2.status_code}")
    if r2.status_code == 200:
        data = r2.json()
        if isinstance(data, dict):
            for k in list(data.keys())[:3]:
                v = data[k]
                if isinstance(v, list):
                    print(f"    {k}: {len(v)} entries")
                    if v:
                        print(f"    First: {json.dumps(v[0], default=str)[:200]}")
                        print(f"    Last:  {json.dumps(v[-1], default=str)[:200]}")
                else:
                    print(f"    {k}: {json.dumps(v, default=str)[:100]}")
        elif isinstance(data, list):
            print(f"    {len(data)} entries")
            if data:
                print(f"    First: {json.dumps(data[0], default=str)[:200]}")
    else:
        print(f"  Body: {r2.text[:200]}")

# 4. Try WebSocket-style POST to /api/template (for testing)
# Also try fetching history for each of the last 7 days
print("\n" + "=" * 60)
print("PER-DAY HISTORY CHECK (grid import energy)")
print("=" * 60)
for days_ago in range(7, -1, -1):
    day_start = (now - timedelta(days=days_ago)).replace(hour=0, minute=0, second=0, microsecond=0)
    day_end = day_start + timedelta(days=1)
    s_iso = day_start.strftime("%Y-%m-%dT%H:%M:%SZ")
    e_iso = day_end.strftime("%Y-%m-%dT%H:%M:%SZ")
    url = f"{HASS}/api/history/period/{s_iso}?end_time={e_iso}&filter_entity_id=sensor.grid_connection_import_energy"
    r3 = requests.get(url, headers=HEADERS)
    if r3.status_code == 200:
        entries = r3.json()[0] if r3.json() else []
        if entries:
            first_val = entries[0]["state"]
            last_val = entries[-1]["state"]
            first_ts = entries[0].get("last_changed", "")[:19]
            last_ts = entries[-1].get("last_changed", "")[:19]
            diff_wh = float(last_val) - float(first_val)
            print(f"  {day_start.strftime('%Y-%m-%d')}: {len(entries):5d} entries | {first_val}→{last_val} Wh | diff={diff_wh:.0f} Wh = {diff_wh/1000:.2f} kWh | ts: {first_ts} → {last_ts}")
        else:
            print(f"  {day_start.strftime('%Y-%m-%d')}: NO DATA")
    else:
        print(f"  {day_start.strftime('%Y-%m-%d')}: HTTP {r3.status_code}")
