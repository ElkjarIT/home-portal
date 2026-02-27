import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Allowed service calls — keeps this endpoint locked-down.
 * Format: "domain/service" → list of allowed entity_id prefixes
 */
const ALLOWED_CALLS: Record<string, string[]> = {
  "light/turn_on": ["light."],
  "light/turn_off": ["light."],
  "media_player/turn_on": ["media_player."],
  "media_player/turn_off": ["media_player."],
  "remote/turn_on": ["remote."],
  "remote/turn_off": ["remote."],
};

export async function POST(req: NextRequest) {
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

  let body: { domain: string; service: string; entity_id: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { domain, service, entity_id } = body;
  if (!domain || !service || !entity_id) {
    return NextResponse.json(
      { error: "Missing domain, service, or entity_id" },
      { status: 400 }
    );
  }

  const key = `${domain}/${service}`;
  const prefixes = ALLOWED_CALLS[key];
  if (!prefixes) {
    return NextResponse.json(
      { error: `Service ${key} is not allowed` },
      { status: 403 }
    );
  }

  if (!prefixes.some((p) => entity_id.startsWith(p))) {
    return NextResponse.json(
      { error: `Entity ${entity_id} is not allowed for ${key}` },
      { status: 403 }
    );
  }

  try {
    const res = await fetch(
      `${hassUrl}/api/services/${domain}/${service}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hassToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ entity_id }),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `HA returned ${res.status}: ${text}` },
        { status: res.status }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Cannot reach Home Assistant" },
      { status: 502 }
    );
  }
}
