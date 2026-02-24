import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const GET = auth(async function GET(req) {
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
      next: { revalidate: 10 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch HA states" },
        { status: res.status }
      );
    }

    const states = await res.json();
    return NextResponse.json(states);
  } catch {
    return NextResponse.json(
      { error: "Cannot reach Home Assistant" },
      { status: 502 }
    );
  }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
}) as any;
