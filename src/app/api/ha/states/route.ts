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
