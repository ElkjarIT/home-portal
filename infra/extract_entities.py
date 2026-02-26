#!/usr/bin/env python3
"""Extract entity IDs from a Home Assistant states JSON dump."""

import json
import sys

HA_STATES_FILE = "/tmp/ha_states.json"

def main():
    try:
        with open(HA_STATES_FILE, "r") as f:
            states = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Error reading {HA_STATES_FILE}: {e}", file=sys.stderr)
        sys.exit(1)

    entities = sorted(states, key=lambda e: e["entity_id"])

    print(f"=== PRINTER / TONER / INK / CANON ===")
    for e in entities:
        eid = e["entity_id"].lower()
        fn = (e.get("attributes") or {}).get("friendly_name", "")
        combined = eid + " " + fn.lower()
        if any(w in combined for w in ("canon", "printer", "toner", "ink", "cartridge")):
            print(f"  {e['entity_id']} | state={e['state']} | name={fn}")

    print(f"\n=== UPTIME ENTITIES ===")
    for e in entities:
        eid = e["entity_id"].lower()
        fn = (e.get("attributes") or {}).get("friendly_name", "")
        if "uptime" in eid or "uptime" in fn.lower():
            print(f"  {e['entity_id']} | state={e['state']} | name={fn}")

    print(f"\n=== PING / DEVICE TRACKER ===")
    for e in entities:
        eid = e["entity_id"].lower()
        fn = (e.get("attributes") or {}).get("friendly_name", "")
        if "ping" in eid or eid.startswith("device_tracker.") or eid.startswith("binary_sensor.") and "ping" in eid:
            if "update." not in eid:
                print(f"  {e['entity_id']} | state={e['state']} | name={fn}")

    print(f"\n=== SENSOR DOMAINS (count) ===")
    domains = {}
    for e in entities:
        domain = e["entity_id"].split(".")[0]
        domains[domain] = domains.get(domain, 0) + 1
    for d, c in sorted(domains.items(), key=lambda x: -x[1]):
        print(f"  {d}: {c}")


if __name__ == "__main__":
    main()
