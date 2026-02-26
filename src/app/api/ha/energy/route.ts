import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const HASS_HEADERS = () => ({
  Authorization: `Bearer ${process.env.HASS_TOKEN}`,
  "Content-Type": "application/json",
});

// Device energy entities (running kWh totals) — we compute today's diff from history
const DEVICE_ENERGY_ENTITIES: { entity_id: string; name: string; unit: "Wh" | "kWh" }[] = [
  { entity_id: "sensor.grid_connection_import_energy", name: "Grid Total", unit: "Wh" },
  { entity_id: "sensor.stue_pm_energy", name: "Stue", unit: "kWh" },
  { entity_id: "sensor.krybekaelder_pm_network_rack_energy", name: "Network Rack", unit: "kWh" },
  { entity_id: "sensor.fyrrum_pm_tumbler_energy", name: "Tumbler", unit: "kWh" },
  { entity_id: "sensor.bryggers_pm_washing_machine_energy", name: "Washing Machine", unit: "kWh" },
  { entity_id: "sensor.koekken_pm_dishwasher_energy", name: "Dishwasher", unit: "kWh" },
  { entity_id: "sensor.varmepumpe_elforbrug_total", name: "Heat Pump", unit: "kWh" },
  { entity_id: "sensor.bilskirner_charge_energy_added", name: "EV Charger", unit: "kWh" },
];

type HistEntry = { state: string; last_changed?: string };

/** Fetch one day of history for an entity and return first/last numeric values */
async function fetchDayBounds(
  hassUrl: string,
  entityId: string,
  dayStart: Date,
  dayEnd: Date,
): Promise<{ first: number; last: number } | null> {
  const sISO = dayStart.toISOString();
  const eISO = dayEnd.toISOString();
  const url = `${hassUrl}/api/history/period/${sISO}?end_time=${eISO}&filter_entity_id=${entityId}`;
  try {
    const res = await fetch(url, { headers: HASS_HEADERS(), cache: "no-store" });
    if (!res.ok) return null;
    const data: HistEntry[][] = await res.json();
    const entries = data[0] ?? [];
    if (entries.length === 0) return null;
    const first = parseFloat(entries[0].state);
    const last = parseFloat(entries[entries.length - 1].state);
    if (isNaN(first) || isNaN(last)) return null;
    return { first, last };
  } catch {
    return null;
  }
}

/**
 * Returns:
 *  - dailyKwh: 7-day grid consumption chart data
 *  - todayKwh: grid kWh today
 *  - deviceToday: per-device kWh used today
 */
export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hassUrl = process.env.HASS_URL;
  if (!hassUrl || !process.env.HASS_TOKEN) {
    return NextResponse.json({ error: "Home Assistant not configured" }, { status: 503 });
  }

  try {
    const now = new Date();

    // ———— 1. 7-day grid chart: per-day queries in parallel ————
    const gridEntity = "sensor.grid_connection_import_energy";
    const dayPromises: Promise<{ date: string; bounds: { first: number; last: number } | null }>[] = [];

    for (let daysAgo = 7; daysAgo >= 0; daysAgo--) {
      const dayStart = new Date(now);
      dayStart.setUTCDate(dayStart.getUTCDate() - daysAgo);
      dayStart.setUTCHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);
      const dateStr = dayStart.toISOString().slice(0, 10);
      dayPromises.push(
        fetchDayBounds(hassUrl, gridEntity, dayStart, dayEnd).then((bounds) => ({
          date: dateStr,
          bounds,
        })),
      );
    }

    // ———— 2. Today's per-device kWh: parallel queries ————
    const todayStart = new Date(now);
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);

    const devicePromises = DEVICE_ENERGY_ENTITIES.map((dev) =>
      fetchDayBounds(hassUrl, dev.entity_id, todayStart, todayEnd).then((bounds) => ({
        entity_id: dev.entity_id,
        name: dev.name,
        unit: dev.unit,
        bounds,
      })),
    );

    // Await everything in parallel
    const [dayResults, deviceResults] = await Promise.all([
      Promise.all(dayPromises),
      Promise.all(devicePromises),
    ]);

    // ———— Build 7-day chart data ————
    const dailyKwh: { date: string; kwh: number }[] = [];
    for (const { date, bounds } of dayResults) {
      if (bounds) {
        const diffWh = bounds.last - bounds.first;
        dailyKwh.push({ date, kwh: Math.round((diffWh / 1000) * 100) / 100 });
      }
    }

    // Today's grid kWh
    const todayGrid = dayResults.find((d) => d.date === now.toISOString().slice(0, 10));
    const todayKwh = todayGrid?.bounds
      ? Math.round(((todayGrid.bounds.last - todayGrid.bounds.first) / 1000) * 100) / 100
      : 0;

    // ———— Build per-device today data ————
    const deviceToday: { name: string; kwh: number }[] = [];
    for (const dev of deviceResults) {
      if (dev.bounds && dev.name !== "Grid Total") {
        const diffRaw = dev.bounds.last - dev.bounds.first;
        const kwh = dev.unit === "Wh" ? diffRaw / 1000 : diffRaw;
        deviceToday.push({ name: dev.name, kwh: Math.round(kwh * 100) / 100 });
      }
    }

    return NextResponse.json({ dailyKwh, todayKwh, deviceToday });
  } catch {
    return NextResponse.json({ error: "Cannot reach Home Assistant" }, { status: 502 });
  }
}
