import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const results: Record<string, unknown> = { ts: new Date().toISOString() };

  // Test HA
  const hassUrl = process.env.HASS_URL;
  const hassToken = process.env.HASS_TOKEN;
  results.haConfigured = !!(hassUrl && hassToken);
  results.hassUrl = hassUrl ?? "NOT SET";
  if (hassUrl && hassToken) {
    try {
      const r = await fetch(`${hassUrl}/api/states`, {
        headers: { Authorization: `Bearer ${hassToken}` },
        cache: "no-store",
      });
      const all = await r.json();
      const filtered = Array.isArray(all)
        ? all.filter((e: { entity_id: string }) =>
            e.entity_id.startsWith("light.") || e.entity_id === "media_player.stuen_tv"
          )
        : [];
      results.haStatus = r.status;
      results.haTotal = Array.isArray(all) ? all.length : 0;
      results.haFiltered = filtered.length;
      results.haSample = filtered.slice(0, 2).map((e: { entity_id: string; state: string }) => ({
        id: e.entity_id,
        state: e.state,
      }));
    } catch (e) {
      results.haError = String(e);
    }
  }

  // Test Immich
  const immichUrl = process.env.IMMICH_URL;
  const immichKey = process.env.IMMICH_API_KEY;
  results.immichConfigured = !!(immichUrl && immichKey);
  results.immichUrl = immichUrl ?? "NOT SET";
  if (immichUrl && immichKey) {
    try {
      const r = await fetch(`${immichUrl}/api/jobs`, {
        headers: { "x-api-key": immichKey },
        cache: "no-store",
      });
      results.immichStatus = r.status;
      if (r.ok) {
        const data = await r.json();
        results.immichQueues = Object.keys(data).length;
      }
    } catch (e) {
      results.immichError = String(e);
    }
  }

  return NextResponse.json(results);
}
