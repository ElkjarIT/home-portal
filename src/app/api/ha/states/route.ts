import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Only return the entities the dashboard needs (keeps response small for proxy)
const WANTED_ENTITIES = new Set([
  // Lights
  "light.stue",
  "light.kokken",
  "light.spisestue",
  "light.sovevaerelse",
  "light.entre",
  "light.bryggers",
  "light.thor",
  "light.freja",
  "light.walk_in",
  "light.krybekaelder",
  "light.udendors",
  "light.trappe",
  // Media
  "media_player.stuen_tv",
  // Printer toner
  "sensor.cnmf633c_635c_canon_cartridge_045_black_toner",
  "sensor.cnmf633c_635c_canon_cartridge_045_cyan_toner",
  "sensor.cnmf633c_635c_canon_cartridge_045_magenta_to",
  "sensor.cnmf633c_635c_canon_cartridge_045_yellow_ton",
  // Infrastructure devices (ping / online status)
  "device_tracker.ha",
  "device_tracker.nas01",
  "device_tracker.pve_1",
  "device_tracker.valhalla",
  "device_tracker.immich01",
  "device_tracker.pihole_secondary",
  "device_tracker.stuen",
  "device_tracker.freja",
  "device_tracker.garagen",
  "device_tracker.usw2",
  "device_tracker.cannon",
  // Uptime sensors
  "sensor.valhalla_uptime",
  "sensor.stuen_uptime",
  "sensor.freja_uptime",
  "sensor.garagen_uptime",
  "sensor.usw2_uptime",
  // Energy — Grid
  "sensor.grid_connection_import_power",
  "sensor.grid_connection_import_power_l1",
  "sensor.grid_connection_import_power_l2",
  "sensor.grid_connection_import_power_l3",
  // Energy — Appliances
  "sensor.stue_pm_power",
  "sensor.krybekaelder_pm_network_rack_power",
  "sensor.fyrrum_pm_tumbler_power",
  "sensor.bryggers_pm_washing_machine_power",
  "sensor.koekken_pm_dishwasher_power",
  "sensor.krybekaelder_pm_circulation_pump_power",
  // Energy — Heat pump
  "sensor.varmepumpe_elforbrug_total",
  "sensor.varmepumpe_el_dag",
  // Energy — EV Charger (Bilskirner / Tesla)
  "sensor.bilskirner_charger_power",
  "sensor.bilskirner_charge_energy_added",
  "sensor.bilskirner_battery_level",
  "sensor.bilskirner_charging",
  "binary_sensor.bilskirner_charging",
]);

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
      { status: 503 }
    );
  }

  try {
    const res = await fetch(`${hassUrl}/api/states`, {
      headers: {
        Authorization: `Bearer ${hassToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch HA states" },
        { status: res.status }
      );
    }

    const all = await res.json();
    const filtered = Array.isArray(all)
      ? all.filter((e: { entity_id: string }) => WANTED_ENTITIES.has(e.entity_id))
      : [];
    return NextResponse.json(filtered);
  } catch {
    return NextResponse.json(
      { error: "Cannot reach Home Assistant" },
      { status: 502 }
    );
  }
}
