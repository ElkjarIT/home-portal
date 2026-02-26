import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Fetches energy data from Home Assistant:
 *  - 7-day grid import history → computes daily kWh totals
 *  - Returns { dailyKwh: { date: string; kwh: number }[], todayKwh: number }
 */
export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hassUrl = process.env.HASS_URL;
  const hassToken = process.env.HASS_TOKEN;

  if (!hassUrl || !hassToken) {
    return NextResponse.json(
      { error: "Home Assistant not configured" },
      { status: 503 },
    );
  }

  try {
    // Fetch 8 days of grid import energy history (running total in Wh)
    const now = new Date();
    const start = new Date(now);
    start.setUTCDate(start.getUTCDate() - 7);
    start.setUTCHours(0, 0, 0, 0);
    const startISO = start.toISOString().replace("+00:00", "Z");

    const entity = "sensor.grid_connection_import_energy";
    const url = `${hassUrl}/api/history/period/${startISO}?filter_entity_id=${entity}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${hassToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch HA history" },
        { status: res.status },
      );
    }

    const data: unknown[][] = await res.json();
    const entries = (data[0] ?? []) as {
      state: string;
      last_changed?: string;
    }[];

    // Group by day — collect first and last Wh reading per day
    const dayBounds: Record<string, { first: number; last: number }> = {};

    for (const e of entries) {
      const lc = e.last_changed ?? "";
      const day = lc.slice(0, 10); // "YYYY-MM-DD"
      if (!day) continue;
      const val = parseFloat(e.state);
      if (isNaN(val)) continue;

      if (!dayBounds[day]) {
        dayBounds[day] = { first: val, last: val };
      } else {
        dayBounds[day].last = val;
      }
    }

    // Compute daily consumption: diff between consecutive days' last readings
    const sortedDays = Object.keys(dayBounds).sort();
    const dailyKwh: { date: string; kwh: number }[] = [];

    for (let i = 1; i < sortedDays.length; i++) {
      const prevDay = sortedDays[i - 1];
      const currDay = sortedDays[i];
      // Daily consumption = last reading of current day - last reading of previous day
      // For today (partial), use current last - previous last
      const diff = dayBounds[currDay].last - dayBounds[prevDay].last;
      dailyKwh.push({
        date: currDay,
        kwh: Math.round((diff / 1000) * 100) / 100,
      });
    }

    // Today's kWh so far (from midnight first reading to latest)
    const todayStr = now.toISOString().slice(0, 10);
    const todayBound = dayBounds[todayStr];
    const todayKwh = todayBound
      ? Math.round(((todayBound.last - todayBound.first) / 1000) * 100) / 100
      : 0;

    return NextResponse.json({ dailyKwh, todayKwh });
  } catch {
    return NextResponse.json(
      { error: "Cannot reach Home Assistant" },
      { status: 502 },
    );
  }
}
