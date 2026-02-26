import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const GET = auth(async function GET(req) {
  console.log("[HA] GET /api/ha/states — auth:", !!req.auth);
  if (!req.auth) {
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

    const states = await res.json();
    console.log(`[HA] Fetched ${Array.isArray(states) ? states.length : 0} entities`);
    return NextResponse.json(states);
  } catch (e) {
    console.error("[HA] Error:", e);
    return NextResponse.json(
      { error: "Cannot reach Home Assistant" },
      { status: 502 }
    );
  }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
}) as any;
